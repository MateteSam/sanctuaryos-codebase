'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Plus, Camera, Globe, Laptop, Monitor, Activity, Settings2, Film, Mic, Volume2, RectangleVertical } from 'lucide-react';
import { type ManagedCamera } from '@/lib/useCameraManager';
import { GENESIS_PRESETS } from '@/lib/GenesisEngine';
import { useState, useRef, useEffect } from 'react';

function VideoPreview({ stream, isPortrait }: { stream?: MediaStream; isPortrait?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  if (!stream) return null;
  return <video ref={ref} autoPlay playsInline muted className={`w-full h-full ${isPortrait ? 'object-contain' : 'object-cover'}`} />;
}

const playHoverTick = () => {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch(e) {}
};

interface Props {
  cameras: ManagedCamera[];
  programCamId: string | null;
  previewCamId: string | null;
  channelLevels: Record<string, number>;
  isCinematicMode: boolean;
  setIsCinematicMode: (v: boolean) => void;
  genesisPreset: string;
  setGenesisPreset: (v: string) => void;
  onSelectCamera: (id: string) => void;
  onOpenSettings: () => void;
  isLoadingDevices: boolean;
}

const cameraIconMap: Record<string, any> = {
  'phone': Smartphone,
  'local': Camera,
  'ndi': Globe,
  'rtc': Smartphone,
};

const cameraTypeLabel: Record<string, string> = {
  'phone': 'PHONE',
  'local': 'USB',
  'ndi': 'NDI',
  'rtc': 'WebRTC',
};

/* ── Vertical VU Meter ── */
function VUMeter({ level, segments = 12 }: { level: number; segments?: number }) {
  const activeSegments = Math.round(level * segments);
  return (
    <div className="flex flex-col-reverse gap-[1px] w-3">
      {Array.from({ length: segments }, (_, i) => {
        const isActive = i < activeSegments;
        const isRed = i >= segments * 0.85;
        const isYellow = i >= segments * 0.65;
        return (
          <div
            key={i}
            className="w-full h-[3px] rounded-[0.5px] transition-all duration-75"
            style={{
              background: isActive
                ? isRed ? '#ef4444' : isYellow ? '#fbbf24' : '#22c55e'
                : 'rgba(255,255,255,0.04)',
              boxShadow: isActive
                ? isRed ? '0 0 4px rgba(239,68,68,0.5)' : isYellow ? '0 0 3px rgba(251,191,36,0.3)' : '0 0 3px rgba(34,197,94,0.2)'
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Stereo VU Meter (wider, for featured tiles) ── */
function StereoVU({ level }: { level: number }) {
  const l = Math.max(0, Math.min(1, level * 1.1 + (Math.random() * 0.05 - 0.025)));
  const r = Math.max(0, Math.min(1, level * 0.95 + (Math.random() * 0.05 - 0.025)));
  return (
    <div className="flex gap-[2px]">
      <VUMeter level={l} segments={16} />
      <VUMeter level={r} segments={16} />
    </div>
  );
}

export function SourceBank({
  cameras, programCamId, previewCamId, channelLevels, isCinematicMode, setIsCinematicMode, genesisPreset, setGenesisPreset, onSelectCamera, onOpenSettings, isLoadingDevices
}: Props) {

  const presetKeys = Object.keys(GENESIS_PRESETS);
  const cyclePreset = () => {
    const idx = presetKeys.indexOf(genesisPreset);
    const next = presetKeys[(idx + 1) % presetKeys.length];
    setGenesisPreset(next);
  };
  const activePresetLabel = GENESIS_PRESETS[genesisPreset]?.label || (genesisPreset === 'custom' ? 'Custom' : 'Raw');

  // Simulate animated levels for connected cameras
  const [animLevels, setAnimLevels] = useState<Record<string, number>>({});
  useEffect(() => {
    const id = setInterval(() => {
      const levels: Record<string, number> = {};
      cameras.forEach(cam => {
        const base = channelLevels[cam.id] || 0;
        // Add subtle animation if there's a real level, or simulate for demo
        if (base > 0) {
          levels[cam.id] = Math.max(0, Math.min(1, base + (Math.random() * 0.1 - 0.05)));
        } else if (cam.stream) {
          levels[cam.id] = 0.3 + Math.random() * 0.4; // Demo signal
        } else {
          levels[cam.id] = 0;
        }
      });
      setAnimLevels(levels);
    }, 120);
    return () => clearInterval(id);
  }, [cameras, channelLevels]);
  
  return (
    <div className="flex flex-col gap-3 p-4 hardware-panel rounded-2xl w-full h-full font-outfit">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="pro-label">Input Multiview</span>
          <span className="text-[8px] font-mono text-slate-700 ml-1">{cameras.length} SRC</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-mono font-bold text-emerald-500/60 uppercase">System Ready</span>
           </div>
           <button onClick={cyclePreset} title={`Genesis II: ${activePresetLabel}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${genesisPreset !== 'off' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-700 hover:text-white hover:bg-white/5'}`}>
              <Film className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">{activePresetLabel}</span>
            </button>
           <button onClick={onOpenSettings} title="Open Camera Settings" className="p-1.5 rounded-lg text-slate-700 hover:text-white hover:bg-white/5 transition-colors">
             <Settings2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      {/* ── GRID — fills all available space ── */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll pr-1">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        
          {/* ADD SOURCE TILE */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            onMouseEnter={playHoverTick}
            className="aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.03] hover:border-sky-500/30 transition-all group min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-sky-500/10 transition-all">
              <Plus className="w-5 h-5 text-slate-600 group-hover:text-sky-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-sky-500">Add Source</span>
          </motion.button>

          {/* CAMERA TILES */}
          {cameras.map((cam, idx) => {
            const isProgram = cam.id === programCamId;
            const isPreview = cam.id === previewCamId;
            const Icon = cameraIconMap[cam.type] || Camera;
            const typeLabel = cameraTypeLabel[cam.type] || cam.type.toUpperCase();
            const level = animLevels[cam.id] || 0;
            const dbValue = level > 0 ? Math.round(-60 + level * 60) : -Infinity;
            const dbLabel = dbValue > -60 ? `${dbValue}dB` : '-∞';
            
            const isPortrait = cam.orientation === 'portrait';
            
            return (
              <motion.button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                onMouseEnter={playHoverTick}
                whileTap={{ scale: 0.96 }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 group min-h-[120px] ${
                  isProgram ? 'border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 
                  isPreview ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 
                  'border-white/[0.06] bg-black/40 hover:border-white/20'
                }`}
                style={{ aspectRatio: isPortrait ? '9/16' : '16/9' }}
              >
                {/* Thumbnail / Placeholder */}
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                   {cam.stream ? (
                     <VideoPreview stream={cam.stream} isPortrait={isPortrait} />
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                       <Icon className={`w-10 h-10 transition-colors ${isProgram ? 'text-red-500/15' : isPreview ? 'text-green-500/15' : 'text-white/[0.04]'}`} />
                       {isPortrait && <RectangleVertical className="w-4 h-4 text-amber-500/20" />}
                     </div>
                   )}
                </div>

                {/* ── TOP BAR: Label + Tally ── */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10">
                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 border border-white/[0.08] max-w-[65%]">
                    <span className="text-[9px] font-mono font-bold text-white/40 shrink-0">{idx + 1}</span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[9px] font-black uppercase tracking-tight text-white/80 truncate">{cam.label}</span>
                  </div>
                  
                  {/* Tally Light */}
                  {isProgram && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white tally-live" />
                      <span className="text-[7px] font-black text-white tracking-widest">PGM</span>
                    </div>
                  )}
                  {isPreview && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-600/80 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span className="text-[7px] font-black text-white tracking-widest">PVW</span>
                    </div>
                  )}
                  {isPortrait && !isProgram && !isPreview && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                      <RectangleVertical className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-[6px] font-black text-amber-400 tracking-widest">9:16</span>
                    </div>
                  )}
                </div>

                {/* ── RIGHT EDGE: VU Meter ── */}
                <div className="absolute top-2 right-2 bottom-2 flex flex-col items-center gap-1 z-10">
                  <StereoVU level={level} />
                </div>

                {/* ── BOTTOM BAR: Signal Info + dB ── */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 z-10"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                  
                  {/* Signal Source Type */}
                  <div className="flex items-center gap-1.5">
                    {level > 0 ? (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-slate-700" />
                    )}
                    <span className={`text-[8px] font-black uppercase tracking-wider ${level > 0 ? 'text-emerald-400/80' : 'text-slate-700'}`}>
                      {typeLabel}
                    </span>
                    {level > 0 && (
                      <span className="text-[7px] font-mono text-emerald-500/50">SIGNAL</span>
                    )}
                  </div>

                  {/* dB Readout */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold ${
                      level > 0.85 ? 'text-red-400' : level > 0.65 ? 'text-amber-400' : level > 0 ? 'text-emerald-400' : 'text-slate-700'
                    }`}>
                      {dbLabel}
                    </span>
                    {/* Mini horizontal bar */}
                    <div className="w-12 h-1.5 rounded-full overflow-hidden bg-black/60">
                      <div className="h-full rounded-full transition-all duration-100"
                        style={{
                          width: `${level * 100}%`,
                          background: level > 0.85 ? 'linear-gradient(90deg, #22c55e, #fbbf24, #ef4444)' 
                            : level > 0.65 ? 'linear-gradient(90deg, #22c55e, #fbbf24)' 
                            : '#22c55e',
                        }} />
                    </div>
                  </div>
                </div>

                {/* Glow for Active */}
                {(isProgram || isPreview) && (
                  <div className={`absolute inset-0 pointer-events-none opacity-10 ${isProgram ? 'bg-red-500' : 'bg-green-500'}`} />
                )}
              </motion.button>
            );
          })}

          {/* Empty Slots — only fill to make a nice grid */}
          {cameras.length < 8 && [...Array(Math.max(0, 8 - cameras.length - 1))].map((_, i) => (
            <div key={i} className="aspect-video rounded-xl border border-white/[0.03] bg-black/20 min-h-[120px]" />
          ))}
        </div>
      </div>

    </div>
  );
}
