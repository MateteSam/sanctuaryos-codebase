'use client';

import { motion, useAnimation } from 'framer-motion';
import { Zap, Activity, Settings2, Scissors } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Props {
  onCut: () => void;
  onFade: () => void;
  isFading: boolean;
  tBarValue: number;
  setTBarValue: (v: number) => void;
}

const TRANSITIONS = ['FADE', 'WIPE', 'ZOOM', 'FLY'];

export function TransitionPillar({ onCut, onFade, isFading, tBarValue, setTBarValue }: Props) {
  const [time, setTime] = useState('');
  const [activeTrans, setActiveTrans] = useState('FADE');
  const gearControls = useAnimation();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Spin the gear when fading
  useEffect(() => {
    if (isFading) {
      gearControls.start({ rotate: 360, transition: { duration: 0.6, ease: "linear" } }).then(() => gearControls.set({ rotate: 0 }));
    }
  }, [isFading, gearControls]);

  return (
    <div className="w-40 flex flex-col gap-6 py-6 px-3 bg-gradient-to-b from-[#0a0b10] via-[#05060b] to-[#020305] border-x border-white/[0.08] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] items-center shrink-0 relative overflow-hidden">
      
      {/* Cinematic background texture */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      
      {/* ── CUT BUTTON (ARC REACTOR STYLE) ── */}
      <div className="relative w-full flex flex-col items-center z-10 group">
        <span className="pro-label mb-2 tracking-[0.3em] text-slate-400">Master Take</span>
        
        <motion.button
          onClick={onCut}
          whileTap={{ scale: 0.9, y: 4 }}
          className="relative w-24 h-24 rounded-full flex items-center justify-center outline-none"
        >
          {/* Outer Bezel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_-4px_8px_rgba(0,0,0,0.4)]" />
          
          {/* Inner Glowing Core */}
          <div className="absolute inset-1.5 rounded-full bg-gradient-to-b from-red-500 to-red-800 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center overflow-hidden border-2 border-red-950">
             {/* Carbon fiber pattern overlay */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 4px)' }} />
             
             <div className="flex flex-col items-center z-10">
                <Scissors className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span className="text-[10px] font-black tracking-[0.2em] text-white mt-1 drop-shadow-md">CUT</span>
             </div>
          </div>

          {/* Hover Glow */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 shadow-[0_0_40px_rgba(239,68,68,0.8)] transition-opacity duration-300 pointer-events-none" />
        </motion.button>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* ── TRANSITION SELECTOR ── */}
      <div className="w-full bg-black/60 rounded-xl p-1.5 border border-white/10 shadow-inner grid grid-cols-2 gap-1 z-10">
         {TRANSITIONS.map(t => (
           <button 
             key={t}
             onClick={() => setActiveTrans(t)}
             className={`py-1.5 rounded-lg text-[8px] font-black tracking-widest transition-all ${
               activeTrans === t 
                 ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' 
                 : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
             }`}
           >
             {t}
           </button>
         ))}
      </div>

      {/* ── ROTARY GEAR (AUTO) ── */}
      <div className="relative w-full flex flex-col items-center mt-2 z-10 group">
        <span className="pro-label mb-2 tracking-[0.3em] text-sky-400">Auto Mix</span>
        
        <motion.button
          onClick={onFade}
          disabled={isFading}
          className="relative w-20 h-20 outline-none"
        >
          {/* Gear Engine */}
          <motion.div 
            animate={gearControls}
            className={`absolute inset-0 rounded-full border-4 border-dashed transition-colors duration-300 ${isFading ? 'border-sky-400 drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]' : 'border-slate-600 group-hover:border-slate-400'}`}
          />
          
          {/* Inner Core */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#1a1c23] to-[#0a0b10] border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isFading ? 'bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.6)]' : 'bg-black/50 border border-white/5'}`}>
                <Zap className={`w-4 h-4 ${isFading ? 'text-white' : 'text-slate-500'}`} />
             </div>
          </div>
        </motion.button>
      </div>

      {/* ── T-BAR MOTORIZED FADER ── */}
      <div className="flex-1 flex flex-col items-center gap-3 w-full z-10 py-2">
        <div className="flex justify-between w-full px-4 text-[7px] font-black uppercase text-slate-600 tracking-widest">
           <span>0%</span>
           <span>100%</span>
        </div>
        
        <div className="relative w-12 h-full min-h-[140px] bg-[#05060b] rounded-full border border-white/10 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] flex justify-center py-2">
           {/* LED Track */}
           <div className="absolute top-2 bottom-2 w-1.5 rounded-full bg-black overflow-hidden flex flex-col justify-end">
              <div 
                className="w-full bg-gradient-to-t from-sky-600 via-sky-400 to-white shadow-[0_0_10px_rgba(14,165,233,0.8)] transition-all duration-75"
                style={{ height: `${tBarValue}%` }}
              />
           </div>

           {/* Fader Handle */}
           <motion.div 
             className="absolute w-16 h-8 bg-gradient-to-b from-slate-200 to-slate-400 rounded-md border-b-4 border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.6),0_2px_5px_rgba(255,255,255,0.4)_inset] cursor-ns-resize flex items-center justify-center z-20 group-hover:from-white group-hover:to-slate-300"
             style={{ top: `${100 - tBarValue}%`, marginTop: '-16px' }}
             drag="y"
             dragConstraints={{ top: 0, bottom: 120 }} // Approximate constraint, math needs to map perfectly in production
             dragElastic={0}
             dragMomentum={false}
             onDrag={(_, info) => {
               const trackHeight = 120; // Simulated track height
               const percent = Math.max(0, Math.min(100, tBarValue - (info.delta.y / trackHeight) * 100));
               setTBarValue(percent);
             }}
           >
              <div className="w-8 h-1 bg-black/30 rounded-full" />
              <div className="absolute -left-2 w-1 h-3 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
           </motion.div>
        </div>
      </div>

      {/* ── SYSTEM DATA ── */}
      <div className="w-full space-y-3 px-1 z-10 mt-2">
        <div className="flex flex-col gap-1 items-center bg-black/80 rounded-xl p-2 border border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]">
           <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-red-500">{time}</span>
           </div>
           <span className="text-[7px] font-black uppercase text-red-500/50 tracking-[0.2em]">Master Sync</span>
        </div>
      </div>

    </div>
  );
}
