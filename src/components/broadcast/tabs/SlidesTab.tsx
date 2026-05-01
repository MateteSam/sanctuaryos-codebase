'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Type, Sparkles, Send, X, Layers, Music, BookOpen, Clock, Plus, Zap } from 'lucide-react';
import { type SlideData } from '@/data/lyrics';
import { type detectVerseReferences } from '@/data/verseDetector';
import { type AtmospherePreset } from '@/data/atmospheres';

interface Props {
  allSlides: SlideData[];
  activeSlideIndex: number;
  onSlide: (idx: number) => void;
  onClear: () => void;
  customText: string;
  setCustomText: (v: string) => void;
  customRef: string;
  setCustomRef: (v: string) => void;
  detectedVerses: ReturnType<typeof detectVerseReferences>;
  onPushDetected: (raw: string) => void;
  onCustomPush: () => void;
  activeAtmos: AtmospherePreset;
}

export function SlidesTab({
  allSlides, activeSlideIndex, onSlide, onClear,
  customText, setCustomText, customRef, setCustomRef,
  detectedVerses, onPushDetected, onCustomPush, activeAtmos
}: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 font-outfit">
      
      {/* ── ACTIVE SET ── */}
      <div className="flex-1 overflow-y-auto panel-scroll p-6 space-y-3">
        <div className="flex items-center justify-between mb-4 px-1">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white">Active Setlist</p>
           </div>
           <button onClick={onClear} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 transition-colors">Clear Set</button>
        </div>

        <div className="space-y-2">
          {allSlides.map((slide, i) => {
            const isActive = activeSlideIndex === i;
            const Icon = slide.type === 'scripture' ? BookOpen : Music;
            
            return (
              <motion.button
                key={slide.id + i}
                onClick={() => onSlide(i)}
                whileTap={{ scale: 0.98 }}
                className={`w-full group relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                  isActive 
                    ? 'bg-sky-500 border-sky-400 shadow-[0_10px_25px_rgba(14,165,233,0.3)]' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-sky-500/60'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-black/80' : 'text-slate-500'}`}>
                       {slide.type} {slide.reference ? `· ${slide.reference}` : ''}
                    </span>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
                </div>
                
                <p className={`text-xs font-bold leading-relaxed line-clamp-2 uppercase tracking-wide transition-colors ${isActive ? 'text-black' : 'text-slate-300'}`}>
                  {slide.content}
                </p>

                {isActive && (
                  <motion.div layoutId="slide-glow" className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
              </motion.button>
            );
          })}

          {allSlides.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
               <Layers className="w-10 h-10" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Session setlist is empty</p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK INJECTION ── */}
      <div className="p-6 bg-black/40 border-t border-white/[0.04] backdrop-blur-xl shrink-0 space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Zap className="w-4 h-4 text-sky-400" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Injector</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-4 relative overflow-hidden">
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Type lyrics or verse reference..."
            className="w-full bg-transparent border-none outline-none resize-none text-sm font-bold text-white placeholder-slate-700 min-h-[80px] uppercase tracking-wide"
          />

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
             <div className="flex gap-2">
               {detectedVerses.map(v => (
                 <button key={v.raw} onClick={() => onPushDetected(v.raw)}
                   className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[9px] font-black text-sky-400 uppercase tracking-widest hover:bg-sky-500/20 transition-all flex items-center gap-1.5">
                   <Plus className="w-3 h-3" /> {v.raw}
                 </button>
               ))}
               {detectedVerses.length === 0 && (
                 <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter self-center">No verses detected</span>
               )}
             </div>

             <motion.button
               whileTap={{ scale: 0.95 }}
               onClick={onCustomPush}
               disabled={!customText.trim()}
               className="h-10 px-6 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
             >
               <Send className="w-3.5 h-3.5" />
               INJECT
             </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
