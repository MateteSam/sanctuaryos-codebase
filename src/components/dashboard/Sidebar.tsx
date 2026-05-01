'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, ScanLine, Building2, Cloud, Settings, ArrowLeft, X, Zap, Camera, SlidersHorizontal, Users, Layers, Tv2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/app',      label: 'Live Control',  icon: Radio,              shortcut: 'L', accent: '#ef4444' },
  { href: '/ops',      label: 'Stations',      icon: Users,              shortcut: 'S', accent: '#0ea5e9' },
  { href: '/mapping',  label: 'Room Map',       icon: ScanLine,          shortcut: 'M', accent: '#a855f7' },
  { href: '/rooms',    label: 'Rooms',          icon: Building2,         shortcut: 'R', accent: '#22c55e' },
  { href: '/cloud',    label: 'Cloud',          icon: Cloud,             shortcut: 'C', accent: '#38bdf8' },
  { href: '/settings', label: 'Settings',       icon: Settings,          shortcut: '⌘,', accent: '#64748b' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [time, setTime] = useState('--:--:--');
  const [frameRate, setFrameRate] = useState('60');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let rafId: number;
    const measure = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFrameRate(String(frames));
        frames = 0;
        last = now;
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-[260px] flex flex-col surface-aluminum lg:sticky lg:z-0 lg:h-[calc(100vh-24px)] lg:translate-x-0 lg:rounded-2xl lg:m-3 lg:mr-0 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ── BRAND HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #0e1015 0%, #1a1c22 100%)', border: '1px solid rgba(14,165,233,0.2)', boxShadow: '0 0 16px rgba(14,165,233,0.08)' }}>
              <Zap className="w-4 h-4 text-sky-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full led-green" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white leading-none">SanctuaryOS</h2>
              <p className="text-[7px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-0.5">Broadcast Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 p-1.5 lg:hidden hover:bg-white/10 transition">
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* ── LCD CLOCK DISPLAY ── */}
        <div className="mx-4 mb-4">
          <div className="display-lcd text-center text-sm tracking-[0.2em]">
            {time}
          </div>
        </div>

        <div className="panel-divider-h mx-4" />

        {/* ── NAVIGATION RACK ── */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto panel-scroll">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/app' && pathname?.startsWith('/app'));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn('rack-button w-full touch-target', isActive && 'active')}>
                <div className={cn('led', isActive ? 'led-sky' : 'led-off')} />
                <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-sky-400' : 'text-slate-600')} />
                <span className={cn('text-xs font-bold tracking-wide flex-1 transition-colors', isActive ? 'text-white' : 'text-slate-500')}>
                  {item.label}
                </span>
                <span className="text-[7px] font-mono text-slate-700 tracking-wider">{item.shortcut}</span>
              </Link>
            );
          })}
        </nav>

        <div className="panel-divider-h mx-4" />

        {/* ── SYSTEM TELEMETRY PANEL ── */}
        <div className="p-4 space-y-3">
          <div className="text-[7px] font-black uppercase tracking-[0.25em] text-slate-600 mb-2">System Telemetry</div>
          
          {/* VU-style system meters */}
          <div className="space-y-2">
            {/* Engine Status */}
            <div className="flex items-center gap-2.5">
              <div className="led led-green" />
              <span className="text-[9px] font-mono font-bold text-slate-500 flex-1">ENGINE</span>
              <span className="text-[9px] font-mono text-emerald-500">{frameRate}fps</span>
            </div>
            {/* SSE Connection */}
            <div className="flex items-center gap-2.5">
              <div className="led led-sky breathe" />
              <span className="text-[9px] font-mono font-bold text-slate-500 flex-1">SSE BUS</span>
              <span className="text-[9px] font-mono text-sky-500">ACTIVE</span>
            </div>
            {/* Cloud Sync */}
            <div className="flex items-center gap-2.5">
              <div className="led led-amber" />
              <span className="text-[9px] font-mono font-bold text-slate-500 flex-1">CLOUD</span>
              <span className="text-[9px] font-mono text-amber-500">STANDBY</span>
            </div>
          </div>

          {/* Mini VU Bar */}
          <div className="flex gap-0.5 items-end h-4 rounded overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.4)', padding: '2px' }}>
            {[0.6, 0.8, 0.7, 0.9, 0.5, 0.7, 0.85, 0.6, 0.75, 0.9, 0.4, 0.65].map((h, i) => (
              <div key={i} className="flex-1 rounded-[1px] transition-all duration-300"
                style={{
                  height: `${h * 100}%`,
                  background: h > 0.85 ? '#ef4444' : h > 0.7 ? '#f59e0b' : '#22c55e',
                  opacity: 0.7 + Math.random() * 0.3,
                }} />
            ))}
          </div>
        </div>

        <div className="panel-divider-h mx-4" />

        {/* ── BACK LINK ── */}
        <div className="p-3">
          <Link href="/" onClick={onClose}
            className="rack-button w-full justify-center touch-target">
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Back to Site</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
