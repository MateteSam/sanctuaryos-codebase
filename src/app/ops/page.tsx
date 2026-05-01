'use client';

/**
 * /ops — Multi-Operator Station Lobby
 *
 * Landing page where volunteers choose which station to operate.
 * Shows live presence indicators for which stations are active.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, Layers, SlidersHorizontal, Monitor, Users, Radio, ExternalLink, Wifi, Tv2, Sparkles, Zap, Smartphone, Music } from 'lucide-react';
import { STATIONS, type OperatorPresence, type StationMeta } from '@/types/operatorTypes';

const ICON_MAP: Record<string, React.ElementType> = {
  Clapperboard,
  Layers,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Music,
};

export default function OpsLobbyPage() {
  const [activeOps, setActiveOps] = useState<OperatorPresence[]>([]);
  const [time, setTime] = useState('');

  useEffect(() => {
    const poll = () => {
      fetch('/api/ops/heartbeat')
        .then(r => r.json())
        .then(d => setActiveOps((d as any).operators ?? []))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isOnline = (stationId: string) => activeOps.some(o => o.station === stationId);

  return (
    <div className="h-screen flex flex-col bg-[#05060B] font-outfit text-[#e2e8f0] overflow-hidden selection:bg-sky-500/30">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-8 h-14 border-b border-white/[0.04] bg-[#0A0B10] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_12px_#0ea5e9] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-[0.4em] uppercase text-sky-500 leading-none">SANCTUARY OS</span>
              <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Multi-Operator System</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {activeOps.length} station{activeOps.length !== 1 ? 's' : ''} active
            </span>
          </div>
          <span className="text-sm font-mono font-bold text-slate-600">{time}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-0">
        
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-sky-500/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-sky-500/60">Multi-Ops Control</span>
            <Sparkles className="w-5 h-5 text-sky-500/40" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">Choose Your Station</h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Each station controls a dedicated section of the broadcast. Multiple volunteers can operate different stations simultaneously.
          </p>
        </motion.div>

        {/* ── STATION GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {STATIONS.map((station, idx) => {
            const Icon = ICON_MAP[station.icon] || Monitor;
            const online = isOnline(station.id);
            
            return (
              <motion.a
                key={station.id}
                href={station.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 overflow-hidden hover:scale-[1.02]"
                style={{
                  borderColor: `${station.accentColor}20`,
                  background: `linear-gradient(180deg, ${station.accentColor}08 0%, #0A0B1000 60%)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${station.accentColor}50`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${station.accentColor}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${station.accentColor}20`;
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${station.accentColor}10 0%, transparent 70%)` }} />

                {/* Online indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative z-10"
                    style={{ background: `${station.accentColor}15`, border: `1px solid ${station.accentColor}25` }}>
                    <Icon className="w-6 h-6" style={{ color: station.accentColor }} />
                  </div>
                  
                  {online ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Available</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1">
                  <h2 className="text-lg font-black text-white mb-1.5 tracking-tight">{station.name}</h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{station.description}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t relative z-10"
                  style={{ borderColor: `${station.accentColor}15` }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                      Shortcut: {station.shortcut}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 group-hover:translate-x-1 transition-transform"
                    style={{ color: station.accentColor }}>
                    <span className="text-[9px] font-black uppercase tracking-widest">Enter</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* ── TIPS ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 flex items-center gap-6 text-[10px] text-slate-700">
          <div className="flex items-center gap-2">
            <Tv2 className="w-3.5 h-3.5" />
            <span>Drag windows to separate monitors for multi-screen setup</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span>Phones & tablets can connect via local network</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span>All changes sync in real-time across stations</span>
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="h-8 bg-[#05060B] border-t border-white/[0.04] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-sky-500/50" />
          <span className="text-[8px] font-black uppercase text-slate-700 tracking-widest">SanctuaryOS Multi-Ops v1.0</span>
        </div>
        <a href="/app" className="text-[8px] font-black uppercase text-slate-700 tracking-widest hover:text-white transition-colors">
          ← Back to Master Console
        </a>
      </div>
    </div>
  );
}
