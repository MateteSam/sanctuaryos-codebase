'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { atmospherePresets } from '@/data/atmospheres';
import { mediaOverlays, textPositions, textStylePresets, fontSizes } from '@/data/overlays';

interface LiveState {
  atmosphere: string;
  flowMode: boolean;
  activeSlide: any;
  layoutStyle: string;
  outputMode: string;
  useMediaBackground: boolean;
  showBranding: boolean;
  activeOverlay: string | null;
  lowerThirdText: string;
  lowerThirdSub: string;
  lowerThirdStyle: string;
  lowerThirdColor: string;
  isLive: boolean;
  activeMediaOverlays: string[];
  textPosition: string;
  textStylePreset: string;
  textFontSize: string;
  textFontFamily: string;
  lastUpdated: number;
  // New v2.0 fields
  atmosVideoUrl?: string | null;
  countdownEndTime?: number | null;
  countdownMessage?: string;
}

// Live countdown display
function CountdownDisplay({ endTime, message, accentColor }: { endTime: number; message?: string; accentColor: string }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, endTime - Date.now())), 500);
    return () => clearInterval(t);
  }, [endTime]);
  const s = Math.floor(remaining / 1000) % 60;
  const m = Math.floor(remaining / 60000) % 60;
  const h = Math.floor(remaining / 3600000);
  const fmt = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-[16vw] font-black leading-none" style={{ color: accentColor, textShadow: `0 0 80px ${accentColor}80` }}>{fmt}</p>
      {message && <p className="text-2xl font-black uppercase tracking-[0.4em] text-white/60">{message}</p>}
    </div>
  );
}

export function BeamClient() {
  const [state, setState] = useState<LiveState | null>(null);
  const [connStatus, setConnStatus] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      setConnStatus('connecting');
      es = new EventSource('/api/state/stream');

      es.onopen = () => {
        setConnStatus('live');
        // Fetch current state immediately on connect (SSE only broadcasts changes)
        fetch('/api/state')
          .then(r => r.json())
          .then(d => setState(d as LiveState))
          .catch(console.error);
      };

      es.onmessage = (event) => {
        try {
          setState(JSON.parse(event.data) as LiveState);
        } catch { /* malformed data — ignore */ }
      };

      es.onerror = () => {
        setConnStatus('reconnecting');
        es.close();
        // EventSource has built-in reconnect, but we add our own for clarity
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);


  if (!state) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black">
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          connStatus === 'reconnecting' ? 'bg-amber-400' : 'bg-slate-700'
        }`} />
        <p className="text-sm font-black tracking-[0.3em] text-slate-700 uppercase">
          {connStatus === 'reconnecting' ? 'Reconnecting…' : 'Awaiting OS Sync…'}
        </p>
      </div>
    );
  }

  const atmos = atmospherePresets.find(a => a.name === state.atmosphere) || atmospherePresets[0];
  const slide = state.activeSlide;
  const pos   = textPositions.find(p => p.id === state.textPosition) || textPositions[4];
  const style = textStylePresets.find(s => s.id === state.textStylePreset) || textStylePresets[0];
  const accentColor = atmos.accentColor || '#6EC9FF';

  const isLowerThird = state.layoutStyle === 'lower_third';
  const isModernSerif = state.layoutStyle === 'modern_serif';

  const textAlign = pos.justify === 'justify-center' ? 'text-center' : pos.justify === 'justify-end' ? 'text-right' : 'text-left';

  const fontSize =
    state.textFontSize === 'xs' ? (isLowerThird ? 'text-2xl' : 'text-3xl') :
    state.textFontSize === 'sm' ? (isLowerThird ? 'text-3xl' : 'text-5xl') :
    state.textFontSize === 'md' ? (isLowerThird ? 'text-4xl' : 'text-7xl') :
    state.textFontSize === 'lg' ? (isLowerThird ? 'text-5xl' : 'text-8xl') :
    (isLowerThird ? 'text-5xl' : 'text-9xl');

  const fontFamily = isModernSerif
    ? 'font-scripture'
    : state.textFontFamily === 'scripture' ? 'font-scripture' : 'font-sans';

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">

      {/* ── BACKGROUND ── */}
      {/* Video ATMOS (looping, muted) — sits behind everything */}
      <AnimatePresence>
        {state.atmosVideoUrl && (
          <motion.video
            key={state.atmosVideoUrl}
            src={state.atmosVideoUrl}
            autoPlay muted loop playsInline
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}
      </AnimatePresence>

      {/* Gradient / image background */}
      <AnimatePresence mode="wait">
        <motion.div key={state.atmosphere + String(state.useMediaBackground)}
          className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: state.atmosVideoUrl ? 0.3 : 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.8 }}>
          {state.useMediaBackground ? (
            <>
              {/* CSS gradient fallback covers cases where cinematic-bg.png is missing */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950" />
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/demo/cinematic-bg.png')" }} />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${atmos.gradient}`} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── MEDIA OVERLAYS (stacked) ── */}
      {(state.activeMediaOverlays || []).map(ovId => {
        const ov = mediaOverlays.find(o => o.id === ovId);
        if (!ov) return null;
        if (ov.type === 'image' && ov.imageSrc) return (
          <div key={ovId} className="absolute inset-0 bg-cover bg-center pointer-events-none z-[5]"
            style={{ backgroundImage: `url(${ov.imageSrc})`, mixBlendMode: ov.blendMode as any, opacity: ov.opacity / 100 }}
          />
        );
        if (ov.cssClass === 'overlay-vignette') return (
          <div key={ovId} className="absolute inset-0 pointer-events-none z-[5]"
            style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)', opacity: ov.opacity / 100 }}
          />
        );
        if (ov.cssClass === 'overlay-noise') return (
          // Inline CSS grain — no external URL dependency
          <div key={ovId} className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              mixBlendMode: 'overlay' as any,
              opacity: ov.opacity / 100,
            }}
          />
        );
        if (ov.cssClass === 'overlay-particles') return (
          <div key={ovId} className="absolute inset-0 overflow-hidden pointer-events-none z-[5]" style={{ opacity: ov.opacity / 100 }}>
            {[...Array(18)].map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 rounded-full"
                style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
                  background: '#E8C77A', animation: `beam-float ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
                  opacity: 0.3 + (i % 5) * 0.1 }}
              />
            ))}
          </div>
        );
        if (ov.cssClass === 'overlay-light-rays') return (
          <div key={ovId} className="absolute inset-0 pointer-events-none z-[5]" style={{ opacity: ov.opacity / 100, mixBlendMode: 'screen' }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'conic-gradient(from 0deg at 50% 0%, transparent 0deg, rgba(255,255,255,0.04) 10deg, transparent 20deg, rgba(255,255,255,0.04) 30deg, transparent 40deg)',
              backgroundSize: '100% 200%'
            }} />
          </div>
        );
        return null;
      })}

      {/* ── SLIDE TEXT ── */}
      {/* lower_third: constrain to bottom 30% of screen */}
      <div className={`absolute z-10 flex ${
        isLowerThird
          ? 'bottom-0 left-0 right-0 items-end px-14 pb-14'
          : `inset-0 ${pos.align} ${pos.justify} ${pos.px} ${pos.pt} ${pos.pb}`
      }`}>
        <AnimatePresence mode="wait">
          {slide ? (
            <motion.div key={slide.id + state.textPosition + state.textStylePreset + state.textFontSize + state.layoutStyle}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.7 }}
              className={`max-w-6xl ${isLowerThird ? 'w-full border-l-4 pl-6' : ''} ${textAlign}`}
              style={isLowerThird ? { borderColor: '#6EC9FF' } : {}}
            >
              {slide.type === 'scripture' && slide.reference && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.1 }}
                  className={`${isLowerThird ? 'text-lg' : 'text-2xl'} font-black uppercase tracking-[0.3em] mb-4 font-sans`}
                  style={{ color: '#E8C77A' }}
                >
                  {slide.reference}
                </motion.p>
              )}
              <p className={`whitespace-pre-wrap leading-tight ${style.textColor} ${style.shadow} ${style.fontStyle}
                ${fontFamily}
                ${fontSize}`}
              >
                {slide.content}
              </p>
            </motion.div>
          ) : (
            <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
              <p className="font-scripture text-[4vw] text-white">{atmos.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LOWER THIRDS ── */}
      <AnimatePresence>
        {state.activeOverlay === 'lower_thirds' && (
          <motion.div className="absolute bottom-0 left-0 right-0 px-14 pb-12 z-30"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}>

            {state.lowerThirdStyle === 'classic' && (
              <div className="flex overflow-hidden rounded-xl max-w-lg">
                <div className="w-1.5 self-stretch shrink-0" style={{ background: state.lowerThirdColor }} />
                <div className="bg-black/80 backdrop-blur-md px-6 py-3">
                  <p className="text-white font-black text-2xl leading-none">{state.lowerThirdText}</p>
                  <p className="text-slate-400 text-lg mt-0.5">{state.lowerThirdSub}</p>
                </div>
              </div>
            )}
            {state.lowerThirdStyle === 'gradient' && (
              <div className="max-w-xl px-8 py-4 rounded-xl" style={{ background: `linear-gradient(to right, ${state.lowerThirdColor}55, transparent)` }}>
                <p className="text-white font-black text-3xl">{state.lowerThirdText}</p>
                <p className="text-white/60 text-xl mt-1">{state.lowerThirdSub}</p>
              </div>
            )}
            {state.lowerThirdStyle === 'pill' && (
              <div className="flex items-center gap-3">
                <div className="px-5 py-2 rounded-full text-lg font-black text-black" style={{ background: state.lowerThirdColor }}>{state.lowerThirdText}</div>
                <div className="px-5 py-2 rounded-full text-base font-bold bg-black/70 text-white/80">{state.lowerThirdSub}</div>
              </div>
            )}
            {state.lowerThirdStyle === 'cinematic' && (
              <div>
                <div className="h-0.5 mb-4 w-24" style={{ background: state.lowerThirdColor }} />
                <p className="text-white font-black tracking-widest text-3xl uppercase">{state.lowerThirdText}</p>
                <p className="text-xl tracking-[0.3em] uppercase mt-1" style={{ color: state.lowerThirdColor }}>{state.lowerThirdSub}</p>
              </div>
            )}
            {state.lowerThirdStyle === 'minimal' && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: state.lowerThirdColor }} />
                <p className="text-white font-bold text-xl">{state.lowerThirdText} <span className="text-white/50 font-normal">—</span> <span className="text-white/60 font-normal text-lg">{state.lowerThirdSub}</span></p>
              </div>
            )}
            {state.lowerThirdStyle === 'bold_left' && (
              <div className="flex overflow-hidden rounded-xl max-w-lg">
                <div className="px-4 py-3 flex items-center justify-center shrink-0" style={{ background: state.lowerThirdColor }}>
                  <span className="text-black font-black text-sm uppercase tracking-widest">{state.lowerThirdSub.slice(0,4)}</span>
                </div>
                <div className="bg-black/85 backdrop-blur-md px-5 py-3">
                  <p className="text-white font-black text-2xl leading-none">{state.lowerThirdText}</p>
                  <p className="text-slate-400 text-base mt-0.5">{state.lowerThirdSub}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GOING LIVE ── */}
      <AnimatePresence>
        {state.activeOverlay === 'going_live' && (
          <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ scale: [1, 1.04, 1], opacity: [1, 0.85, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
              className="flex items-center gap-5 px-14 py-7 rounded-full border-2 bg-red-600/20" style={{ borderColor: '#ef4444' }}>
              <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-4xl font-black uppercase tracking-[0.3em] text-white">Going Live</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COUNTDOWN OVERLAY ── */}
      <AnimatePresence>
        {state.activeOverlay === 'countdown' && state.countdownEndTime && (
          <motion.div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <CountdownDisplay
              endTime={state.countdownEndTime}
              message={state.countdownMessage}
              accentColor={accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BE RIGHT BACK ── */}
      <AnimatePresence>
        {state.activeOverlay === 'break' && (
          <motion.div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#1A2A4F]/96 backdrop-blur"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            <p className="font-scripture text-[5vw] text-white mb-3">We'll be right back</p>
            <p className="tracking-[0.6em] text-sm uppercase font-black" style={{ color: accentColor }}>SanctuaryOS Live</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOCIAL BAR ── */}
      <AnimatePresence>
        {state.activeOverlay === 'social' && (
          <motion.div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-10 bg-black/70 backdrop-blur px-8 py-4"
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
            <span className="text-base text-white/50 font-bold uppercase tracking-widest">Follow us</span>
            <span className="text-base text-white font-black">@SanctuaryChurch</span>
            <span className="text-base font-black" style={{ color: '#6EC9FF' }}>#SundayService</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BRANDING ── */}
      {state.showBranding && (
        <div className="absolute top-10 right-10 z-20">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-sm bg-black/30">
            <span className="text-base font-black text-white tracking-wider">SC</span>
          </div>
        </div>
      )}

      {/* ── STATUS INDICATOR ── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 opacity-25">
        <div className={`w-1.5 h-1.5 rounded-full ${
          connStatus === 'live' ? 'bg-emerald-400 animate-pulse' :
          connStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
          'bg-slate-600'
        }`} />
        <span className="font-mono text-[9px] text-white tracking-widest">
          {state.isLive ? 'ON AIR' : connStatus === 'live' ? 'LIVE SYNC' : 'RECONNECT…'}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes beam-float {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-30px) scale(1.3); }
        }
      `}} />
    </div>
  );
}
