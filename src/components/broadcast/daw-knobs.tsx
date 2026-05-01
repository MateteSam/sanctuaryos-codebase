'use client';
import { useRef, useEffect, useCallback } from 'react';
import { BG_TRACK } from './daw-ui';

// ── Rotary Knob (full-featured, SVG, mouse-drag + scroll) ────────────────────
export function RotaryKnob({ value, min, max, step = 0.1, label, unit = '', color = '#38bdf8',
  size = 40, onChange }: {
  value: number; min: number; max: number; step?: number;
  label: string; unit?: string; color?: string; size?: number;
  onChange: (v: number) => void;
}) {
  const norm = (value - min) / (max - min);
  const angle = -135 + norm * 270;
  const R = size * 0.38; const CX = size / 2; const CY = size / 2;
  const ix = CX + R * 0.65 * Math.cos((angle * Math.PI) / 180);
  const iy = CY + R * 0.65 * Math.sin((angle * Math.PI) / 180);
  const dragRef = useRef<{ on: boolean; sy: number; sv: number }>({ on: false, sy: 0, sv: 0 });

  // Arc path for value indicator
  const arcStart = -135; const arcEnd = angle;
  const startRad = (arcStart * Math.PI) / 180; const endRad = (arcEnd * Math.PI) / 180;
  const arcR = R + 3;
  const x1 = CX + arcR * Math.cos(startRad); const y1 = CY + arcR * Math.sin(startRad);
  const x2 = CX + arcR * Math.cos(endRad);   const y2 = CY + arcR * Math.sin(endRad);
  const largeArc = norm > 0.5 ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'ns-resize', userSelect: 'none' }}
      onWheel={e => { e.preventDefault(); onChange(Math.max(min, Math.min(max, value - Math.sign(e.deltaY) * step))); }}
      onPointerDown={e => { dragRef.current = { on: true, sy: e.clientY, sv: value }; (e.target as Element).setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!dragRef.current.on) return; const d = (dragRef.current.sy - e.clientY) / 120; onChange(Math.max(min, Math.min(max, dragRef.current.sv + d * (max - min)))); }}
      onPointerUp={() => { dragRef.current.on = false; }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Value arc */}
        {norm > 0.005 && <path d={`M ${x1} ${y1} A ${arcR} ${arcR} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.6} />}
        {/* Shadow */}
        <circle cx={CX + 0.5} cy={CY + 1} r={R} fill="rgba(0,0,0,0.5)" />
        {/* Body */}
        <circle cx={CX} cy={CY} r={R} fill="url(#knobGrad)" />
        {/* Bevel */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Indicator */}
        <circle cx={ix} cy={iy} r={size * 0.04} fill={color} />
        <defs>
          <radialGradient id="knobGrad" cx="38%" cy="32%">
            <stop offset="0%" stopColor="#4e4e58" />
            <stop offset="100%" stopColor="#28282e" />
          </radialGradient>
        </defs>
      </svg>
      <span style={{ fontSize: 7, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
        {label}
      </span>
      <span style={{ fontSize: 7, fontFamily: 'monospace', color, letterSpacing: '0.05em' }}>
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </span>
    </div>
  );
}

// ── Mini FFT Spectrum Display (32-bar, canvas-rendered) ──────────────────────
export function MiniFFT({ analyserRef, color = '#38bdf8', width = 64, height = 24 }: {
  analyserRef: React.RefObject<AnalyserNode | null>;
  color?: string; width?: number; height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const buf = new Uint8Array(64);
    const BARS = 32;

    const draw = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(buf);
      }

      ctx2d.clearRect(0, 0, width, height);
      const bw = width / BARS;

      for (let i = 0; i < BARS; i++) {
        const val = (buf[i] ?? 0) / 255;
        const bh = val * height;
        const intensity = Math.min(1, val * 1.5);

        ctx2d.fillStyle = `${color}${Math.round(intensity * 200 + 55).toString(16).padStart(2, '0')}`;
        ctx2d.fillRect(i * bw + 0.5, height - bh, bw - 1, bh);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, color, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ width, height, borderRadius: 2, background: BG_TRACK, flexShrink: 0 }} />
  );
}

// ── LUFS Loudness Bar (horizontal, broadcast-standard) ───────────────────────
export function LUFSBar({ lufs, target = -14, width = 200, height = 16 }: {
  lufs: number; target?: number; width?: number; height?: number;
}) {
  // Map LUFS range: -40 to 0
  const norm = Math.max(0, Math.min(1, (lufs + 40) / 40));
  const targetNorm = (target + 40) / 40;
  const barColor = lufs > -10 ? '#ef4444' : lufs > target + 2 ? '#f59e0b' : '#4ade80';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ position: 'relative', width, height, background: 'rgba(255,255,255,0.04)',
        borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Fill */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${norm * 100}%`, background: barColor,
          transition: 'width 0.15s, background 0.3s', borderRadius: 2 }} />
        {/* Target line */}
        <div style={{ position: 'absolute', left: `${targetNorm * 100}%`, top: 0, bottom: 0,
          width: 2, background: '#ffffff60', zIndex: 2 }} />
        {/* Label */}
        <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
          fontSize: 8, fontFamily: 'monospace', fontWeight: 900, color: 'rgba(255,255,255,0.6)',
          zIndex: 3, letterSpacing: '0.05em' }}>
          {lufs > -60 ? `${lufs.toFixed(1)} LUFS` : '-- LUFS'}
        </span>
      </div>
    </div>
  );
}

// ── Compressor Gain Reduction Meter (inverted VU) ────────────────────────────
export function CompMeter({ reduction, height = 40, color = '#f59e0b' }: {
  reduction: number; height?: number; color?: string;
}) {
  // reduction: 0 to ~20 dB of gain reduction
  const SEGS = 10;
  const active = Math.floor(Math.min(SEGS, (reduction / 20) * SEGS));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, height, width: 10 }}>
      {[...Array(SEGS)].map((_, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 1,
          background: i < active ? color : 'rgba(255,255,255,0.05)',
          transition: 'background 0.1s',
        }} />
      ))}
    </div>
  );
}

// ── Preset Wheel (category-organized preset selector) ────────────────────────
import { type AudioPresetFull, SONUS_PRESETS, PRESET_CATEGORIES } from '@/lib/audioPresets';

export function PresetSelector({ activePresetId, onSelect, onClose }: {
  activePresetId?: string;
  onSelect: (preset: AudioPresetFull) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: -20, marginBottom: 4,
      width: 220, background: '#1a1a1e', borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.1)', padding: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)', zIndex: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 900, fontFamily: 'monospace',
          letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          MAGIC PRESETS
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
      {PRESET_CATEGORIES.map(cat => {
        const presets = SONUS_PRESETS.filter(p => p.category === cat.id);
        if (presets.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 7, fontWeight: 900, fontFamily: 'monospace',
              letterSpacing: '0.12em', color: cat.color, textTransform: 'uppercase' }}>
              {cat.label}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
              {presets.map(p => (
                <button key={p.id} onClick={() => { onSelect(p); onClose(); }}
                  style={{
                    padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                    fontSize: 7, fontWeight: 700, fontFamily: 'monospace',
                    border: p.id === activePresetId ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                    background: p.id === activePresetId ? `${cat.color}20` : 'rgba(255,255,255,0.04)',
                    color: p.id === activePresetId ? cat.color : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.12s',
                  }}
                  title={p.description}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── QR Code Modal (for sharing monitor links) ────────────────────────────────
export function QRShareModal({ url, busName, onClose }: {
  url: string; busName: string; onClose: () => void;
}) {
  // Generate a simple QR-like visual (actual QR would need a library)
  // For now, display the URL prominently with copy functionality
  const copyUrl = useCallback(async () => {
    try { await navigator.clipboard.writeText(url); } catch {}
  }, [url]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 320, background: '#1a1a1e', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24, textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, fontFamily: 'monospace',
          letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
          marginBottom: 12 }}>
          SHARE MONITOR MIX
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#4ade80', marginBottom: 16 }}>
          {busName}
        </div>
        {/* QR placeholder — a grid pattern */}
        <div style={{ width: 160, height: 160, margin: '0 auto 16px', background: '#fff',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, width: '100%', height: '100%' }}>
            {[...Array(64)].map((_, i) => (
              <div key={i} style={{
                background: Math.random() > 0.4 ? '#000' : '#fff', borderRadius: 1,
              }} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)',
          marginBottom: 12, wordBreak: 'break-all', padding: '8px 12px',
          background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
          {url}
        </div>
        <button onClick={copyUrl} style={{
          width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer',
          fontSize: 10, fontWeight: 900, fontFamily: 'monospace',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          background: '#4ade80', color: '#000', border: 'none',
          transition: 'all 0.15s',
        }}>
          COPY LINK
        </button>
      </div>
    </div>
  );
}
