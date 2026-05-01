'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Sparkles, Radio, Camera, Music, Layers3, Cpu, Wifi, Monitor, Zap, ChevronRight,
  SlidersHorizontal, Users, Tv2, Globe, Mic, Film, Gauge, Shield, Podcast,
  ArrowUpRight, Play
} from 'lucide-react';

/* ── Live System Vitals ──────────────────────────────────────────────── */
function SystemVitals() {
  const [time, setTime] = useState('--:--:--');
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let last = performance.now(), frames = 0, rafId: number;
    const measure = (now: number) => {
      frames++;
      if (now - last >= 1000) { setFps(frames); frames = 0; last = now; }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const vitals = [
    { label: 'SYS TIME', value: time, color: '#4ade80' },
    { label: 'RENDER', value: `${fps}fps`, color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444' },
    { label: 'SSE BUS', value: 'ACTIVE', color: '#38bdf8' },
    { label: 'LATENCY', value: '<1ms', color: '#4ade80' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {vitals.map(v => (
        <div key={v.label} className="surface-dark-steel rounded-lg p-3 flex items-center gap-3">
          <div className="led" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}60` }} />
          <div>
            <div className="text-[7px] font-mono font-bold text-slate-600 uppercase tracking-[0.2em]">{v.label}</div>
            <div className="text-xs font-mono font-bold" style={{ color: v.color }}>{v.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Quick Launch Module Card ────────────────────────────────────────── */
function ModuleCard({ href, icon: Icon, label, desc, accent, shortcut, badge }: {
  href: string; icon: React.ElementType; label: string; desc: string;
  accent: string; shortcut?: string; badge?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex flex-col p-5 rounded-2xl surface-aluminum overflow-hidden cursor-pointer touch-target"
        style={{ borderColor: `${accent}15` }}
      >
        {/* Glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${accent}08 0%, transparent 60%)` }} />

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
                {badge}
              </span>
            )}
            <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
          </div>
        </div>

        <h3 className="text-sm font-black text-white tracking-tight mb-1 relative z-10">{label}</h3>
        <p className="text-[10px] text-slate-500 leading-relaxed flex-1 relative z-10">{desc}</p>

        {shortcut && (
          <div className="flex items-center justify-between mt-4 pt-3 relative z-10" style={{ borderTop: `1px solid ${accent}10` }}>
            <span className="text-[7px] font-mono text-slate-700 uppercase tracking-widest">
              Shortcut: {shortcut}
            </span>
            <div className="led" style={{ background: `${accent}40`, boxShadow: `0 0 4px ${accent}20` }} />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

/* ── Feature Showcase Card ───────────────────────────────────────────── */
function FeatureShowcase({ icon: Icon, title, subtitle, description, visual, accent }: {
  icon: React.ElementType; title: string; subtitle: string; description: string;
  visual: React.ReactNode; accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0e1015 0%, #0a0c10 100%)', border: `1px solid ${accent}12` }}
    >
      {/* Visual Area */}
      <div className="h-40 relative overflow-hidden flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${accent}06 0%, transparent 60%)` }}>
        {visual}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color: accent }} />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: accent }}>{subtitle}</span>
        </div>
        <h3 className="text-base font-black text-white tracking-tight mb-2">{title}</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ── Animated Waveform Visual ────────────────────────────────────────── */
function WaveformVisual() {
  return (
    <div className="flex items-end gap-[2px] h-20 px-8">
      {Array.from({ length: 32 }, (_, i) => {
        const h = 20 + Math.sin(i * 0.5) * 40 + Math.random() * 20;
        return (
          <motion.div key={i}
            animate={{ height: [h, h * 0.6, h, h * 0.8, h] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
            className="flex-1 rounded-t-[1px]"
            style={{
              background: `linear-gradient(to top, #22c55e, ${i > 24 ? '#fbbf24' : '#22c55e'}, ${i > 28 ? '#ef4444' : '#22c55e'})`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Color Science Visual ────────────────────────────────────────────── */
function ColorScienceVisual() {
  return (
    <div className="flex items-center justify-center gap-4 px-8">
      {['Portra', 'CineStill', 'Kodachrome'].map((name, i) => (
        <motion.div key={name}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-10 rounded-lg overflow-hidden"
            style={{
              background: i === 0
                ? 'linear-gradient(135deg, #daa520 0%, #8b4513 50%, #2d1b00 100%)'
                : i === 1
                ? 'linear-gradient(135deg, #1a237e 0%, #00bcd4 50%, #ff6f00 100%)'
                : 'linear-gradient(135deg, #b71c1c 0%, #f57c00 50%, #1b5e20 100%)',
              opacity: 0.8,
            }}
          />
          <span className="text-[7px] font-mono font-bold text-slate-600 uppercase">{name}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Device Connection Visual ────────────────────────────────────────── */
function DeviceVisual() {
  return (
    <div className="flex items-center justify-center gap-6 px-8">
      {[
        { Icon: Camera, label: 'CAM 1', color: '#ef4444' },
        { Icon: Monitor, label: 'CAM 2', color: '#22c55e' },
        { Icon: Tv2, label: 'CAM 3', color: '#0ea5e9' },
      ].map(({ Icon, label, color }, i) => (
        <motion.div key={label}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[7px] font-mono font-bold text-slate-600">{label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN: COMMAND CENTER
   ═══════════════════════════════════════════════════════════════════════ */
export function OverviewContent() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-outfit">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 h-14 surface-dark-steel"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-white">SanctuaryOS</span>
            <span className="hidden md:inline text-[7px] text-slate-600 font-bold uppercase tracking-[0.2em] ml-2">Broadcast Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#tech" className="hover:text-white transition">Technology</a>
            <a href="#vision" className="hover:text-white transition">Vision</a>
          </div>
          <Link href="/app"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest touch-target transition-all"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 24px rgba(14,165,233,0.2)' }}>
            <Play className="w-3 h-3 text-white" /> Launch
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center px-4 md:px-8 pt-24 pb-12 text-center overflow-hidden">
        {/* Background machinery */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-[300px] h-[200px] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', color: '#38bdf8' }}>
            <Sparkles className="w-3 h-3" /> Church in the Pocket
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Your entire church<br />
            <span className="text-gradient-sky">production suite.</span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
            Multi-camera switching, broadcast-grade audio mixing, live slide control, cinematic color science, and in-ear monitoring — all from your phone. No hardware required. No installs. Just open and go live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/app"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest touch-target-lg transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 40px rgba(14,165,233,0.2)' }}>
              <Zap className="w-4 h-4" /> Launch Desktop
            </Link>
            <Link href="/ops"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest touch-target-lg transition-all active:scale-95 surface-glass"
              style={{ color: '#38bdf8' }}>
              <Monitor className="w-4 h-4" /> Open on Phone
            </Link>
          </div>
        </motion.div>

        {/* Live Vitals Strip */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="relative mt-12 w-full max-w-3xl">
          <SystemVitals />
        </motion.div>
      </section>

      {/* ── QUICK LAUNCH ── */}
      <section id="features" className="px-4 md:px-8 py-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="panel-divider-h flex-1" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-sky-500/50">Control Modules</span>
          <div className="panel-divider-h flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ModuleCard href="/app" icon={Radio} label="Live Broadcast" accent="#ef4444" shortcut="L"
            desc="Full multi-camera switcher, slides, overlays, and atmosphere — unified in one console." badge="CORE" />
          <ModuleCard href="/ops" icon={Users} label="Multi-Ops Stations" accent="#0ea5e9" shortcut="S"
            desc="Split control across volunteers. Director, slides, audio — each on separate devices." />
          <ModuleCard href="/ops/switch" icon={Camera} label="Phone Switcher" accent="#22c55e" shortcut="⌘S"
            desc="Cut between cameras directly from your phone. Touch-native, gesture-driven switching." badge="NEW" />
          <ModuleCard href="/ops/mix" icon={SlidersHorizontal} label="Phone Mixer" accent="#a855f7" shortcut="⌘M"
            desc="Walk the room and mix audio from your phone. Horizontal faders, ring-out mode, AI mix." badge="NEW" />
          <ModuleCard href="/mapping" icon={Layers3} label="Room Mapping" accent="#f59e0b" shortcut="M"
            desc="Spatial map of your sanctuary. Position Beam devices, screens, and zones visually." />
          <ModuleCard href="/settings" icon={Shield} label="System Settings" accent="#64748b" shortcut="⌘,"
            desc="Hardware bridges (OBS, vMix, ATEM), cloud sync, and device management." />
        </div>
      </section>

      {/* ── TECHNOLOGY SHOWCASE ── */}
      <section id="tech" className="px-4 md:px-8 py-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="panel-divider-h flex-1" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500/50">Groundbreaking Technology</span>
          <div className="panel-divider-h flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FeatureShowcase icon={Music} title="SONUS Audio Engine" subtitle="Broadcast Audio"
            accent="#22c55e"
            description="14 professional presets. 4-band parametric EQ. Gate, compressor, de-esser. AI-powered auto-mix and feedback kill. Broadcast-standard LUFS monitoring."
            visual={<WaveformVisual />} />
          <FeatureShowcase icon={Film} title="Genesis II Color Science" subtitle="GPU-Accelerated"
            accent="#a855f7"
            description="WebGL2 real-time processing. ACES filmic tonemapping. Film stock emulation (Portra, CineStill, Kodachrome). Skin-tone protection. Bradford white balance."
            visual={<ColorScienceVisual />} />
          <FeatureShowcase icon={Camera} title="Wireless Multi-Camera" subtitle="WebRTC P2P"
            accent="#0ea5e9"
            description="Turn any phone into a broadcast camera via QR code. Tally lights, director cues, tap-to-focus, adaptive bitrate. Zero latency P2P streaming."
            visual={<DeviceVisual />} />
        </div>
      </section>

      {/* ── HARDWARE VISION ── */}
      <section id="vision" className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-400/60 mb-3 block">Future Hardware</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                Sanctuary Beams.<br />
                <span className="text-slate-600">Purpose-built nodes.</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                We&apos;re engineering dedicated hardware nodes — compact, ruggedized processing units that clip onto
                projectors, monitors, and mixing desks. Ultra-low latency. Zero configuration. Today the software
                runs beautifully in any browser. Tomorrow, custom silicon takes it to zero-compromise.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Cpu, label: 'Custom Silicon', color: '#f59e0b' },
                  { icon: Wifi, label: 'Wireless-first', color: '#0ea5e9' },
                  { icon: Zap, label: '<5ms Latency', color: '#22c55e' },
                  { icon: Monitor, label: 'Beam-compatible', color: '#a855f7' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: `${color}10`, border: `1px solid ${color}15`, color }}>
                    <Icon className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Mockup */}
            <div className="surface-aluminum rounded-2xl p-8 min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-sky-500/10" />
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-violet-500/10" />
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ boxShadow: ['0 0 20px rgba(14,165,233,0.1)', '0 0 40px rgba(14,165,233,0.2)', '0 0 20px rgba(14,165,233,0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-48 h-16 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full led-sky breathe" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Beam MK1</span>
                </motion.div>
                <p className="text-[8px] text-slate-600 uppercase tracking-[0.3em] font-bold">In Development</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-violet-400/60 mb-3 block">The Vision</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Built in Africa.<br />For every church in the world.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            Every congregation — regardless of size or budget — deserves a world-class production experience.
            SanctuaryOS is that platform. Professional-grade, open in philosophy, and built to scale from a 50-seat chapel
            to a 10,000-seat arena.
          </p>
          <Link href="/app"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white text-sm font-black uppercase tracking-widest touch-target-lg active:scale-95 transition"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', boxShadow: '0 0 50px rgba(14,165,233,0.15)' }}>
            <Sparkles className="w-4 h-4" /> Try SanctuaryOS Now
          </Link>
          <p className="mt-4 text-[10px] text-slate-600">No download. No login. Opens instantly in your browser.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 md:px-8 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sm font-black tracking-tight">SanctuaryOS</span>
        </div>
        <p className="text-[9px] text-slate-700 font-mono uppercase tracking-[0.2em]">
          © 2026 SanctuaryOS · Built for worship · Engineered for impact
        </p>
      </footer>
    </div>
  );
}
