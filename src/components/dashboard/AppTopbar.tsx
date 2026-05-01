'use client';

import { Menu, Zap, Wifi, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AppTopbar({
  title,
  description,
  onToggleSidebar,
}: {
  title: string;
  description?: string;
  onToggleSidebar: () => void;
}) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mb-4 surface-aluminum rounded-xl px-4 py-3 md:px-5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden touch-target hover:bg-white/10 transition"
          >
            <Menu className="h-4 w-4 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="led led-sky" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400/60">SanctuaryOS</p>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">{title}</h1>
            {description && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{description}</p>}
          </div>
        </div>

        {/* Right: Status Indicators */}
        <div className="hidden md:flex items-center gap-3">
          {/* Timecode */}
          <div className="display-lcd text-xs px-3 py-1.5">
            {time}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] surface-dark-steel">
            <div className="led led-green" />
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Connected</span>
          </div>

          {/* Campus Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] surface-dark-steel">
            <Radio className="w-3 h-3 text-sky-500/50" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Main Campus</span>
          </div>
        </div>
      </div>
    </header>
  );
}
