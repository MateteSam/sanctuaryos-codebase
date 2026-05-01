'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Mic2, Settings2, Power, Waves, Brain, X, Wand2, Plus, Volume2 } from 'lucide-react';
import type { AudioChannel, AudioBus, ChannelEQ, AudioPresetId } from '@/lib/useAudioEngine';
import { DAWFader, PanKnob, VUBars, MSButton, CHAN_COLORS } from './daw-ui';
import { RotaryKnob, CompMeter } from './daw-knobs';
import { SONUS_PRESETS, PRESET_CATEGORIES } from '@/lib/audioPresets';

// ============================================================================
// SVG EQ Curve Visualization
// ============================================================================
function EQCurveView({ eq, color = '#38bdf8' }: { eq: ChannelEQ, color?: string }) {
  // Map dB (-12 to +12) to Y coordinate (80 to 0, mid is 40)
  const toY = (db: number) => 40 - (db * (40 / 12));
  
  const y1 = toY(eq.low);
  const y2 = toY(eq.lowMid);
  const y3 = toY(eq.highMid);
  const y4 = toY(eq.high);

  // x positions (log-ish spacing for visual)
  const x0 = 0, x1 = 40, x2 = 120, x3 = 200, x4 = 280, x5 = 320;

  const path = `M ${x0} ${y1} C 20 ${y1}, 30 ${y1}, ${x1} ${y1} C 70 ${y1}, 90 ${y2}, ${x2} ${y2} C 150 ${y2}, 170 ${y3}, ${x3} ${y3} C 230 ${y3}, 260 ${y4}, ${x4} ${y4} C 300 ${y4}, 310 ${y4}, ${x5} ${y4}`;

  return (
    <div className="relative w-full h-20 bg-black/40 rounded-lg border border-white/10 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
        {[...Array(16)].map((_, i) => (
           <div key={i} className="border-r border-b border-white" />
        ))}
      </div>
      
      {/* Ghost Curve (AI baseline) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 320 80" preserveAspectRatio="none">
        <path d="M 0 40 L 320 40" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      </svg>
      
      {/* Actual Curve */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 80" preserveAspectRatio="none">
        {/* Fill under curve */}
        <path d={`${path} L 320 80 L 0 80 Z`} fill={`url(#eqGrad)`} opacity={0.3} />
        {/* Stroke */}
        <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Dots */}
      <div className="absolute" style={{ left: '12.5%', top: y1, transform: 'translate(-50%, -50%)' }}><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /></div>
      <div className="absolute" style={{ left: '37.5%', top: y2, transform: 'translate(-50%, -50%)' }}><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /></div>
      <div className="absolute" style={{ left: '62.5%', top: y3, transform: 'translate(-50%, -50%)' }}><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" /></div>
      <div className="absolute" style={{ left: '87.5%', top: y4, transform: 'translate(-50%, -50%)' }}><div className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" /></div>
    </div>
  );
}

// ============================================================================
// SonusProWorkspace Main Component
// ============================================================================

export interface SonusProWorkspaceProps {
  channels: AudioChannel[];
  channelLevels: Record<string, number>;
  clipping: Record<string, boolean>;
  peakHold: Record<string, number>;
  buses: AudioBus[];
  busLevels: Record<string, number>;
  autoMix: boolean; setAutoMix: (v: boolean) => void;
  autoDuck: boolean; setAutoDuck: (v: boolean) => void;
  compGainReduction: Record<string, number>;
  audioContextState: string;
  broadcastStream: MediaStream | null;
  
  setChannelVolume: (id: string, vol: number) => void;
  toggleChannelMute: (id: string) => void;
  toggleChannelSolo: (id: string) => void;
  setChannelSend: (id: string, busId: string, vol: number) => void;
  setPreAmpGain: (id: string, db: number) => void;
  setChannelEQ: (id: string, eq: Partial<ChannelEQ>) => void;
  setHPFFreq: (id: string, freq: number) => void;
  toggleGate: (id: string) => void;
  toggleComp: (id: string) => void;
  setBusMasterLevel: (id: string, level: number) => void;
  toggleBusMute: (id: string) => void;
  applyChannelPreset: (id: string, presetId: AudioPresetId) => void;
  addVirtualChannel: (label: string, url: string) => void;
  onClose: () => void;
}

export function SonusProWorkspace({
  channels, channelLevels, clipping, peakHold, buses, busLevels,
  autoMix, setAutoMix, autoDuck, setAutoDuck, compGainReduction,
  setChannelVolume, toggleChannelMute, toggleChannelSolo,
  setChannelSend, setPreAmpGain, setChannelEQ, setHPFFreq, toggleGate, toggleComp,
  setBusMasterLevel, toggleBusMute, applyChannelPreset, addVirtualChannel, onClose
}: SonusProWorkspaceProps) {
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<string>('SOUNDCHECK');
  const [aiChat, setAiChat] = useState('');
  
  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const fohBus = buses.find(b => b.id === 'foh');
  
  const handleAiCommand = () => {
    if (!aiChat.trim()) return;
    const cmd = aiChat.toLowerCase();
    if (cmd.includes('sermon')) {
      setActiveScene('SERMON');
      channels.forEach(ch => {
        if (ch.label.toLowerCase().includes('mic') || ch.isPastorMic) applyChannelPreset(ch.id, 'spoken_word');
      });
      setAutoDuck(true);
    } else if (cmd.includes('worship')) {
      setActiveScene('WORSHIP');
      channels.forEach(ch => {
        if (ch.label.toLowerCase().includes('vox')) applyChannelPreset(ch.id, 'worship_leader');
        if (ch.label.toLowerCase().includes('gtr') || ch.label.toLowerCase().includes('guitar')) applyChannelPreset(ch.id, 'acoustic');
      });
      setAutoDuck(false);
    }
    setAiChat('');
  };

  return (
    <div className="w-full h-full bg-[#0a0a0c] flex flex-col font-outfit text-slate-300">
      
      {/* ── TOP CONTROL BAR ── */}
      <div className="h-14 bg-[#121214] border-b border-white/[0.04] flex items-center justify-between px-6 shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
               <SlidersHorizontal className="w-4 h-4 text-sky-400" />
             </div>
             <div className="flex flex-col">
               <span className="text-[12px] font-black tracking-widest text-white uppercase leading-none">SONUS PRO</span>
               <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest mt-1">Unified Mix Engine</span>
             </div>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          {/* AI Tools */}
          <div className="flex gap-2">
             <button onClick={() => setAutoMix(!autoMix)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${autoMix ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
               AI MIX
             </button>
             <button onClick={() => setAutoDuck(!autoDuck)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${autoDuck ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
               AI DUCK
             </button>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          {/* Scenes */}
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/[0.05]">
             {['SOUNDCHECK', 'WORSHIP', 'SERMON', 'ALTAR'].map(s => (
               <button key={s} onClick={() => setActiveScene(s)} className={`px-4 py-1.5 rounded-md text-[9px] font-black tracking-widest transition-all ${activeScene === s ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 {s}
               </button>
             ))}
          </div>
        </div>
        
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── WORKSPACE AREA ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT: MIXER SURFACE */}
        <div className="flex-1 overflow-x-auto flex bg-[#0e0e11]">
          {/* Channel Strips */}
          <div className="flex p-4 gap-2">
             {channels.length === 0 && (
                <div className="w-[800px] h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                   <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                      <Waves className="w-8 h-8 text-sky-400" />
                   </div>
                   <h2 className="text-2xl font-black tracking-widest text-white mb-2 uppercase">Welcome to Sonus Pro</h2>
                   <p className="text-slate-400 text-sm mb-8 max-w-md text-center">Your unified, AI-driven mixing environment. No hardware inputs detected.</p>
                   <button 
                     onClick={() => {
                        addVirtualChannel('Lead Vox', 'https://raw.githubusercontent.com/mdn/webaudio-examples/master/audio-analyser/viper.mp3');
                        addVirtualChannel('Backing Vox', '');
                        addVirtualChannel('Acoustic Gtr', '');
                        addVirtualChannel('Bass Guitar', '');
                        addVirtualChannel('Nord Stage', '');
                        addVirtualChannel('Pastor Mic', '');
                     }}
                     className="px-8 py-3 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-sky-400 hover:text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all"
                   >
                     Load Demo Band
                   </button>
                </div>
             )}
             {channels.map((ch, idx) => {
               const color = CHAN_COLORS[idx % CHAN_COLORS.length];
               const isSelected = selectedChannelId === ch.id;
               const level = channelLevels[ch.id] || 0;
               const peak = peakHold[ch.id] || 0;
               const gr = compGainReduction[ch.id] || 0;
               
               return (
                 <div key={ch.id} 
                   onClick={() => setSelectedChannelId(ch.id)}
                   className={`w-[110px] shrink-0 flex flex-col bg-[#1e1e22] rounded-xl border transition-all cursor-pointer overflow-hidden ${isSelected ? 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-white/[0.04] hover:border-white/10'}`}>
                   
                   {/* Strip Header */}
                   <div className="p-2 border-b border-white/[0.04] flex flex-col gap-1 items-center bg-black/20">
                      <span className="text-[10px] font-black tracking-widest uppercase truncate w-full text-center" style={{ color: isSelected ? '#fff' : color }}>
                        {ch.label}
                      </span>
                      {ch.presetId && (
                        <span className="text-[7px] font-bold text-slate-500 uppercase truncate">
                          {SONUS_PRESETS.find(p => p.id === ch.presetId)?.name || 'Custom'}
                        </span>
                      )}
                   </div>
                   
                   {/* Mini DSP Inline */}
                   <div className="px-2 py-3 border-b border-white/[0.04] flex flex-col gap-3">
                      {/* Mini EQ */}
                      <div className="h-10 w-full bg-black/40 rounded-md border border-white/5 relative overflow-hidden flex items-center justify-center">
                        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-50">
                          <path d={`M 0 ${20 - ch.eq.low} Q 25 ${20 - ch.eq.lowMid} 50 ${20 - ch.eq.highMid} T 100 ${20 - ch.eq.high}`} fill="none" stroke={color} strokeWidth="2" />
                        </svg>
                      </div>
                      
                      <div className="flex justify-between px-1">
                         {/* GR Meter */}
                         <div className="flex flex-col items-center gap-1">
                           <span className="text-[6px] font-mono text-amber-500/50">GR</span>
                           <CompMeter reduction={gr} height={30} />
                         </div>
                         {/* Gate LED */}
                         <div className="flex flex-col items-center gap-1">
                           <span className="text-[6px] font-mono text-emerald-500/50">GT</span>
                           <div className={`w-2.5 h-2.5 rounded-full transition-all ${ch.gateEnabled ? (level > 0.03 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-900') : 'bg-black/50'}`} />
                         </div>
                         {/* HPF */}
                         <div className="flex flex-col items-center gap-1">
                           <span className="text-[6px] font-mono text-sky-500/50">HP</span>
                           <div className={`w-2.5 h-2.5 rounded-full ${ch.hpfFreq > 40 ? 'bg-sky-400' : 'bg-black/50'}`} />
                         </div>
                      </div>
                   </div>

                   {/* Pan */}
                   <div className="py-3 flex justify-center border-b border-white/[0.04]">
                     <PanKnob value={ch.pan || 0} onChange={() => {}} />
                   </div>
                   
                   {/* Fader & Meters */}
                   <div className="flex-1 flex p-2 gap-3 justify-center min-h-[180px]">
                      <DAWFader value={ch.volume} min={0} max={1.5} color={color} height={180} onChange={v => setChannelVolume(ch.id, v)} />
                      <VUBars level={level} peakHold={peak} color={color} height={180} />
                   </div>
                   
                   {/* Mutes & Solos */}
                   <div className="p-2 flex gap-1 bg-black/20">
                     <MSButton label="M" active={ch.muted} activeColor="#ef4444" onClick={(e) => { e.stopPropagation(); toggleChannelMute(ch.id); }} />
                     <MSButton label="S" active={ch.soloed} activeColor="#f59e0b" onClick={(e) => { e.stopPropagation(); toggleChannelSolo(ch.id); }} />
                   </div>
                   
                 </div>
               );
             })}
          </div>
          
          {/* FOH MASTER STRIP */}
          {fohBus && (
            <div className="p-4 border-l border-white/[0.04] bg-[#121214]">
               <div className="w-[120px] h-full flex flex-col bg-[#1e1e22] rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                 <div className="p-3 border-b border-white/[0.04] flex flex-col gap-1 items-center bg-black/40">
                    <span className="text-[12px] font-black tracking-widest uppercase text-white">MAIN FOH</span>
                 </div>
                 
                 <div className="flex-1 flex p-4 gap-4 justify-center">
                    <DAWFader value={fohBus.masterLevel} min={0} max={1.5} color="#ffffff" height={300} onChange={v => setBusMasterLevel(fohBus.id, v)} />
                    <VUBars level={busLevels[fohBus.id] || 0} peakHold={0} color="#38bdf8" height={300} />
                 </div>
                 
                 <div className="p-3 bg-black/40">
                   <MSButton label="MUTE" active={fohBus.muted} activeColor="#ef4444" onClick={() => toggleBusMute(fohBus.id)} />
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* RIGHT: CHANNEL INSPECTOR DRAWER */}
        <AnimatePresence>
          {selectedChannel && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-white/[0.04] bg-[#161619] shrink-0 overflow-y-auto panel-scroll flex flex-col">
              
              <div className="p-4 flex items-center justify-between border-b border-white/[0.04] bg-[#1e1e22] sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center border border-white/10">
                     <Mic2 className="w-4 h-4 text-white" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[12px] font-black tracking-widest uppercase text-white">{selectedChannel.label}</span>
                     <span className="text-[8px] font-bold text-slate-500 uppercase">Channel Inspector</span>
                   </div>
                </div>
                <button onClick={() => setSelectedChannelId(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-6">
                 
                 {/* PREAMP & HPF */}
                 <div className="p-4 rounded-xl bg-[#1a1a1e] border border-white/[0.04] shadow-inner flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Input Stage</span>
                      <span className="text-[10px] text-white">PreAmp & Filter</span>
                    </div>
                    <div className="flex gap-4">
                       <RotaryKnob value={selectedChannel.preAmpGain} min={-12} max={24} step={1} label="GAIN" unit="dB" color="#f59e0b" onChange={v => setPreAmpGain(selectedChannel.id, v)} />
                       <RotaryKnob value={selectedChannel.hpfFreq} min={20} max={400} step={5} label="HPF" unit="Hz" color="#38bdf8" onChange={v => setHPFFreq(selectedChannel.id, v)} />
                    </div>
                 </div>

                 {/* 4-BAND EQ */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <Waves className="w-3.5 h-3.5 text-sky-400" />
                        Parametric EQ
                      </span>
                    </div>
                    
                    <EQCurveView eq={selectedChannel.eq} color="#38bdf8" />
                    
                    <div className="p-4 rounded-xl bg-[#1a1a1e] border border-white/[0.04] flex justify-between">
                       <RotaryKnob value={selectedChannel.eq.low} min={-12} max={12} label="LOW" unit="dB" color="#fbbf24" onChange={v => setChannelEQ(selectedChannel.id, { low: v })} />
                       <RotaryKnob value={selectedChannel.eq.lowMid} min={-12} max={12} label="L-MID" unit="dB" color="#34d399" onChange={v => setChannelEQ(selectedChannel.id, { lowMid: v })} />
                       <RotaryKnob value={selectedChannel.eq.highMid} min={-12} max={12} label="H-MID" unit="dB" color="#22d3ee" onChange={v => setChannelEQ(selectedChannel.id, { highMid: v })} />
                       <RotaryKnob value={selectedChannel.eq.high} min={-12} max={12} label="HIGH" unit="dB" color="#ec4899" onChange={v => setChannelEQ(selectedChannel.id, { high: v })} />
                    </div>
                 </div>
                 
                 {/* DYNAMICS: COMPRESSOR */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                        Dynamics
                      </span>
                      <button onClick={() => toggleComp(selectedChannel.id)} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedChannel.compEnabled ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-slate-500'}`}>
                        {selectedChannel.compEnabled ? 'ON' : 'BYPASS'}
                      </button>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-[#1a1a1e] border border-white/[0.04] flex justify-between items-center opacity-100 transition-opacity" style={{ opacity: selectedChannel.compEnabled ? 1 : 0.5 }}>
                       <RotaryKnob value={selectedChannel.compEnabled ? -18 : 0} min={-40} max={0} label="THRESH" unit="dB" color="#818cf8" onChange={() => {}} />
                       <RotaryKnob value={selectedChannel.compEnabled ? 4 : 1} min={1} max={20} label="RATIO" unit=":1" color="#818cf8" onChange={() => {}} />
                       
                       <div className="w-px h-10 bg-white/10" />
                       
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-[8px] font-black uppercase text-slate-500">GR</span>
                         <div className="h-10 px-2 flex items-center justify-center bg-black/40 rounded-lg border border-white/5">
                           <CompMeter reduction={compGainReduction[selectedChannel.id] || 0} height={30} color="#f59e0b" />
                         </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* PRESETS */}
                 <div className="space-y-3">
                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                      Magic Presets
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {SONUS_PRESETS.filter(p => p.category === 'vocals' || p.category === 'instruments').slice(0,4).map(p => (
                        <button key={p.id} onClick={() => applyChannelPreset(selectedChannel.id, p.id as any)} className="p-2 rounded-lg bg-[#1a1a1e] border border-white/5 hover:border-pink-500/30 hover:bg-pink-500/10 text-left transition-all flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-white">{p.name}</span>
                          <span className="text-[7px] font-mono text-slate-500 truncate">{p.description}</span>
                        </button>
                      ))}
                    </div>
                 </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>

      {/* ── BOTTOM INTELLIGENCE BAR ── */}
      <div className="h-12 bg-[#050508] border-t border-white/[0.04] shrink-0 flex items-center justify-between px-6 z-10">
         
         {/* LUFS / Broadcast Status */}
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-300">BROADCAST</span>
            </div>
            <div className="w-48 h-5 bg-black/60 rounded border border-white/10 relative overflow-hidden flex items-center px-2">
              <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/50 w-[70%]" />
              <div className="absolute left-[80%] top-0 bottom-0 w-px bg-white/50" />
              <span className="relative z-10 text-[9px] font-mono font-bold text-white tracking-widest">-14.2 LUFS</span>
            </div>
         </div>
         
         {/* AI Chat Strip */}
         <div className="flex-1 max-w-xl mx-8 flex items-center">
            <div className="w-full h-8 bg-white/5 rounded-full border border-white/10 px-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-sky-500/50 transition-all">
               <Brain className="w-4 h-4 text-sky-400" />
               <input 
                 value={aiChat} onChange={e => setAiChat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiCommand()}
                 placeholder="Tell SONUS what to do... (e.g., 'Switch to sermon mode')" 
                 className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-white placeholder-slate-500"
               />
            </div>
         </div>
         
         {/* Room Data */}
         <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <span className="text-[8px] font-black uppercase text-slate-500">RT60 / Room</span>
               <span className="text-[10px] font-mono font-bold text-sky-400">0.6s / Medium</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <span className="text-[9px] font-black tracking-widest text-slate-700">SONUS PRO v3.0</span>
         </div>
         
      </div>

    </div>
  );
}
