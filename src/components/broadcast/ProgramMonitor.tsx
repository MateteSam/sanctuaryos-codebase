'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Palette, Camera, Tv2, LayoutGrid, Zap, Radio, Activity, RectangleVertical } from 'lucide-react';
import { type ManagedCamera } from '@/lib/useCameraManager';
import { type AtmospherePreset } from '@/data/atmospheres';
import { type SlideData } from '@/data/lyrics';
import { mediaOverlays, textPositions, textStylePresets } from '@/data/overlays';

interface Props {
  type: 'preview' | 'program';
  cam: ManagedCamera | undefined;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  outputMode: string;
  activeAtmos: AtmospherePreset;
  activeSlide: SlideData | null;
  textPosition: string;
  textStylePreset: string;
  textFontSize: string;
  textFontFamily: 'sans' | 'scripture';
  activeOverlay: string | null;
  activeMediaOverlays: string[];
  overlayOpacities: Record<string, number>;
  showBranding: boolean;
  isFading: boolean;
  isLive?: boolean;
  lowerThirdText: string;
  lowerThirdSub: string;
  lowerThirdStyle: string;
  lowerThirdColor: string;
}

export function ProgramMonitor({
  type, cam, videoRef, outputMode, activeAtmos, activeSlide,
  textPosition, textStylePreset, textFontSize, textFontFamily,
  activeOverlay, activeMediaOverlays, overlayOpacities,
  showBranding, isFading, isLive, lowerThirdText, lowerThirdSub,
  lowerThirdStyle, lowerThirdColor
}: Props) {
  
  const isProgram = type === 'program';
  const isPreview = type === 'preview';
  const isPortrait = cam?.orientation === 'portrait';

  useEffect(() => {
    if (videoRef.current && cam?.stream) {
      videoRef.current.srcObject = cam.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cam?.stream, videoRef]);

  return (
    <div className="flex-1 flex flex-col gap-3 font-outfit">
      {/* ── MONITOR HEADER ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md border transition-all ${
            isProgram 
              ? (isLive ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-red-600/20 border-red-500/40') 
              : 'bg-green-600/20 border-green-500/40'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isProgram ? 'bg-white tally-live' : 'bg-green-500'}`} />
            <span className={`text-[10px] font-black tracking-widest uppercase ${isProgram ? 'text-white' : 'text-green-500'}`}>
              {type}
            </span>
          </div>
          <span className="pro-label">{cam?.label || 'NO SOURCE'}</span>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <span className="pro-label text-slate-700">RES:</span>
              <span className="text-[9px] font-mono font-bold text-slate-500">{cam?.resolution || (isPortrait ? '1080×1920' : '1920×1080')}</span>
              {isPortrait && <RectangleVertical className="w-3 h-3 text-amber-400" />}
           </div>
           <div className="flex items-center gap-1.5">
              <span className="pro-label text-slate-700">FPS:</span>
              <span className="text-[9px] font-mono font-bold text-slate-500">60.00</span>
           </div>
        </div>
      </div>

      {/* ── VIDEO CONTAINER ── */}
      <div className={`monitor-frame rounded-2xl group border-2 transition-all duration-500 ${
        isProgram && isLive ? 'border-red-600' : isProgram ? 'border-red-600/40' : isPreview ? 'border-green-500/40' : 'border-white/5'
      }`}>
        {/* The Video Layer */}
        <div className="absolute inset-0 bg-slate-950">
          {cam?.stream ? (
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full transition-transform duration-700 group-hover:scale-[1.01] ${isPortrait ? 'object-contain' : 'object-cover'}`} />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${activeAtmos.gradient} opacity-20`} />
          )}
        </div>


        {/* Overlays (Only for Program) */}
        {isProgram && (
          <div className="absolute inset-0 pointer-events-none scale-[0.98]">
             <BroadcastOverlays
               activeAtmos={activeAtmos} activeSlide={activeSlide}
               textPosition={textPosition} textStylePreset={textStylePreset}
               textFontSize={textFontSize} textFontFamily={textFontFamily}
               activeOverlay={activeOverlay} activeMediaOverlays={activeMediaOverlays}
               overlayOpacities={overlayOpacities} showBranding={showBranding}
               isFading={isFading} lowerThirdText={lowerThirdText}
               lowerThirdSub={lowerThirdSub} lowerThirdStyle={lowerThirdStyle}
               lowerThirdColor={lowerThirdColor}
             />
          </div>
        )}

        {/* Transition Flash */}
        <AnimatePresence>
          {isFading && isProgram && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }} className="absolute inset-0 bg-black z-50" />
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

function BroadcastOverlays({
  activeAtmos, activeSlide, textPosition, textStylePreset, textFontSize,
  textFontFamily, activeOverlay, activeMediaOverlays, overlayOpacities,
  showBranding, isFading, lowerThirdText, lowerThirdSub,
  lowerThirdStyle, lowerThirdColor
}: any) {
  const pos = textPositions.find(p => p.id === textPosition) || textPositions[4];
  const stylePreset = textStylePresets.find(s => s.id === textStylePreset) || textStylePresets[0];
  const previewTextSize = textFontSize === 'xs' ? 'text-sm' : textFontSize === 'sm' ? 'text-lg' : textFontSize === 'md' ? 'text-2xl' : textFontSize === 'lg' ? 'text-3xl' : 'text-4xl';
  const previewContent = activeSlide?.content
    ? (activeSlide.content.length > 70 ? activeSlide.content.slice(0, 70) + '…' : activeSlide.content)
    : null;

  return (
    <>
      {activeMediaOverlays.map((ovId: string) => {
        const ov = mediaOverlays.find(o => o.id === ovId);
        if (!ov) return null;
        const opacity = (overlayOpacities[ov.id] ?? ov.opacity) / 100;
        if (ov.cssClass === 'overlay-vignette') return <div key={ovId} className="absolute inset-0 pointer-events-none z-[5]" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)', opacity }} />;
        return null;
      })}

      <AnimatePresence mode="wait">
        {previewContent && (
          <motion.div key={activeSlide?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 flex ${pos.align} ${pos.justify} ${pos.px} p-8 z-10`}>
            <div className={pos.justify === 'justify-center' ? 'text-center' : 'text-left'}>
              {activeSlide?.type === 'scripture' && <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: activeAtmos.accentColor }}>{activeSlide.reference}</p>}
              <p className={`whitespace-pre-wrap leading-tight font-black uppercase tracking-wide ${stylePreset.textColor} ${previewTextSize}`}>
                {previewContent}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeOverlay === 'lower_thirds' && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-10 left-10 z-20">
            <div className="flex overflow-hidden rounded-2xl hardware-panel p-4 gap-4 border-l-8" style={{ borderLeftColor: lowerThirdColor }}>
               <div className="flex flex-col">
                  <p className="text-white font-black text-xl uppercase tracking-tighter">{lowerThirdText}</p>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{lowerThirdSub}</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeOverlay === 'break' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30">
             <Activity className="w-16 h-16 text-sky-500 mb-6 animate-pulse" />
             <p className="text-4xl font-black text-white uppercase tracking-[0.3em]">Intermission</p>
             <p className="pro-label mt-4">SanctuaryOS Live</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showBranding && (
        <div className="absolute top-10 right-10 w-12 h-12 rounded-3xl border border-white/20 flex items-center justify-center bg-black/40 backdrop-blur-xl z-10">
          <span className="text-[10px] font-black text-white tracking-tighter">S_OS</span>
        </div>
      )}
    </>
  );
}
