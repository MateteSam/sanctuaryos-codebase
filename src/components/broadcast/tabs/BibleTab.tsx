'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, BookOpen, ChevronRight, Share2, Sparkles, X, Activity, MessageSquare } from 'lucide-react';
import { TRANSLATIONS, type BibleTranslation } from '@/lib/useBibleApi';
import { type AtmospherePreset } from '@/data/atmospheres';

interface Props {
  bibleSearchInput: string;
  setBibleSearchInput: (v: string) => void;
  bibleTranslation: BibleTranslation;
  setBibleTranslation: (v: BibleTranslation) => void;
  bibleLoading: boolean;
  bibleError: string | null;
  bibleResult: { reference: string; text: string } | null;
  onFetchVerse: () => void;
  onClearResult: () => void;
  onPushVerse: (v: any) => void;
  onPushResult: (slide: any) => void;
  voiceSupported: boolean;
  isListening: boolean;
  voiceTranscript: string;
  voiceDetected: string;
  voiceError: string | null;
  onToggleListening: () => void;
  activeAtmos: AtmospherePreset;
}

export function BibleTab({
  bibleSearchInput, setBibleSearchInput, bibleTranslation, setBibleTranslation,
  bibleLoading, bibleError, bibleResult, onFetchVerse, onClearResult, onPushVerse, onPushResult,
  voiceSupported, isListening, voiceTranscript, voiceDetected, voiceError, onToggleListening,
  activeAtmos
}: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 font-outfit">
      
      {/* ── SEARCH HEADER ── */}
      <div className="p-6 space-y-4 bg-gradient-to-b from-black/20 to-transparent border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-400" />
           </div>
           <div className="flex flex-col">
              <p className="text-xs font-black uppercase tracking-widest text-white">Scripture Engine</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live Retrieval · {bibleTranslation.toUpperCase()}</p>
           </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-sky-500 transition-colors" />
              <input value={bibleSearchInput} onChange={e => setBibleSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onFetchVerse()}
                placeholder="Search verse (e.g. Genesis 1:1)..."
                className="pro-input w-full pl-11 h-12" />
            </div>
            <button onClick={onFetchVerse} disabled={bibleLoading}
              className="px-6 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50">
              {bibleLoading ? '...' : 'FIND'}
            </button>
          </div>

          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
             {TRANSLATIONS.map(({ id, label }) => (
               <button key={id} onClick={() => setBibleTranslation(id)}
                 className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bibleTranslation === id ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                 {label}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* ── RESULTS AREA ── */}
      <div className="flex-1 overflow-y-auto panel-scroll p-6">
        <AnimatePresence mode="wait">
          {bibleLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 space-y-4">
               <div className="w-12 h-12 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500 animate-pulse">Retrieving Scripture</p>
            </motion.div>
          )}

          {bibleResult && !bibleLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel-heavy rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/40" />
              <div className="flex items-center justify-between mb-6">
                 <div className="flex flex-col">
                    <p className="text-2xl font-black tracking-tight text-white">{bibleResult.reference}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{bibleTranslation.toUpperCase()} VERSION</p>
                 </div>
                 <button onClick={onClearResult} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-500 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              <p className="text-lg text-slate-200 leading-relaxed font-medium italic mb-8">"{bibleResult.text}"</p>
              
              <div className="flex gap-3">
                 <motion.button whileTap={{ scale: 0.98 }} onClick={() => onPushResult({ id: `bible-${Date.now()}`, type: 'scripture', reference: bibleResult.reference, content: bibleResult.text, title: bibleResult.reference })}
                   className="flex-1 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-slate-200">
                   PUSH TO STAGE
                 </motion.button>
              </div>
            </motion.div>
          )}

          {!bibleLoading && !bibleResult && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
               <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                  <Activity className="w-8 h-8 text-slate-800" />
               </div>
               <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">No active scripture</p>
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-tighter">Enter a reference or use voice control</p>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── VOICE CONTROL BAR ── */}
      {voiceSupported && (
        <div className="p-6 bg-black/40 border-t border-white/[0.04] backdrop-blur-xl shrink-0">
          <div className={`p-4 rounded-3xl border transition-all duration-500 ${isListening ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'bg-white/[0.03] border-white/[0.08]'}`}>
            <div className="flex items-center gap-4">
               <motion.button animate={isListening ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
                 onClick={onToggleListening}
                 className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-600 text-white shadow-xl' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'}`}>
                 {isListening ? <Activity className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </motion.button>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 tally-live' : 'bg-slate-700'}`} />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isListening ? 'Listening for Scripture...' : 'Voice Control Inactive'}</p>
                  </div>
                  <p className={`text-xs font-bold truncate transition-colors ${isListening ? 'text-white' : 'text-slate-700'}`}>
                    {isListening ? (voiceTranscript || 'SAY A REFERENCE (E.G. JOHN 3:16)...') : 'Tap mic to start voice retrieval'}
                  </p>
               </div>
               {isListening && (
                 <div className="flex gap-1">
                   {[1,2,3].map(i => (
                     <motion.div key={i} animate={{ height: [8, 20, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-1 bg-red-500 rounded-full" />
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
