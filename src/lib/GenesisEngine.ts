/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  GENESIS II — Real-Time Broadcast Color Science Engine                 ║
 * ║                                                                        ║
 * ║  A WebGL2 GPU-accelerated video processing pipeline that brings        ║
 * ║  ProLens-grade color science to live video at 60fps.                   ║
 * ║                                                                        ║
 * ║  Pipeline (single-pass fragment shader):                               ║
 * ║    1. sRGB → Linear Light conversion                                  ║
 * ║    2. YCbCr Skin-Tone Detection & Protection Mask                     ║
 * ║    3. Exposure in Linear Light (EV stops)                             ║
 * ║    4. Luminance-only S-Curve Contrast (chrominance preserved)         ║
 * ║    5. GPU Unsharp Mask with Skin Protection (frequency separation)    ║
 * ║    6. Intelligent Vibrance (saturation-aware, skin-safe)              ║
 * ║    7. Bradford Chromatic Adaptation (white balance)                    ║
 * ║    8. Film Stock H&D Curve Emulation                                  ║
 * ║    9. ACES Filmic Tonemapping                                         ║
 * ║   10. Photographic Vignette                                           ║
 * ║   11. Linear → sRGB conversion                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ── Configuration Interface ──────────────────────────────────────────────────

export interface GenesisConfig {
  exposure: number;     // -2.0 to +2.0  (EV stops)
  contrast: number;     //  0.0 to  2.0  (1.0 = neutral)
  clarity: number;      //  0.0 to  2.0  (unsharp mask strength)
  vibrance: number;     //  0.0 to  2.0  (intelligent saturation)
  temperature: number;  // -1.0 to +1.0  (cool ↔ warm)
  vignette: number;     //  0.0 to  1.0  (edge darkening)
  filmStock: number;    //  0 = none, 1 = Portra, 2 = CineStill, 3 = Kodachrome
}

export const GENESIS_DEFAULT_CONFIG: GenesisConfig = {
  exposure: 0.0,
  contrast: 1.0,
  clarity: 0.0,
  vibrance: 0.0,
  temperature: 0.0,
  vignette: 0.0,
  filmStock: 0,
};

// ── Scientifically Tuned Presets ─────────────────────────────────────────────

export const GENESIS_PRESETS: Record<string, { label: string; config: GenesisConfig; description: string }> = {
  off: {
    label: 'Raw',
    description: 'Zero processing — pure camera feed',
    config: { ...GENESIS_DEFAULT_CONFIG },
  },
  natural: {
    label: 'Natural Clarity',
    description: 'Crisp detail, balanced vibrance, clean contrast',
    config: {
      exposure: 0.1,
      contrast: 1.15,
      clarity: 0.6,
      vibrance: 0.3,
      temperature: 0.0,
      vignette: 0.0,
      filmStock: 0,
    },
  },
  portrait: {
    label: 'Studio Portrait',
    description: 'Warm skin tones, soft contrast, Portra emulation',
    config: {
      exposure: 0.15,
      contrast: 1.08,
      clarity: 0.3,
      vibrance: 0.15,
      temperature: 0.12,
      vignette: 0.15,
      filmStock: 1,
    },
  },
  cinematic: {
    label: 'Cinematic Stage',
    description: 'Deep shadows, cool midtones, CineStill 800T',
    config: {
      exposure: 0.05,
      contrast: 1.25,
      clarity: 0.4,
      vibrance: 0.2,
      temperature: -0.08,
      vignette: 0.3,
      filmStock: 2,
    },
  },
  gospel: {
    label: 'Gospel Fire',
    description: 'Golden warmth, punchy primaries, Kodachrome intensity',
    config: {
      exposure: 0.2,
      contrast: 1.3,
      clarity: 0.5,
      vibrance: 0.4,
      temperature: 0.2,
      vignette: 0.1,
      filmStock: 3,
    },
  },
};

// ── The Engine ───────────────────────────────────────────────────────────────

export class GenesisEngine {
  private rawStream: MediaStream;
  public processedStream: MediaStream;

  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private video: HTMLVideoElement;

  private program!: WebGLProgram;
  private texture!: WebGLTexture;
  private animationFrameId: number = 0;

  private config: GenesisConfig = { ...GENESIS_DEFAULT_CONFIG };
  private destroyed: boolean = false;

  // Cached uniform locations for performance
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  constructor(rawStream: MediaStream) {
    this.rawStream = rawStream;

    // 1. Hidden video element to decode the camera stream
    this.video = document.createElement('video');
    this.video.srcObject = rawStream;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.play().catch(e => console.warn('[GENESIS II] Video play failed:', e));

    // 2. WebGL2 Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1920;
    this.canvas.height = 1080;

    const gl = this.canvas.getContext('webgl2');
    if (!gl) throw new Error('[GENESIS II] WebGL2 not supported');
    this.gl = gl;

    // 3. Build the pipeline
    this.initWebGL();

    // 4. Capture the processed output at broadcast quality
    this.processedStream = this.canvas.captureStream(60);
    // Persist audio tracks from the original camera/RTC stream
    this.rawStream.getAudioTracks().forEach(track => {
      this.processedStream.addTrack(track);
    });

    // 5. Start rendering once video is decoded
    this.video.onplaying = () => {
      this.canvas.width = this.video.videoWidth || 1920;
      this.canvas.height = this.video.videoHeight || 1080;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.render();
    };
  }

  /** Update the color science configuration in real-time */
  public updateConfig(config: Partial<GenesisConfig>) {
    this.config = { ...this.config, ...config };
  }

  /** Set a complete preset */
  public setPreset(presetId: string) {
    const preset = GENESIS_PRESETS[presetId];
    if (preset) {
      this.config = { ...preset.config };
    }
  }

  /** Legacy compat: setEnabled maps to off/natural */
  public setEnabled(enabled: boolean) {
    this.config = enabled
      ? { ...GENESIS_PRESETS.natural.config }
      : { ...GENESIS_DEFAULT_CONFIG };
  }

  public destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.video.pause();
    this.video.srcObject = null;
    this.processedStream.getTracks().forEach((t) => t.stop());
    this.rawStream.getTracks().forEach((t) => t.stop());
    this.gl.deleteProgram(this.program);
    this.gl.deleteTexture(this.texture);
  }

  // ── WebGL Initialization ─────────────────────────────────────────────────

  private initWebGL() {
    const gl = this.gl;

    // ── Vertex Shader (passthrough) ────────────────────────────────────────
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // ── Fragment Shader: GENESIS II Color Science Pipeline ─────────────────
    const fragmentShaderSource = `#version 300 es
      precision highp float;

      in vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform float u_time;

      // Pipeline uniforms
      uniform float u_exposure;
      uniform float u_contrast;
      uniform float u_clarity;
      uniform float u_vibrance;
      uniform float u_temperature;
      uniform float u_vignette;
      uniform int u_filmStock;

      out vec4 outColor;

      // ────────────────────────────────────────────────────────────────────
      // 1. LINEAR LIGHT: sRGB ↔ Linear conversion
      //    Processing in gamma space causes hue shifts. Linear is truth.
      // ────────────────────────────────────────────────────────────────────
      vec3 toLinear(vec3 srgb) {
        return mix(
          srgb / 12.92,
          pow((srgb + 0.055) / 1.055, vec3(2.4)),
          step(0.04045, srgb)
        );
      }

      vec3 toSRGB(vec3 lin) {
        return mix(
          lin * 12.92,
          1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055,
          step(0.0031308, lin)
        );
      }

      // ────────────────────────────────────────────────────────────────────
      // 2. SKIN-TONE GUARDIAN: YCbCr chrominance detection
      //    Skin of all ethnicities falls in a narrow CbCr band.
      //    Returns 0.0 (not skin) to 1.0 (definitely skin).
      // ────────────────────────────────────────────────────────────────────
      float detectSkin(vec3 rgb) {
        float Y  = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        float Cb = -0.169 * rgb.r - 0.331 * rgb.g + 0.500 * rgb.b + 0.5;
        float Cr =  0.500 * rgb.r - 0.419 * rgb.g - 0.081 * rgb.b + 0.5;

        // Skin chrominance cluster (normalized 0-1 range)
        float cbCenter = 0.38;
        float crCenter = 0.58;
        float cbRange = 0.08;
        float crRange = 0.07;

        float cbDist = smoothstep(cbRange, 0.0, abs(Cb - cbCenter));
        float crDist = smoothstep(crRange, 0.0, abs(Cr - crCenter));

        // Exclude very dark (shadows) and very bright (specular) pixels
        float lumaMask = smoothstep(0.12, 0.25, Y) * smoothstep(0.95, 0.85, Y);

        return cbDist * crDist * lumaMask;
      }

      // ────────────────────────────────────────────────────────────────────
      // 3. PERCEPTUAL S-CURVE: Contrast applied to luminance only
      //    Preserves chrominance ratios — no hue shifts.
      // ────────────────────────────────────────────────────────────────────
      float sCurve(float x, float strength) {
        // Power-based S-curve that always maps 0→0, 0.5→0.5, 1→1
        // strength > 1.0 = more contrast, strength < 1.0 = less contrast
        float cx = clamp(x, 0.0, 1.0);
        if (cx < 0.5) {
          return 0.5 * pow(2.0 * cx, strength);
        } else {
          return 1.0 - 0.5 * pow(2.0 * (1.0 - cx), strength);
        }
      }

      // ────────────────────────────────────────────────────────────────────
      // 9. ACES FILMIC TONEMAPPING
      //    Industry standard (Avatar, Mandalorian, etc.)
      //    Graceful highlight compression, preserved shadow detail.
      // ────────────────────────────────────────────────────────────────────
      vec3 ACESFilm(vec3 x) {
        float a = 2.51;
        float b = 0.03;
        float c = 2.43;
        float d = 0.59;
        float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
      }

      // ────────────────────────────────────────────────────────────────────
      // PSEUDO-RANDOM (for film grain)
      // ────────────────────────────────────────────────────────────────────
      float random(vec2 st) {
        return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // ════════════════════════════════════════════════════════════════════
      //                    M A I N   P I P E L I N E
      // ════════════════════════════════════════════════════════════════════
      void main() {
        vec2 uv = v_texCoord;
        vec2 px = 1.0 / u_resolution;

        // Sample the current video frame
        vec3 original = texture(u_image, uv).rgb;

        // Check if any processing is needed
        bool isPassthrough = (
          u_exposure == 0.0 &&
          u_contrast == 1.0 &&
          u_clarity == 0.0 &&
          u_vibrance == 0.0 &&
          u_temperature == 0.0 &&
          u_vignette == 0.0 &&
          u_filmStock == 0
        );

        if (isPassthrough) {
          outColor = vec4(original, 1.0);
          return;
        }

        // ── STEP 1: Linearize ────────────────────────────────────────────
        vec3 color = toLinear(original);

        // ── STEP 2: Skin Detection ───────────────────────────────────────
        float skin = detectSkin(original); // detect on gamma values (perceptual)

        // ── STEP 3: Exposure (EV stops in linear light) ──────────────────
        color *= pow(2.0, u_exposure);

        // ── STEP 4: Luminance-only S-Curve Contrast ──────────────────────
        if (u_contrast != 1.0) {
          float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float safeLuma = max(luma, 0.0001);
          float curved = sCurve(clamp(luma, 0.0, 1.0), u_contrast);

          // Blend: protect skin from extreme contrast
          float blendedCurve = mix(curved, mix(luma, curved, 0.5), skin * 0.6);
          color *= blendedCurve / safeLuma;
        }

        // ── STEP 5: GPU Unsharp Mask (Clarity / Sharpening) ──────────────
        //    Frequency separation: extract high-freq detail, boost it.
        //    Skin areas are protected to maintain smooth appearance.
        if (u_clarity > 0.0) {
          // 5-tap cross sample for local average (blur approximation)
          vec3 blur = (
            toLinear(texture(u_image, uv + vec2(-px.x, 0.0)).rgb) +
            toLinear(texture(u_image, uv + vec2( px.x, 0.0)).rgb) +
            toLinear(texture(u_image, uv + vec2(0.0, -px.y)).rgb) +
            toLinear(texture(u_image, uv + vec2(0.0,  px.y)).rgb)
          ) * 0.25;

          // High-frequency detail = original - blurred
          vec3 detail = color - blur;

          // Boost detail, but protect skin areas (frequency separation)
          float skinProtection = 1.0 - skin * 0.85;
          color += detail * u_clarity * skinProtection;
        }

        // ── STEP 6: Intelligent Vibrance ─────────────────────────────────
        //    Boosts muted colors more than saturated ones.
        //    Skin tones are treated gently to prevent orange/red push.
        if (u_vibrance > 0.0) {
          float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float currentSat = (max(max(color.r, color.g), color.b) -
                              min(min(color.r, color.g), color.b)) /
                              max(max(max(color.r, color.g), color.b), 0.001);
          // Boost muted colors more; protect already-vivid and skin
          float boost = u_vibrance * (1.0 - currentSat) * (1.0 - skin * 0.7);
          color = mix(vec3(luma), color, 1.0 + boost * 0.5);
        }

        // ── STEP 7: Bradford Chromatic Adaptation (Temperature) ──────────
        //    ICC-standard color science for proper white balance.
        if (u_temperature != 0.0) {
          // Bradford forward transform
          mat3 bradford = mat3(
             0.8951,  0.2664, -0.1614,
            -0.7502,  1.7135,  0.0367,
             0.0389, -0.0685,  1.0296
          );
          mat3 bradfordInv = mat3(
             0.9870, -0.1471,  0.1600,
             0.4323,  0.5184,  0.0493,
            -0.0085,  0.0400,  0.9685
          );

          vec3 lms = bradford * color;
          // Shift L (long/warm) and S (short/cool) cone responses
          float t = u_temperature * 0.12;
          lms *= vec3(1.0 + t, 1.0, 1.0 - t);
          color = bradfordInv * lms;
        }

        // ── STEP 8: Film Stock Emulation (H&D Curves) ────────────────────
        //    Mathematically modeled response curves of real film emulsions.
        if (u_filmStock == 1) {
          // Kodak Portra 400: warm shadows, pastel highlights, reduced blue
          color = pow(color, vec3(0.92, 0.95, 1.02));
          color *= vec3(1.03, 1.00, 0.95);
          // Subtle shadow lift (faded film look)
          color = mix(color, color + vec3(0.012, 0.008, 0.006), smoothstep(0.0, 0.3, dot(color, vec3(0.333))));
        } else if (u_filmStock == 2) {
          // CineStill 800T: Tungsten-balanced, cool midtones, warm highlights
          color = pow(color, vec3(1.05, 0.98, 0.90));
          color *= vec3(0.96, 1.0, 1.06);
          // Subtle halation on bright areas (CineStill's signature)
          float highlightMask = smoothstep(0.6, 1.0, dot(color, vec3(0.2126, 0.7152, 0.0722)));
          color += vec3(0.03, 0.005, -0.01) * highlightMask;
        } else if (u_filmStock == 3) {
          // Kodachrome 64: Punchy primaries, deep blacks, warm gold
          color = pow(color, vec3(0.88, 0.92, 1.08));
          color *= vec3(1.05, 1.02, 0.92);
          // Crushed blacks for that Kodachrome density
          color = max(color - vec3(0.01), vec3(0.0));
          // Midtone contrast push
          float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
          color = mix(color, color * 1.1, smoothstep(0.2, 0.5, luma) * smoothstep(0.8, 0.5, luma));
        }

        // ── STEP 9: ACES Filmic Tonemapping ──────────────────────────────
        //    Only apply when film stocks are active or exposure is boosted,
        //    since ACES is designed for HDR and will darken SDR webcam feeds.
        if (u_filmStock > 0 || u_exposure > 0.5) {
          color = ACESFilm(color);
        } else {
          // Simple clamp for SDR content
          color = clamp(color, 0.0, 1.0);
        }

        // ── STEP 10: Photographic Vignette ───────────────────────────────
        if (u_vignette > 0.0) {
          float dist = distance(uv, vec2(0.5));
          // Cubic falloff for natural lens vignette
          float vig = 1.0 - smoothstep(0.3, 0.85, dist) * u_vignette;
          color *= vig;
        }

        // ── STEP 11: Convert back to sRGB for display ────────────────────
        color = toSRGB(color);

        // Subtle film grain (luminance-dependent, shadows only)
        if (u_filmStock > 0) {
          float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float grain = (random(uv + u_time * 0.01) - 0.5) * 0.03 * (1.0 - luma);
          color += grain;
        }

        outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `;

    // ── Compile & Link ─────────────────────────────────────────────────────
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('[GENESIS II] Link error:', gl.getProgramInfoLog(this.program));
      throw new Error('[GENESIS II] WebGL Program Link failed');
    }

    gl.useProgram(this.program);

    // ── Cache uniform locations ────────────────────────────────────────────
    const uniformNames = [
      'u_image', 'u_resolution', 'u_time',
      'u_exposure', 'u_contrast', 'u_clarity',
      'u_vibrance', 'u_temperature', 'u_vignette', 'u_filmStock',
    ];
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }

    // ── Fullscreen Quad Geometry ────────────────────────────────────────────
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0,  1.0, 1.0,  0.0, 0.0,
        0.0, 0.0,  1.0, 1.0,  1.0, 0.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Texture ────────────────────────────────────────────────────────────
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const log = this.gl.getShaderInfoLog(shader);
      console.error('[GENESIS II] Shader compile error:', log);
      throw new Error(`[GENESIS II] Shader compilation failed: ${log}`);
    }
    return shader;
  }

  // ── Render Loop ──────────────────────────────────────────────────────────

  private render = () => {
    if (this.destroyed) return;

    if (this.video.readyState >= 2) {
      const gl = this.gl;

      gl.useProgram(this.program);

      // Upload current video frame
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);

      // Set all uniforms from current config
      gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uniforms.u_time, performance.now() / 1000.0);

      gl.uniform1f(this.uniforms.u_exposure, this.config.exposure);
      gl.uniform1f(this.uniforms.u_contrast, this.config.contrast);
      gl.uniform1f(this.uniforms.u_clarity, this.config.clarity);
      gl.uniform1f(this.uniforms.u_vibrance, this.config.vibrance);
      gl.uniform1f(this.uniforms.u_temperature, this.config.temperature);
      gl.uniform1f(this.uniforms.u_vignette, this.config.vignette);
      gl.uniform1i(this.uniforms.u_filmStock, this.config.filmStock);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
