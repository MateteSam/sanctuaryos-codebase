'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ManagedCamera } from './useCameraManager';

// ── Public types ──────────────────────────────────────────────────────────────

export interface AudioBus {
  id: string;
  name: string;
  type: 'foh' | 'broadcast' | 'monitor';
  color: string;
  masterLevel: number;
  muted: boolean;
}

export interface ChannelEQ {
  low: number;     // dB  -12..+12  @ 200 Hz  (low shelf)
  lowMid: number;  // dB  -12..+12  @ 800 Hz  (peaking)
  highMid: number; // dB  -12..+12  @ 3.5 kHz (peaking)
  high: number;    // dB  -12..+12  @ 10 kHz  (high shelf)
}

export type AudioPresetId = 'worship_leader' | 'acoustic' | 'spoken_word' | 'flat';

export const AUDIO_PRESETS: Record<AudioPresetId, {
  name: string;
  eq: ChannelEQ;
  gateEnabled: boolean;
  compEnabled: boolean;
  hpfFreq: number;
}> = {
  worship_leader: { name: 'Worship Leader', eq: { low: -2, lowMid: -1, highMid: 2, high: 3 }, gateEnabled: true, compEnabled: true, hpfFreq: 100 },
  acoustic:       { name: 'Acoustic Guitar', eq: { low: -3, lowMid: -2, highMid: 2, high: 4 }, gateEnabled: false, compEnabled: true, hpfFreq: 120 },
  spoken_word:    { name: 'Spoken Word', eq: { low: 0, lowMid: -1, highMid: 2, high: 2 }, gateEnabled: true, compEnabled: true, hpfFreq: 80 },
  flat:           { name: 'Flat', eq: { low: 0, lowMid: 0, highMid: 0, high: 0 }, gateEnabled: false, compEnabled: false, hpfFreq: 80 },
};

export interface AudioChannel {
  id: string;
  label: string;
  preAmpGain: number;    // dB  -6..+24
  hpfFreq: number;       // Hz  20..500
  eq: ChannelEQ;
  gateEnabled: boolean;
  compEnabled: boolean;
  volume: number;        // fader 0..1.5
  pan: number;           // -1..+1  (0 = center)
  muted: boolean;
  soloed: boolean;
  isPastorMic: boolean;
  sends: Record<string, number>; // busId → 0..1.5
  presetId?: string;
}

export const DEFAULT_BUSES: AudioBus[] = [
  { id: 'foh',       name: 'FOH',       type: 'foh',       color: '#38bdf8', masterLevel: 0.85, muted: false },
  { id: 'broadcast', name: 'Broadcast', type: 'broadcast', color: '#a78bfa', masterLevel: 0.80, muted: false },
  { id: 'mon-1',     name: 'Mon 1',     type: 'monitor',   color: '#34d399', masterLevel: 0.80, muted: false },
  { id: 'mon-2',     name: 'Mon 2',     type: 'monitor',   color: '#fbbf24', masterLevel: 0.80, muted: false },
  { id: 'mon-3',     name: 'Mon 3',     type: 'monitor',   color: '#f472b6', masterLevel: 0.80, muted: false },
];

// ── Internal node maps ────────────────────────────────────────────────────────

interface ChannelNodes {
  source:     MediaStreamAudioSourceNode | MediaElementAudioSourceNode;
  preAmp:     GainNode;
  hpf:        BiquadFilterNode;
  lowShelf:   BiquadFilterNode;
  lowMidPeak: BiquadFilterNode;
  highMidPeak:BiquadFilterNode;
  highShelf:  BiquadFilterNode;
  gateGain:   GainNode;
  compressor: DynamicsCompressorNode;
  fader:      GainNode;
  analyser:   AnalyserNode;  // pre-fader signal meter
  sendGains:  Record<string, GainNode>; // busId → send GainNode
}

interface BusNodes {
  inputGain: GainNode;
  analyser:  AnalyserNode;
  limiter?:  DynamicsCompressorNode;
  airEq?:    BiquadFilterNode;
  streamDest?: MediaStreamAudioDestinationNode;
}

const dbToLinear = (db: number) => Math.pow(10, db / 20);

function buildDefaultSends(buses: AudioBus[], camType?: string): Record<string, number> {
  const sends: Record<string, number> = {};
  buses.forEach(b => {
    sends[b.id] = (b.type === 'foh' || b.type === 'broadcast') ? 1.0 : 0.0;
  });
  return sends;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAudioEngine(cameras: ManagedCamera[]) {
  const ctxRef   = useRef<AudioContext | null>(null);
  const channelNodesRef = useRef<Map<string, ChannelNodes>>(new Map());
  const busNodesRef     = useRef<Map<string, BusNodes>>(new Map());
  const rafRef          = useRef<number | null>(null);

  const [buses, setBuses]             = useState<AudioBus[]>(DEFAULT_BUSES);
  const [channels, setChannels]       = useState<AudioChannel[]>([]);
  const [channelLevels, setChannelLevels] = useState<Record<string, number>>({});
  const [busLevels, setBusLevels]     = useState<Record<string, number>>({});
  const [clipping, setClipping]       = useState<Record<string, boolean>>({});
  const [peakHold, setPeakHold]       = useState<Record<string, number>>({});
  const [compGainReduction, setCompGainReduction] = useState<Record<string, number>>({});
  const [masterMuted, setMasterMuted] = useState(false);
  const [autoMix, setAutoMix]         = useState(true);
  const [autoDuck, setAutoDuck]       = useState(false);
  const [audioContextState, setAudioContextState] = useState<AudioContextState>('suspended');
  const [broadcastStream, setBroadcastStream] = useState<MediaStream | null>(null);
  const [virtualSources, setVirtualSources] = useState<{id: string, label: string, el: HTMLAudioElement}[]>([]);

  const peakHoldTimers = useRef<Record<string, number>>({});
  const peakHoldValues = useRef<Record<string, number>>({});

  // ── Init AudioContext + bus nodes ─────────────────────────────────────────

  useEffect(() => {
    if (ctxRef.current || typeof window === 'undefined') return;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor() as AudioContext;
    ctxRef.current = ctx;

    DEFAULT_BUSES.forEach(bus => {
      const inputGain = ctx.createGain();
      inputGain.gain.value = bus.masterLevel;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      const nodes: BusNodes = { inputGain, analyser };

      if (bus.type === 'foh') {
        const airEq = ctx.createBiquadFilter();
        airEq.type = 'highshelf';
        airEq.frequency.value = 10000;
        airEq.gain.value = 2.5;

        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -3;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.05;

        inputGain.connect(analyser);
        analyser.connect(airEq);
        airEq.connect(limiter);
        limiter.connect(ctx.destination);

        nodes.airEq = airEq;
        nodes.limiter = limiter;
      } else if (bus.type === 'broadcast') {
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -6;
        limiter.knee.value = 3;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.1;

        const streamDest = ctx.createMediaStreamDestination();

        inputGain.connect(analyser);
        analyser.connect(limiter);
        limiter.connect(streamDest);

        nodes.limiter = limiter;
        nodes.streamDest = streamDest;
        setBroadcastStream(streamDest.stream);
      } else {
        // Monitor: meter only, no physical output
        inputGain.connect(analyser);
      }

      busNodesRef.current.set(bus.id, nodes);
    });

    setAudioContextState(ctx.state);
    const onState = () => setAudioContextState(ctx.state);
    ctx.addEventListener('statechange', onState);
    return () => ctx.removeEventListener('statechange', onState);
  }, []);

  // ── Sync cameras & virtual sources → channels ───────────────────────────

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const activeIds = new Set<string>();

    const allSources = [
      ...cameras.filter(c => c.connected && c.stream && c.stream.getAudioTracks().length > 0)
         .map(c => ({ id: c.id, label: c.label, stream: c.stream as MediaStream | HTMLAudioElement, isVirtual: false })),
      ...virtualSources.map(v => ({ id: v.id, label: v.label, stream: v.el as MediaStream | HTMLAudioElement, isVirtual: true }))
    ];

    allSources.forEach(src => {
      activeIds.add(src.id);
      if (channelNodesRef.current.has(src.id)) return; // already wired

      try {
        const source = src.isVirtual 
          ? ctx.createMediaElementSource(src.stream as HTMLAudioElement)
          : ctx.createMediaStreamSource(src.stream as MediaStream);

        const preAmp     = ctx.createGain();          preAmp.gain.value     = 1.0;
        const hpf        = ctx.createBiquadFilter(); hpf.type              = 'highpass'; hpf.frequency.value   = 80;
        const lowShelf   = ctx.createBiquadFilter(); lowShelf.type         = 'lowshelf'; lowShelf.frequency.value = 200;  lowShelf.gain.value  = 0;
        const lowMidPeak = ctx.createBiquadFilter(); lowMidPeak.type       = 'peaking';  lowMidPeak.frequency.value = 800; lowMidPeak.Q.value   = 1.4; lowMidPeak.gain.value = 0;
        const highMidPeak= ctx.createBiquadFilter(); highMidPeak.type      = 'peaking';  highMidPeak.frequency.value= 3500; highMidPeak.Q.value  = 1.2; highMidPeak.gain.value = 0;
        const highShelf  = ctx.createBiquadFilter(); highShelf.type        = 'highshelf';highShelf.frequency.value  = 10000;highShelf.gain.value = 0;
        const gateGain   = ctx.createGain();          gateGain.gain.value   = 1.0;
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18; compressor.knee.value = 8;
        compressor.ratio.value     = 4;   compressor.attack.value  = 0.005;
        compressor.release.value   = 0.1;
        const fader    = ctx.createGain();   fader.gain.value   = 0.0; // start muted
        const analyser = ctx.createAnalyser(); analyser.fftSize   = 2048;

        // Chain: source → preAmp → hpf → lowShelf → lowMidPeak → highMidPeak → highShelf → gateGain → compressor → analyser → fader
        source.connect(preAmp); preAmp.connect(hpf); hpf.connect(lowShelf);
        lowShelf.connect(lowMidPeak); lowMidPeak.connect(highMidPeak);
        highMidPeak.connect(highShelf); highShelf.connect(gateGain);
        gateGain.connect(compressor); compressor.connect(analyser); analyser.connect(fader);

        // Build per-bus send gains (post-fader)
        const sendGains: Record<string, GainNode> = {};
        DEFAULT_BUSES.forEach(bus => {
          const sg = ctx.createGain();
          sg.gain.value = (bus.type === 'foh' || bus.type === 'broadcast') ? 1.0 : 0.0;
          fader.connect(sg);
          const busNode = busNodesRef.current.get(bus.id);
          if (busNode) sg.connect(busNode.inputGain);
          sendGains[bus.id] = sg;
        });

        channelNodesRef.current.set(src.id, {
          source, preAmp, hpf, lowShelf, lowMidPeak, highMidPeak, highShelf, gateGain, compressor, fader, analyser, sendGains,
        });
      } catch (err) {
        console.warn('[AudioEngine] Failed to wire channel', src.id, err);
      }
    });

    // Remove disconnected sources
    for (const [id, nodes] of channelNodesRef.current.entries()) {
      if (!activeIds.has(id)) {
        try {
          nodes.source.disconnect(); nodes.preAmp.disconnect(); nodes.hpf.disconnect();
          nodes.lowShelf.disconnect(); nodes.lowMidPeak.disconnect(); nodes.highMidPeak.disconnect();
          nodes.highShelf.disconnect(); nodes.gateGain.disconnect(); nodes.compressor.disconnect();
          nodes.analyser.disconnect(); nodes.fader.disconnect();
          Object.values(nodes.sendGains).forEach(g => g.disconnect());
        } catch {}
        channelNodesRef.current.delete(id);
      }
    }

    setChannels(prev => {
      const next = allSources.map(src => {
          const existing = prev.find(c => c.id === src.id);
          if (existing) return { ...existing, label: src.label };
          return {
            id: src.id, label: src.label,
            preAmpGain: 0, hpfFreq: 80, pan: 0,
            eq: { low: 0, lowMid: 0, highMid: 0, high: 0 },
            gateEnabled: false, compEnabled: true,
            volume: 0.8, muted: true, soloed: false, isPastorMic: false,
            sends: buildDefaultSends(DEFAULT_BUSES),
          } as AudioChannel;
        });
      return next;
    });
  }, [cameras, virtualSources]);

  // ── Metering & gate loop ──────────────────────────────────────────────────

  useEffect(() => {
    const buf = new Uint8Array(1024);

    const getPeak = (analyser: AnalyserNode | null) => {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128); if (v > peak) peak = v; }
      return peak / 128;
    };

    const loop = () => {
      const ctx = ctxRef.current;
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

      const newLevels: Record<string, number> = {};
      const newBusLevels: Record<string, number> = {};
      const newClipping: Record<string, boolean> = {};
      const newPeakHold: Record<string, number> = {};
      const newCompGR: Record<string, number> = {};

      // Per channel metering + gate
      let anyActive = false; let totalPower = 0;
      channels.forEach(ch => {
        const nodes = channelNodesRef.current.get(ch.id);
        if (!nodes) return;
        const level = getPeak(nodes.analyser);
        newLevels[ch.id] = ch.muted ? 0 : level;
        newClipping[ch.id] = level > 0.97;

        // Peak hold
        if (level > (peakHoldValues.current[ch.id] ?? 0)) {
          peakHoldValues.current[ch.id] = level;
          clearTimeout(peakHoldTimers.current[ch.id]);
          peakHoldTimers.current[ch.id] = window.setTimeout(() => {
            peakHoldValues.current[ch.id] = 0;
          }, 2000);
        }
        newPeakHold[ch.id] = peakHoldValues.current[ch.id] ?? 0;

        // Gate processing
        if (ch.gateEnabled && !ch.muted) {
          const target = level > 0.03 ? 1.0 : 0.0;
          nodes.gateGain.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
        } else {
          nodes.gateGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.05);
        }

        if (!ch.muted && level > 0.03) { anyActive = true; totalPower += level; }

        // Compressor gain reduction (dB, negative value)
        newCompGR[ch.id] = ch.compEnabled ? Math.abs(nodes.compressor.reduction) : 0;
      });

      // Auto-duck (gain share)
      if (autoDuck && anyActive && channels.length > 0) {
        channels.forEach(ch => {
          if (ch.muted) return;
          const nodes = channelNodesRef.current.get(ch.id);
          if (!nodes || !ctx) return;
          const level = newLevels[ch.id] ?? 0;
          const share = totalPower > 0 ? level / totalPower : 1 / channels.length;
          const target = ch.volume * (0.15 + share * 0.85);
          nodes.fader.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
        });
      }

      // Bus metering
      busNodesRef.current.forEach((nodes, busId) => {
        newBusLevels[busId] = getPeak(nodes.analyser);
      });

      setChannelLevels(newLevels);
      setBusLevels(newBusLevels);
      setClipping(newClipping);
      setPeakHold(newPeakHold);
      setCompGainReduction(newCompGR);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [channels, autoDuck]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const setChannelVolume = useCallback((id: string, vol: number) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx && !c.muted) nodes.fader.gain.setTargetAtTime(vol, ctx.currentTime, 0.03);
      return { ...c, volume: vol };
    }));
  }, []);

  const toggleChannelMute = useCallback((id: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = !c.muted;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) nodes.fader.gain.setTargetAtTime(next ? 0 : c.volume, ctx.currentTime, 0.03);
      return { ...c, muted: next };
    }));
  }, []);

  const toggleChannelSolo = useCallback((id: string) => {
    setChannels(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;
      const willSolo = !target.soloed;
      const anySoloed = prev.some(c => c.id !== id && c.soloed);
      return prev.map(c => {
        const soloed = c.id === id ? willSolo : (anySoloed ? c.soloed : false);
        const nodes = channelNodesRef.current.get(c.id);
        const ctx = ctxRef.current;
        const shouldHear = !willSolo || (c.id === id ? willSolo : c.soloed);
        if (nodes && ctx) nodes.fader.gain.setTargetAtTime(shouldHear && !c.muted ? c.volume : 0, ctx.currentTime, 0.03);
        return { ...c, soloed };
      });
    });
  }, []);

  const setPreAmpGain = useCallback((id: string, db: number) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) nodes.preAmp.gain.setTargetAtTime(dbToLinear(db), ctx.currentTime, 0.03);
      return { ...c, preAmpGain: db };
    }));
  }, []);

  const setChannelEQ = useCallback((id: string, eq: Partial<ChannelEQ>) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = { ...c.eq, ...eq };
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) {
        if (eq.low     !== undefined) nodes.lowShelf.gain.setTargetAtTime(next.low,     ctx.currentTime, 0.03);
        if (eq.lowMid  !== undefined) nodes.lowMidPeak.gain.setTargetAtTime(next.lowMid, ctx.currentTime, 0.03);
        if (eq.highMid !== undefined) nodes.highMidPeak.gain.setTargetAtTime(next.highMid,ctx.currentTime, 0.03);
        if (eq.high    !== undefined) nodes.highShelf.gain.setTargetAtTime(next.high,    ctx.currentTime, 0.03);
      }
      return { ...c, eq: next };
    }));
  }, []);

  const setHPFFreq = useCallback((id: string, freq: number) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) nodes.hpf.frequency.setTargetAtTime(freq, ctx.currentTime, 0.03);
      return { ...c, hpfFreq: freq };
    }));
  }, []);

  const toggleGate = useCallback((id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, gateEnabled: !c.gateEnabled } : c));
  }, []);

  const toggleComp = useCallback((id: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = !c.compEnabled;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) {
        nodes.compressor.ratio.setTargetAtTime(next ? 4 : 1, ctx.currentTime, 0.03);
        nodes.compressor.threshold.setTargetAtTime(next ? -18 : 0, ctx.currentTime, 0.03);
      }
      return { ...c, compEnabled: next };
    }));
  }, []);

  const setChannelSend = useCallback((id: string, busId: string, vol: number) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx && nodes.sendGains[busId]) {
        nodes.sendGains[busId].gain.setTargetAtTime(vol, ctx.currentTime, 0.03);
      }
      return { ...c, sends: { ...c.sends, [busId]: vol } };
    }));
  }, []);

  const setBusMasterLevel = useCallback((busId: string, level: number) => {
    setBuses(prev => prev.map(b => {
      if (b.id !== busId) return b;
      const nodes = busNodesRef.current.get(busId);
      const ctx = ctxRef.current;
      if (nodes && ctx) nodes.inputGain.gain.setTargetAtTime(level, ctx.currentTime, 0.03);
      return { ...b, masterLevel: level };
    }));
  }, []);

  const toggleBusMute = useCallback((busId: string) => {
    setBuses(prev => prev.map(b => {
      if (b.id !== busId) return b;
      const next = !b.muted;
      const nodes = busNodesRef.current.get(busId);
      const ctx = ctxRef.current;
      if (nodes && ctx) nodes.inputGain.gain.setTargetAtTime(next ? 0 : b.masterLevel, ctx.currentTime, 0.03);
      return { ...b, muted: next };
    }));
  }, []);

  const renameBus = useCallback((busId: string, name: string) => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, name } : b));
  }, []);

  const applyChannelPreset = useCallback((id: string, presetId: AudioPresetId) => {
    const p = AUDIO_PRESETS[presetId];
    if (!p) return;
    
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nodes = channelNodesRef.current.get(id);
      const ctx = ctxRef.current;
      if (nodes && ctx) {
        nodes.hpf.frequency.setTargetAtTime(p.hpfFreq, ctx.currentTime, 0.03);
        nodes.lowShelf.gain.setTargetAtTime(p.eq.low, ctx.currentTime, 0.03);
        nodes.lowMidPeak.gain.setTargetAtTime(p.eq.lowMid, ctx.currentTime, 0.03);
        nodes.highMidPeak.gain.setTargetAtTime(p.eq.highMid, ctx.currentTime, 0.03);
        nodes.highShelf.gain.setTargetAtTime(p.eq.high, ctx.currentTime, 0.03);
        nodes.compressor.ratio.setTargetAtTime(p.compEnabled ? 4 : 1, ctx.currentTime, 0.03);
        nodes.compressor.threshold.setTargetAtTime(p.compEnabled ? -18 : 0, ctx.currentTime, 0.03);
      }
      return { ...c, eq: p.eq, hpfFreq: p.hpfFreq, gateEnabled: p.gateEnabled, compEnabled: p.compEnabled, presetId };
    }));
  }, []);

  const addVirtualChannel = useCallback((label: string, url: string) => {
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    el.play().catch(console.warn);
    setVirtualSources(p => [...p, { id: `virtual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, label, el }]);
  }, []);

  // Resume context on user gesture
  const resumeCtx = useCallback(() => { ctxRef.current?.state === 'suspended' && ctxRef.current.resume(); }, []);
  useEffect(() => { window.addEventListener('click', resumeCtx, { once: true }); return () => window.removeEventListener('click', resumeCtx); }, [resumeCtx]);

  // Cleanup
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    channelNodesRef.current.forEach(n => { try { n.source.disconnect(); } catch {} });
    ctxRef.current?.close();
  }, []);

  return {
    buses, channels, channelLevels, busLevels, clipping, peakHold, compGainReduction,
    masterMuted, setMasterMuted,
    autoMix, setAutoMix, autoDuck, setAutoDuck,
    audioContextState, broadcastStream,
    setChannelVolume, toggleChannelMute, toggleChannelSolo,
    setPreAmpGain, setChannelEQ, setHPFFreq, toggleGate, toggleComp,
    setChannelSend, setBusMasterLevel, toggleBusMute, renameBus,
    // legacy compat
    masterVolume: buses.find(b => b.id === 'foh')?.masterLevel ?? 0.85,
    setMasterVolume: (v: number) => setBusMasterLevel('foh', v),
    dominantChannelId: null as string | null,
    togglePastorMic: (id: string) => setChannels(prev => prev.map(c => c.id === id ? { ...c, isPastorMic: !c.isPastorMic } : c)),
    setAuxSend: (id: string, aux: 1 | 2, v: number) => setChannelSend(id, aux === 1 ? 'mon-1' : 'mon-2', v),
    applyChannelPreset, addVirtualChannel,
  };
}
