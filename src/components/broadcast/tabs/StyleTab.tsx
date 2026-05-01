'use client';

import { motion } from 'framer-motion';
import { Move, AlignLeft, Radio, Clock, Share2, Shield, X, Zap, Sliders, Palette, Layers, Wand2, Sun, Star, CloudFog, Sparkles, Plus, Wind, Film, Square, Snowflake, Flower } from 'lucide-react';
import { textPositions, textStylePresets, fontSizes, mediaOverlays } from '@/data/overlays';
import { overlayGraphics } from '@/data/cameras';
import { type AtmospherePreset } from '@/data/atmospheres';

const overlayIconMap: Record<string, React.ElementType> = { AlignLeft, Radio, Clock, Share2, Shield, X, Zap };
const mediaIconMap: Record<string, React.ElementType> = { Sun, Star, CloudFog, Sparkles, Plus, Wind, Zap, Palette, Film, Square, Snowflake, Flower };

interface Props {
  activeAtmos: AtmospherePreset;
  textPosition: string;
  onPositionChange: (v: string) => void;
  textStylePreset: string;
  onPresetChange: (v: string) => void;
  textFontSize: string;
  onFontSizeChange: (v: string) => void;
  textFontFamily: 'sans' | 'scripture';
  onFamilyChange: (v: 'sans' | 'scripture') => void;
  useMedia: boolean;
  onToggleMedia: () => void;
  showBranding: boolean;
  onToggleBranding: () => void;
  layoutStyle: 'full_center' | 'lower_third' | 'modern_serif';
  onLayoutChange: (v: 'full_center' | 'lower_third' | 'modern_serif') => void;
  activeMediaOverlays: string[];
  onToggleOverlay: (id: string) => void;
  overlayOpacities: Record<string, number>;
  onOpacityChange: (id: string, v: number) => void;
  overlayBlends: Record<string, string>;
  onBlendChange: (id: string, v: string) => void;
  activeOverlay: string | null;
  onToggleGraphic: (id: string) => void;
  lowerThirdText: string;
  setLowerThirdText: (v: string) => void;
  lowerThirdSub: string;
  setLowerThirdSub: (v: string) => void;
  lowerThirdStyle: string;
  setLowerThirdStyle: (v: string) => void;
  lowerThirdColor: string;
  setLowerThirdColor: (v: string) => void;
  onPushLowerThird: () => void;
}

function PositionGrid({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 aspect-video rounded-2xl overflow-hidden glass-panel p-3">
      {textPositions.map(z => (
        <button key={z.id} onClick={() => onChange(z.id)} title={z.label}
          className={`relative flex items-center justify-center rounded-xl transition-all duration-300 ${
            value === z.id ? 'bg-sky-500/20 ring-1 ring-sky-500/50' : 'bg-black/20 hover:bg-white/5 border border-white/5'
          }`}>
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${value === z.id ? 'bg-sky-400 scale-150 shadow-[0_0_10px_#38bdf8]' : 'bg-white/10'}`} />
          {value === z.id && (
            <motion.div layoutId="pos-grid" className="absolute inset-0 border border-sky-400/40 rounded-xl" />
          )}
        </button>
      ))}
    </div>
  );
}

export function StyleTab({
  activeAtmos, textPosition, onPositionChange, textStylePreset, onPresetChange,
  textFontSize, onFontSizeChange, textFontFamily, onFamilyChange,
  useMedia, onToggleMedia, showBranding, onToggleBranding, layoutStyle, onLayoutChange,
  activeMediaOverlays, onToggleOverlay, overlayOpacities, onOpacityChange, overlayBlends, onBlendChange,
  activeOverlay, onToggleGraphic,
  lowerThirdText, setLowerThirdText, lowerThirdSub, setLowerThirdSub,
  lowerThirdStyle, setLowerThirdStyle, lowerThirdColor, setLowerThirdColor, onPushLowerThird,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto panel-scroll p-6 space-y-8 font-outfit">

      {/* ── LOWER THIRDS ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-sky-500 rounded-full" />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Lower Thirds</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 space-y-5">
           <div className="space-y-3">
              <input value={lowerThirdText} onChange={e => setLowerThirdText(e.target.value)} placeholder="PRIMARY IDENTIFIER..."
                className="pro-input w-full uppercase font-black tracking-widest" />
              <input value={lowerThirdSub} onChange={e => setLowerThirdSub(e.target.value)} placeholder="SUBTITLE / ROLE / SOCIALS..."
                className="pro-input w-full text-xs text-slate-400 uppercase font-bold tracking-wider" />
           </div>

           <div className="grid grid-cols-3 gap-2">
              {(['classic', 'cinematic', 'pill', 'gradient', 'minimal', 'bold_left'] as const).map(s => (
                <button key={s} onClick={() => setLowerThirdStyle(s)}
                  className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${lowerThirdStyle === s ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-600 hover:text-slate-400'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-white/5" />
              <input type="color" value={lowerThirdColor} onChange={e => setLowerThirdColor(e.target.value)}
                className="w-10 h-10 rounded-full border-2 border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden" />
              <div className="flex-1 h-[1px] bg-white/5" />
           </div>

           <motion.button whileTap={{ scale: 0.98 }} onClick={onPushLowerThird}
             className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg"
             style={{ background: activeAtmos.accentColor, color: '#000' }}>
             PUSH LIVEmaster
           </motion.button>
        </div>
      </section>

      {/* ── TEXT COMPOSITION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-emerald-500 rounded-full" />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Composition</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Move className="w-3 h-3" /> Position</p>
              <PositionGrid value={textPosition} onChange={onPositionChange} />
           </div>
           <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Palette className="w-3 h-3" /> Visual Style</p>
              <div className="grid grid-cols-1 gap-2">
                {textStylePresets.map(p => (
                  <button key={p.id} onClick={() => onPresetChange(p.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${textStylePreset === p.id ? 'border-white/30 bg-white/5' : 'border-white/5 bg-black/20 hover:border-white/15'}`}>
                    <span className={`relative z-10 text-xs font-black tracking-widest ${p.textColor}`}>{p.label}</span>
                    {textStylePreset === p.id && <motion.div layoutId="active-style" className="absolute inset-0 bg-white/5" />}
                  </button>
                ))}
              </div>
           </div>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
           {fontSizes.map(f => (
             <button key={f.id} onClick={() => onFontSizeChange(f.id)}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${textFontSize === f.id ? 'bg-white text-black shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}>
               {f.label}
             </button>
           ))}
        </div>
      </section>

      {/* ── FX & OVERLAYS ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-purple-500 rounded-full" />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Atmospherics</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
           {overlayGraphics.map(g => {
             const Icon = overlayIconMap[g.icon] || Zap;
             const isOn = activeOverlay === g.id;
             return (
               <button key={g.id} onClick={() => onToggleGraphic(g.id)}
                 className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                   isOn ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 
                   g.id === 'bug_off' ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 
                   'bg-black/20 border-white/5 text-slate-600 hover:border-white/10 hover:text-white'
                 }`}>
                 <Icon className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span>
               </button>
             );
           })}
        </div>

        <div className="space-y-2">
          {mediaOverlays.map(ov => {
            const isOn = activeMediaOverlays.includes(ov.id);
            const opacity = overlayOpacities[ov.id] ?? ov.opacity;
            return (
              <div key={ov.id} className={`glass-panel rounded-2xl p-4 transition-all ${isOn ? 'ring-1 ring-sky-500/40' : ''}`}>
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       {ov.icon && mediaIconMap[ov.icon] ? (
                          (() => { const Icon = mediaIconMap[ov.icon]; return <Icon className="w-5 h-5 text-sky-400" />; })()
                       ) : (
                          <span className="text-xl">{ov.icon}</span>
                       )}
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isOn ? 'text-white' : 'text-slate-500'}`}>{ov.label}</span>
                          <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">{ov.category}</span>
                       </div>
                    </div>
                    <button onClick={() => onToggleOverlay(ov.id)}
                      className={`w-10 h-6 rounded-full relative transition-all ${isOn ? 'bg-sky-500' : 'bg-white/10'}`}>
                       <motion.div animate={{ x: isOn ? 18 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg" />
                    </button>
                 </div>
                 {isOn && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-4">
                         <Sliders className="w-3.5 h-3.5 text-slate-500" />
                         <input type="range" min="0" max="100" value={opacity} onChange={e => onOpacityChange(ov.id, +e.target.value)} />
                         <span className="w-10 text-right text-[10px] font-mono text-slate-500">{opacity}%</span>
                      </div>
                   </motion.div>
                 )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
