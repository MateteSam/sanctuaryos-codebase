'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { atmospherePresets, type AtmospherePreset, VIDEO_ATMOS_PRESETS } from '@/data/atmospheres';

interface Props {
  activeAtmos: AtmospherePreset;
  customAtmoses: AtmospherePreset[];
  onSelectAtmosphere: (p: AtmospherePreset) => void;
  atmosVideoUrl: string | undefined;
  onSetVideoUrl: (url: string | undefined) => void;
  customAtmosName: string;
  setCustomAtmosName: (v: string) => void;
  editingAtmos: boolean;
  onToggleEditing: () => void;
  onSaveCustomAtmos: () => void;
}

export function AtmosTab({
  activeAtmos, customAtmoses, onSelectAtmosphere, atmosVideoUrl, onSetVideoUrl,
  customAtmosName, setCustomAtmosName, editingAtmos, onToggleEditing, onSaveCustomAtmos,
}: Props) {
  const allAtmos = [...atmospherePresets, ...customAtmoses];
  const [customVideoInput, setCustomVideoInput] = useState('');

  return (
    <div className="flex-1 overflow-y-auto panel-scroll p-3 space-y-3">
      {/* New atmosphere CTA */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Atmosphere Presets</p>
        <button onClick={onToggleEditing}
          className="flex items-center gap-1 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition">
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {/* New atmosphere form */}
      <AnimatePresence>
        {editingAtmos && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <p className="text-[9px] text-slate-600">Current settings will be saved as a new preset.</p>
              <input value={customAtmosName} onChange={e => setCustomAtmosName(e.target.value)} placeholder="Atmosphere name…"
                className="w-full bg-slate-950 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 outline-none focus:border-sky-500/50 transition" />
              <button onClick={onSaveCustomAtmos} disabled={!customAtmosName.trim()}
                className="w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-30 transition flex items-center justify-center gap-2"
                style={{ background: activeAtmos.accentColor, color: '#0a0f1a' }}>
                <Check className="w-3.5 h-3.5" /> Save Atmosphere
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presets */}
      <div className="space-y-1.5">
        {allAtmos.map(preset => {
          const isActive = preset.id === activeAtmos.id;
          return (
            <motion.button key={preset.id} onClick={() => onSelectAtmosphere(preset)} whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${isActive ? 'border-white/25' : 'border-white/[0.05] hover:border-white/12'}`}
              style={isActive ? { background: `${preset.accentColor}12`, borderColor: `${preset.accentColor}45` } : {}}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.gradient} flex items-center justify-center shrink-0 border border-white/[0.07]`}>
                  <div className="w-3 h-3 rounded-full" style={{ background: preset.accentColor, boxShadow: `0 0 6px ${preset.accentColor}70` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{preset.name}</p>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: preset.accentColor }} />}
                  </div>
                  <p className="text-[9px] text-slate-600 truncate">{preset.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] font-bold uppercase text-slate-700">{preset.category}</span>
                    <span className="text-[7px] text-slate-700">· {preset.activeMediaOverlays.length} overlays</span>
                  </div>
                </div>
                <div className="w-3 h-3 rounded shrink-0" style={{ background: preset.accentColor }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Video ATMOS */}
      <div className="rounded-xl border border-white/10 bg-white/[0.015] p-3 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Video ATMOS Background</p>
        <p className="text-[8px] text-slate-600">Loop a cinematic video on the Beam output.</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => onSetVideoUrl(undefined)}
            className={`p-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition ${
              !atmosVideoUrl ? 'border-white/25 text-white bg-white/10' : 'border-white/[0.05] text-slate-600 hover:text-white'
            }`}>None</button>
          {VIDEO_ATMOS_PRESETS.map(v => (
            <button key={v.id} onClick={() => onSetVideoUrl(v.url)}
              className={`relative p-2 rounded-lg border text-left overflow-hidden transition ${
                atmosVideoUrl === v.url ? 'border-white/35 ring-1 ring-white/15' : 'border-white/[0.05] hover:border-white/15'
              }`}>
              <img src={v.thumbnail} alt={v.label} className="absolute inset-0 w-full h-full object-cover opacity-35" />
              <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-white">{v.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customVideoInput} onChange={e => setCustomVideoInput(e.target.value)}
            placeholder="Custom video URL (.mp4, .webm)…"
            className="flex-1 bg-slate-950 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[10px] text-white placeholder-slate-700 outline-none focus:border-sky-500/50" />
          <button onClick={() => { if (customVideoInput.trim()) { onSetVideoUrl(customVideoInput.trim()); setCustomVideoInput(''); } }}
            disabled={!customVideoInput.trim()}
            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider disabled:opacity-30 transition"
            style={{ background: activeAtmos.accentColor, color: '#0a0e1a' }}>Set</button>
        </div>
      </div>
    </div>
  );
}
