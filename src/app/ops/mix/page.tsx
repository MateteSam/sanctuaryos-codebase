'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, Headphones, SlidersHorizontal, Brain, AlertTriangle } from 'lucide-react';

interface ChannelData {
  id: string;
  label: string;
  type: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
}

interface BusData {
  id: string;
  name: string;
  color: string;
  type: string;
  masterLevel: number;
  muted: boolean;
}

function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'heavy' ? 40 : 20);
  }
}

export default function MixPage() {
  const [channels, setChannels] = useState<ChannelData[]>([
    { id: 'ch-1', label: 'Lead Vocals', type: 'mic', volume: 0.75, muted: false, soloed: false },
    { id: 'ch-2', label: 'Keys', type: 'mic', volume: 0.6, muted: false, soloed: false },
    { id: 'ch-3', label: 'Drums OH', type: 'mic', volume: 0.5, muted: false, soloed: false },
    { id: 'ch-4', label: 'Bass DI', type: 'mic', volume: 0.65, muted: false, soloed: false },
    { id: 'ch-5', label: 'Guitar', type: 'mic', volume: 0.55, muted: false, soloed: false },
    { id: 'ch-6', label: 'BG Vocals', type: 'mic', volume: 0.45, muted: false, soloed: false },
  ]);

  const buses: BusData[] = [
    { id: 'foh', name: 'FOH', color: '#f0c14b', type: 'foh', masterLevel: 0.8, muted: false },
    { id: 'broadcast', name: 'BROADCAST', color: '#ef4444', type: 'broadcast', masterLevel: 0.75, muted: false },
    { id: 'mon-1', name: 'MON 1', color: '#34d399', type: 'monitor', masterLevel: 0.7, muted: false },
    { id: 'mon-2', name: 'MON 2', color: '#fbbf24', type: 'monitor', masterLevel: 0.65, muted: false },
  ];

  const [activeBus, setActiveBus] = useState('foh');
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState('--:--:--');
  const [autoMix, setAutoMix] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const setVolume = useCallback((id: string, vol: number) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, volume: vol } : ch));
    // In production: push to SSE state
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [`channel_${id}_volume`]: vol }),
    }).catch(() => {});
  }, []);

  const toggleMute = useCallback((id: string) => {
    haptic('medium');
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, muted: !ch.muted } : ch));
  }, []);

  const toggleSolo = useCallback((id: string) => {
    haptic('light');
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, soloed: !ch.soloed } : ch));
  }, []);

  const busData = buses.find(b => b.id === activeBus) ?? buses[0];
  const lufs = -14 + (Math.random() * 2 - 1); // Simulated

  return (
    <div className="h-[100dvh] flex flex-col bg-[#05060B] font-outfit text-[#e2e8f0] overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}>

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 h-12 surface-dark-steel shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <a href="/ops" className="touch-target flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </a>
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400/60">SONUS</div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white">Phone Mixer</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="display-lcd text-[10px] px-2 py-1">{time}</div>
          <div className={`led ${connected ? 'led-green' : 'led-red'}`} />
        </div>
      </div>

      {/* ═══ BUS TABS ═══ */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto shrink-0 swipe-container"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        {buses.map(bus => (
          <button key={bus.id}
            onClick={() => { setActiveBus(bus.id); haptic('light'); }}
            className="flex-shrink-0 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all touch-target"
            style={{
              background: activeBus === bus.id ? `${bus.color}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeBus === bus.id ? `${bus.color}30` : 'rgba(255,255,255,0.06)'}`,
              color: activeBus === bus.id ? bus.color : 'rgba(255,255,255,0.3)',
            }}>
            {bus.name}
          </button>
        ))}
      </div>

      {/* ═══ CHANNEL STRIPS (Horizontal) ═══ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 panel-scroll min-h-0">
        {channels.map(ch => (
          <div key={ch.id} className="surface-dark-steel rounded-xl p-3"
            style={{ opacity: ch.muted ? 0.4 : 1, transition: 'opacity 0.2s' }}>
            {/* Label Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ch.muted ? '#ef4444' : busData.color }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">{ch.label}</span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: busData.color }}>
                {Math.round(ch.volume * 100)}%
              </span>
            </div>

            {/* Horizontal Fader */}
            <input
              type="range" min={0} max={100} value={ch.volume * 100}
              onChange={e => setVolume(ch.id, Number(e.target.value) / 100)}
              className="daw-slider w-full mb-2"
              style={{ accentColor: busData.color }}
            />

            {/* Mute / Solo buttons */}
            <div className="flex gap-2">
              <button onClick={() => toggleMute(ch.id)}
                className="flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest touch-target active:scale-95 transition"
                style={{
                  background: ch.muted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${ch.muted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: ch.muted ? '#ef4444' : 'rgba(255,255,255,0.3)',
                }}>
                {ch.muted ? 'MUTED' : 'MUTE'}
              </button>
              <button onClick={() => toggleSolo(ch.id)}
                className="flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest touch-target active:scale-95 transition"
                style={{
                  background: ch.soloed ? `${busData.color}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${ch.soloed ? `${busData.color}40` : 'rgba(255,255,255,0.06)'}`,
                  color: ch.soloed ? busData.color : 'rgba(255,255,255,0.3)',
                }}>
                {ch.soloed ? 'SOLO\'D' : 'SOLO'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ BOTTOM CONTROL BAR ═══ */}
      <div className="shrink-0 p-3 surface-aluminum" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* LUFS Meter */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">BROADCAST</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.max(0, Math.min(100, (lufs + 40) * 2))}%`,
                background: lufs > -10 ? 'linear-gradient(90deg, #22c55e, #ef4444)' : lufs > -16 ? 'linear-gradient(90deg, #22c55e, #fbbf24)' : 'linear-gradient(90deg, #22c55e, #22c55e)',
              }} />
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400 w-14 text-right">{lufs.toFixed(1)} LUFS</span>
        </div>

        {/* AI Mix Toggle */}
        <div className="flex gap-2">
          <button onClick={() => { setAutoMix(!autoMix); haptic('medium'); }}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 touch-target active:scale-95 transition"
            style={{
              background: autoMix ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${autoMix ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: autoMix ? '#22d3ee' : 'rgba(255,255,255,0.3)',
            }}>
            <Brain className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">AI Mix {autoMix ? 'ON' : 'OFF'}</span>
          </button>
          <button className="py-3 px-4 rounded-xl flex items-center justify-center gap-2 touch-target active:scale-95 transition"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Ring Out</span>
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM STATUS ═══ */}
      <div className="h-7 flex items-center justify-between px-4 shrink-0"
        style={{ background: '#020408', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-purple-500' : 'bg-red-500'}`}
            style={{ boxShadow: connected ? '0 0 6px #a855f7' : '0 0 6px #ef4444' }} />
          <span className="text-[7px] font-mono font-bold text-slate-700 uppercase tracking-widest">
            SONUS · {busData.name}
          </span>
        </div>
        <span className="text-[7px] font-mono text-slate-800">v2.0</span>
      </div>
    </div>
  );
}
