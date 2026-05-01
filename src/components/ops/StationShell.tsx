'use client';

/**
 * StationShell — Shared layout wrapper for all operator stations.
 *
 * Provides a compact header with station name, live status,
 * connection indicator, and which other stations are online.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, WifiOff, Radio, Users, Clapperboard, Layers, SlidersHorizontal, Monitor } from 'lucide-react';
import { STATIONS, type OperatorStation, type OperatorPresence, type StationMeta } from '@/types/operatorTypes';
import type { ConnectionStatus } from '@/lib/useStationSync';

const STATION_ICONS: Record<string, React.ElementType> = {
  Clapperboard,
  Layers,
  SlidersHorizontal,
  Monitor,
};

interface Props {
  station: OperatorStation;
  connStatus: ConnectionStatus;
  isLive?: boolean;
  children: React.ReactNode;
}

export function StationShell({ station, connStatus, isLive, children }: Props) {
  const meta = STATIONS.find(s => s.id === station)!;
  const StationIcon = STATION_ICONS[meta.icon] || Monitor;

  const [activeOps, setActiveOps] = useState<OperatorPresence[]>([]);

  // Poll presence every 6 seconds
  useEffect(() => {
    const poll = () => {
      fetch('/api/ops/heartbeat')
        .then(r => r.json())
        .then(d => setActiveOps((d as any).operators ?? []))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 6000);
    return () => clearInterval(id);
  }, []);

  const otherOps = activeOps.filter(o => o.station !== station);

  return (
    <div className="h-screen flex flex-col bg-[#05060B] font-outfit text-[#e2e8f0] overflow-hidden selection:bg-sky-500/30">
      
      {/* ── STATION HEADER ── */}
      <div className="flex items-center justify-between px-5 h-11 border-b border-white/[0.04] shrink-0 z-50"
        style={{ background: `linear-gradient(180deg, ${meta.accentColor}08 0%, #0A0B10 100%)` }}>
        
        <div className="flex items-center gap-4">
          {/* Back to lobby */}
          <a href="/ops" className="flex items-center gap-2 text-slate-600 hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">Lobby</span>
          </a>

          <div className="h-5 w-px bg-white/[0.06]" />

          {/* Station badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${meta.accentColor}20`, border: `1px solid ${meta.accentColor}30` }}>
              <StationIcon className="w-3.5 h-3.5" style={{ color: meta.accentColor }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase leading-none"
                style={{ color: meta.accentColor }}>{meta.name}</span>
              <span className="text-[7px] font-bold text-slate-700 uppercase tracking-widest mt-0.5">
                Operator Station
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Other operators online */}
          {otherOps.length > 0 && (
            <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1 border border-white/[0.04]">
              <Users className="w-3 h-3 text-slate-600" />
              <div className="flex items-center gap-1.5">
                {otherOps.map(op => {
                  const opMeta = STATIONS.find(s => s.id === op.station);
                  if (!opMeta) return null;
                  return (
                    <div key={op.station} className="flex items-center gap-1"
                      title={`${opMeta.name} station is online`}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: opMeta.accentColor }} />
                      <span className="text-[8px] font-black uppercase tracking-wider"
                        style={{ color: opMeta.accentColor }}>{opMeta.id.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5 bg-black/40 rounded-lg px-3 py-1 border border-white/[0.04]">
            {connStatus === 'live' ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : connStatus === 'reconnecting' ? (
              <WifiOff className="w-3 h-3 text-amber-500 animate-pulse" />
            ) : (
              <Wifi className="w-3 h-3 text-slate-700 animate-pulse" />
            )}
            <span className={`text-[8px] font-black uppercase tracking-widest ${
              connStatus === 'live' ? 'text-emerald-500' :
              connStatus === 'reconnecting' ? 'text-amber-500' : 'text-slate-700'
            }`}>
              {connStatus === 'live' ? 'Synced' : connStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting'}
            </span>
          </div>

          {/* Live indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
            isLive ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/[0.04] bg-black/40'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-white tally-live' : 'bg-slate-800'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${isLive ? 'text-white' : 'text-slate-700'}`}>
              {isLive ? 'LIVE' : 'OFF AIR'}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="h-7 bg-[#05060B] border-t border-white/[0.04] flex items-center justify-between px-5 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-sky-500/50" />
            <span className="text-[8px] font-black uppercase text-slate-700 tracking-widest">
              SanctuaryOS Multi-Ops v1.0
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-mono text-slate-800">
            {activeOps.length} station{activeOps.length !== 1 ? 's' : ''} active
          </span>
          <span className="text-[8px] font-mono text-slate-800">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
