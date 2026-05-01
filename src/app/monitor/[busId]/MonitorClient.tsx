'use client';

import { useState, useEffect } from 'react';

const BG = '#0d0d11';

export default function MonitorClient({ busId }: { busId: string }) {
  const [connected, setConnected] = useState(false);
  const [myLevel, setMyLevel] = useState(0.75);
  const [moreMe, setMoreMe] = useState(0.5);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [muted, setMuted] = useState(false);
  const [clickEnabled, setClickEnabled] = useState(false);

  const busName = busId.replace('mon-', 'Monitor ').replace('foh', 'FOH').replace('broadcast', 'Broadcast');
  const color = busId === 'mon-1' ? '#34d399' : busId === 'mon-2' ? '#fbbf24' : busId === 'mon-3' ? '#f472b6' : '#38bdf8';

  useEffect(() => { const t = setTimeout(() => setConnected(true), 1500); return () => clearTimeout(t); }, []);

  const Knob = ({ value, onChange, label, min = -12, max = 12, unit = 'dB' }: {
    value: number; onChange: (v: number) => void; label: string;
    min?: number; max?: number; unit?: string;
  }) => {
    const norm = (value - min) / (max - min);
    const angle = -135 + norm * 270;
    const R = 28; const CX = 40; const CY = 40;
    const ix = CX + R * 0.6 * Math.cos((angle * Math.PI) / 180);
    const iy = CY + R * 0.6 * Math.sin((angle * Math.PI) / 180);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
          letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{label}</span>
        <svg width={80} height={80} viewBox="0 0 80 80" style={{ touchAction: 'none' }}
          onPointerDown={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const move = (ev: PointerEvent) => {
              const dy = (rect.top + rect.height / 2 - ev.clientY) / 80;
              onChange(Math.max(min, Math.min(max, value + dy * (max - min) * 0.3)));
            };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
          }}>
          <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx={CX} cy={CY} r={R} fill="#28282e" />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <circle cx={ix} cy={iy} r={4} fill={color} />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#e2e8f0', fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column', padding: 16, maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>SONUS · PERSONAL MONITOR</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '0.1em' }}>{busName}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ef4444',
            boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #ef4444' }} />
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
            color: connected ? '#4ade80' : '#ef4444' }}>
            {connected ? 'CONNECTED' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* MORE ME */}
      <div style={{ background: '#18181f', borderRadius: 16, padding: 24, border: `1px solid ${color}30`,
        marginBottom: 16, textAlign: 'center', boxShadow: `0 4px 30px ${color}10` }}>
        <Knob value={moreMe} onChange={setMoreMe} label="MORE ME" min={0} max={1} unit="" />
        <div style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)',
          marginTop: 8, letterSpacing: '0.1em' }}>BOOST YOUR CHANNEL IN YOUR MIX</div>
      </div>

      {/* Volume + Mute */}
      <div style={{ background: '#18181f', borderRadius: 16, padding: 20,
        border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)' }}>VOLUME</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color }}>{Math.round(myLevel * 100)}%</span>
            </div>
            <input type="range" min={0} max={100} value={myLevel * 100}
              onChange={e => setMyLevel(Number(e.target.value) / 100)}
              style={{ width: '100%', accentColor: color, height: 44 }} />
          </div>
          <button onClick={() => setMuted(!muted)} style={{
            width: 64, height: 64, borderRadius: 12, cursor: 'pointer',
            fontSize: 10, fontWeight: 900, fontFamily: 'monospace',
            background: muted ? '#ef4444' : 'rgba(255,255,255,0.06)',
            border: muted ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: muted ? '#fff' : 'rgba(255,255,255,0.3)',
            boxShadow: muted ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
          }}>{muted ? 'MUTED' : 'MUTE'}</button>
        </div>
      </div>

      {/* Personal EQ */}
      <div style={{ background: '#18181f', borderRadius: 16, padding: 20,
        border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
          letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 12 }}>PERSONAL EQ</span>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Knob value={bass} onChange={setBass} label="BASS" />
          <Knob value={treble} onChange={setTreble} label="TREBLE" />
        </div>
      </div>

      {/* Click Track */}
      <div style={{ background: '#18181f', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setClickEnabled(!clickEnabled)} style={{
          width: '100%', padding: 14, borderRadius: 10, cursor: 'pointer',
          fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.12em',
          background: clickEnabled ? `${color}15` : 'rgba(255,255,255,0.04)',
          border: clickEnabled ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.06)',
          color: clickEnabled ? color : 'rgba(255,255,255,0.3)',
        }}>🎵 CLICK TRACK {clickEnabled ? 'ON' : 'OFF'}</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 24, paddingBottom: 16 }}>
        <span style={{ fontSize: 7, fontFamily: 'monospace', color: 'rgba(255,255,255,0.1)',
          letterSpacing: '0.2em' }}>SANCTUARY OS · SONUS ENGINE</span>
      </div>
    </div>
  );
}
