'use client';
import { useRef } from 'react';

// ── Per-channel accent colors (matching reference image) ──────────────────────
export const CHAN_COLORS = [
  '#f0c14b', // gold
  '#4ade80', // green
  '#22d3ee', // cyan
  '#a855f7', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#60a5fa', // blue
  '#fb923c', // orange
];

// ── Surface tokens ────────────────────────────────────────────────────────────
export const BG_MAIN  = '#252529';
export const BG_STRIP = '#1e1e22';
export const BG_TRACK = '#121214';

// ── Pan Knob ──────────────────────────────────────────────────────────────────
// value: -1 (full left) to +1 (full right), 0 = center
export function PanKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const norm  = (value + 1) / 2;
  const angle = -135 + norm * 270;
  const R = 13; const CX = 16; const CY = 16;
  const ix = CX + R * 0.52 * Math.cos((angle * Math.PI) / 180);
  const iy = CY + R * 0.52 * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="flex flex-col items-center gap-0.5 select-none"
      style={{ cursor: 'ew-resize' }}
      onWheel={e => { e.preventDefault(); onChange(Math.max(-1, Math.min(1, value - Math.sign(e.deltaY) * 0.08))); }}>
      <svg width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <radialGradient id="panGrad" cx="38%" cy="32%">
            <stop offset="0%" stopColor="#4e4e58" />
            <stop offset="100%" stopColor="#28282e" />
          </radialGradient>
        </defs>
        {/* Shadow ring */}
        <circle cx={CX+0.5} cy={CY+1} r={R} fill="rgba(0,0,0,0.4)" />
        {/* Body */}
        <circle cx={CX} cy={CY} r={R} fill="url(#panGrad)" />
        {/* Bevel highlight */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
          strokeDasharray="25 60" strokeLinecap="round" transform={`rotate(-50 ${CX} ${CY})`} />
        {/* Indicator dot */}
        <circle cx={ix} cy={iy} r={2.2} fill="rgba(255,255,255,0.75)" />
      </svg>
      <span style={{ fontSize: 7, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {Math.abs(value) < 0.05 ? 'C' : value < 0 ? `L${Math.round(-value * 10)}` : `R${Math.round(value * 10)}`}
      </span>
    </div>
  );
}

// ── DAW Fader (colored handle, classic vertical) ──────────────────────────────
export function DAWFader({ value, min, max, color, onChange, height = 110 }: {
  value: number; min: number; max: number;
  color: string; onChange: (v: number) => void; height?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ on: boolean; sy: number; sv: number }>({ on: false, sy: 0, sv: 0 });
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <div ref={trackRef} className="relative flex items-center justify-center"
      style={{ height, cursor: 'ns-resize', userSelect: 'none', flexShrink: 0 }}
      onPointerDown={e => {
        drag.current = { on: true, sy: e.clientY, sv: value };
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        if (!drag.current.on || !trackRef.current) return;
        const h = trackRef.current.clientHeight;
        const d = (drag.current.sy - e.clientY) / h;
        onChange(Math.max(min, Math.min(max, drag.current.sv + d * (max - min))));
      }}
      onPointerUp={() => { drag.current.on = false; }}>
      {/* Track groove */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        top: 8, bottom: 8, width: 5, borderRadius: 2,
        background: BG_TRACK,
        boxShadow: 'inset 1px 1px 4px rgba(0,0,0,0.9), inset -0.5px -0.5px 1px rgba(255,255,255,0.03)',
      }} />
      {/* Handle */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%) translateY(-50%)',
        top: `${(1 - norm) * 100}%`,
        width: 42, height: 13, borderRadius: 2, zIndex: 10,
        background: `linear-gradient(to bottom, ${color}ee 0%, ${color}99 100%)`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3)`,
      }}>
        {/* Center grip */}
        <div style={{ position: 'absolute', left: 6, right: 6, top: '50%', marginTop: -0.5,
          height: 1, background: 'rgba(0,0,0,0.35)', borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ── Twin VU bars (L + R) ──────────────────────────────────────────────────────
export function VUBars({ level, peakHold, color, height = 110 }: {
  level: number; peakHold: number; color: string; height?: number;
}) {
  const SEGS = 22;
  const rLevel = level * 0.90;
  const lActive = Math.floor(level   * SEGS);
  const rActive = Math.floor(rLevel  * SEGS);
  const holdSeg = Math.floor(peakHold * SEGS);

  const renderBar = (active: number) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 1,
      background: BG_TRACK, padding: '2px', borderRadius: 2 }}>
      {[...Array(SEGS)].map((_, i) => {
        const on   = i < active;
        const hold = i === holdSeg && holdSeg > 0;
        let bg = 'rgba(255,255,255,0.06)';
        if (on)   bg = i < SEGS * 0.67 ? color : i < SEGS * 0.84 ? '#f59e0b' : '#ef4444';
        if (hold) bg = '#ffffff';
        return <div key={i} style={{ height: 3, background: bg, borderRadius: 1 }} />;
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 2, height, width: 14, flexShrink: 0 }}>
      {renderBar(lActive)}
      {renderBar(rActive)}
    </div>
  );
}

// ── M / S pill button ─────────────────────────────────────────────────────────
export function MSButton({ label, active, activeColor, onClick }: {
  label: string; active: boolean; activeColor: string; onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 20, borderRadius: 3,
      fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
      letterSpacing: '0.05em', textTransform: 'uppercase',
      cursor: 'pointer', border: 'none', transition: 'all 0.1s',
      background: active ? activeColor : 'rgba(255,255,255,0.07)',
      color: active ? '#fff' : 'rgba(255,255,255,0.35)',
      boxShadow: active ? `0 0 6px ${activeColor}80` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
    }}>
      {label}
    </button>
  );
}
