export interface SpectralProfile {
  low: number;     // Energy in dB (0-250Hz)
  lowMid: number;  // Energy in dB (250-1000Hz)
  highMid: number; // Energy in dB (1k-4kHz)
  high: number;    // Energy in dB (4k-20kHz)
}

export class EQMatcher {
  private ctx: OfflineAudioContext | null = null;

  /**
   * Analyzes an uploaded WAV/MP3 file and returns its average spectral envelope.
   */
  public async analyzeReferenceTrack(arrayBuffer: ArrayBuffer): Promise<SpectralProfile> {
    // Create a temporary offline context to render the file
    this.ctx = new OfflineAudioContext(2, 44100 * 40, 44100); // Analyze up to 40 seconds
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    // Set up analyzer
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    
    const analyzer = this.ctx.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;
    
    source.connect(analyzer);
    analyzer.connect(this.ctx.destination);
    
    source.start(0);
    await this.ctx.startRendering(); // Fast-forward process

    // Extract frequency data
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyzer.getFloatFrequencyData(dataArray); // Returns values in dB (-100 to 0)

    // Calculate averages across 4 bands matching our Sonus EQ
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / bufferLength;

    let lowSum = 0, lowCount = 0;
    let lmSum = 0, lmCount = 0;
    let hmSum = 0, hmCount = 0;
    let hiSum = 0, hiCount = 0;

    for (let i = 0; i < bufferLength; i++) {
      const hz = i * hzPerBin;
      const db = dataArray[i];
      if (db === -Infinity) continue; // Skip silence

      if (hz < 250) {
        lowSum += db; lowCount++;
      } else if (hz < 1000) {
        lmSum += db; lmCount++;
      } else if (hz < 4000) {
        hmSum += db; hmCount++;
      } else {
        hiSum += db; hiCount++;
      }
    }

    // Normalize and map to a readable range (-24dB to +24dB relative)
    // Here we just return the raw average dB energy per band.
    return {
      low: lowCount > 0 ? lowSum / lowCount : -100,
      lowMid: lmCount > 0 ? lmSum / lmCount : -100,
      highMid: hmCount > 0 ? hmSum / hmCount : -100,
      high: hiCount > 0 ? hiSum / hiCount : -100,
    };
  }

  /**
   * Analyzes an active WebAudio AnalyserNode and returns the current spectral envelope.
   * Can be called inside a requestAnimationFrame loop for real-time tracking.
   */
  public analyzeLiveStream(analyzer: AnalyserNode, sampleRate: number): SpectralProfile {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyzer.getFloatFrequencyData(dataArray);

    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / bufferLength;

    let lowSum = 0, lowCount = 0;
    let lmSum = 0, lmCount = 0;
    let hmSum = 0, hmCount = 0;
    let hiSum = 0, hiCount = 0;

    for (let i = 0; i < bufferLength; i++) {
      const hz = i * hzPerBin;
      const db = dataArray[i];
      if (db === -Infinity || db < -120) continue; // Skip absolute silence/noise floor

      if (hz < 250) {
        lowSum += db; lowCount++;
      } else if (hz < 1000) {
        lmSum += db; lmCount++;
      } else if (hz < 4000) {
        hmSum += db; hmCount++;
      } else {
        hiSum += db; hiCount++;
      }
    }

    // Default to -100dB if no signal
    return {
      low: lowCount > 0 ? lowSum / lowCount : -100,
      lowMid: lmCount > 0 ? lmSum / lmCount : -100,
      highMid: hmCount > 0 ? hmSum / hmCount : -100,
      high: hiCount > 0 ? hiSum / hiCount : -100,
    };
  }

  /**
   * Compares the live FFT spectrum of a channel against the Reference Profile
   * and calculates corrective EQ gains (-12dB to +12dB) to apply to the Qu-16.
   */
  public calculateCorrectiveEQ(liveSpectrum: SpectralProfile, refProfile: SpectralProfile) {
    const maxDbCutBoost = 12;

    const clamp = (val: number) => Math.max(-maxDbCutBoost, Math.min(maxDbCutBoost, val));

    // The logic: If reference has MORE energy than live in a band, BOOST.
    // If reference has LESS energy than live, CUT.
    // We add a 'sensitivity' multiplier (0.5) to avoid extreme harsh cuts.
    return {
      low: clamp((refProfile.low - liveSpectrum.low) * 0.5),
      lowMid: clamp((refProfile.lowMid - liveSpectrum.lowMid) * 0.5),
      highMid: clamp((refProfile.highMid - liveSpectrum.highMid) * 0.5),
      high: clamp((refProfile.high - liveSpectrum.high) * 0.5),
    };
  }
}
