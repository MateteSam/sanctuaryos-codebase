'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PHONE SWITCHER — Touch-Native Video Switching                         ║
 * ║                                                                        ║
 * ║  Designed mobile-first for single-operator broadcast control.          ║
 * ║  Tap to preview, double-tap to take, swipe for cues.                  ║
 * ║  Syncs with all stations via SSE state bus.                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scissors, Zap, Radio, Camera, Smartphone, Monitor, Globe,
  ChevronDown, ChevronUp, Send, ArrowLeft, Tv2, Eye, Wifi,
  Maximize2, Volume2, MessageSquare
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface CameraSource {
  id: string;
  label: string;
  type: 'local' | 'phone' | 'ndi' | 'rtc';
  connected: boolean;
}

interface SwitcherState {
  programCamera: string | null;
  previewCamera: string | null;
  isLive: boolean;
  cameras: CameraSource[];
}

// ── Haptic Helper ────────────────────────────────────────────────────────────
function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const ms = style === 'light' ? 10 : style === 'heavy' ? 40 : 20;
    navigator.vibrate(ms);
  }
}

// ── Transition audio tick ────────────────────────────────────────────────────
function playTick(freq = 800) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(); osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

// ── Camera Icon Map ──────────────────────────────────────────────────────────
const CAM_ICON: Record<string, React.ElementType> = {
  local: Camera,
  phone: Smartphone,
  ndi: Globe,
  rtc: Smartphone,
};

// ── Quick Cue Presets ────────────────────────────────────────────────────────
const CUE_PRESETS = ['ZOOM IN', 'WIDE SHOT', 'PAN LEFT', 'PAN RIGHT', 'CLOSE UP', 'HOLD'];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function PhoneSwitcher() {
  const [state, setState] = useState<SwitcherState>({
    programCamera: null,
    previewCamera: null,
    isLive: false,
    cameras: [],
  });
  const [isFading, setIsFading] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const [customCue, setCustomCue] = useState('');
  const [time, setTime] = useState('--:--:--');
  const [connected, setConnected] = useState(false);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const [transType, setTransType] = useState<'CUT' | 'FADE'>('CUT');

  // ── Clock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── SSE Connection ─────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    const connect = () => {
      es = new EventSource('/api/state');
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setState(prev => ({
            ...prev,
            programCamera: data.programCamera ?? prev.programCamera,
            previewCamera: data.previewCamera ?? prev.previewCamera,
            isLive: data.isLive ?? prev.isLive,
          }));
        } catch {}
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        setTimeout(connect, 3000);
      };
    };
    connect();

    // Heartbeat
    const hb = setInterval(() => {
      fetch('/api/ops/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: 'switch' }),
      }).catch(() => {});
    }, 5000);

    return () => { es?.close(); clearInterval(hb); };
  }, []);

  // ── Simulated camera list (in production, from SSE state) ──────────────
  useEffect(() => {
    // Fetch initial camera state
    fetch('/api/state')
      .then(r => r.json())
      .then((data: any) => {
        if (data.cameras) {
          setState(prev => ({ ...prev, cameras: data.cameras }));
        }
      })
      .catch(() => {
        // Fallback demo cameras
        setState(prev => ({
          ...prev,
          cameras: [
            { id: 'cam-1', label: 'Main Wide', type: 'local', connected: true },
            { id: 'cam-2', label: 'Stage Left', type: 'rtc', connected: true },
            { id: 'cam-3', label: 'Close Up', type: 'rtc', connected: true },
            { id: 'cam-4', label: 'Balcony', type: 'ndi', connected: true },
          ],
          programCamera: 'cam-1',
          previewCamera: 'cam-2',
        }));
      });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const pushState = useCallback((patch: Record<string, any>) => {
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(console.error);
  }, []);

  const handleCut = useCallback(() => {
    haptic('heavy');
    playTick(1200);
    const p = state.programCamera;
    const n = state.previewCamera;
    setState(prev => ({ ...prev, programCamera: n, previewCamera: p }));
    pushState({ programCamera: n, previewCamera: p });
  }, [state.programCamera, state.previewCamera, pushState]);

  const handleFade = useCallback(() => {
    if (isFading) return;
    haptic('medium');
    playTick(600);
    setIsFading(true);
    setTimeout(() => {
      const p = state.programCamera;
      const n = state.previewCamera;
      setState(prev => ({ ...prev, programCamera: n, previewCamera: p }));
      pushState({ programCamera: n, previewCamera: p });
      setIsFading(false);
    }, 800);
  }, [isFading, state.programCamera, state.previewCamera, pushState]);

  const handleTakeTransition = useCallback(() => {
    if (transType === 'CUT') handleCut();
    else handleFade();
  }, [transType, handleCut, handleFade]);

  const handleCameraSelect = useCallback((id: string) => {
    haptic('light');
    playTick(400);

    // Double-tap detection: if same camera tapped within 300ms → take it live
    const now = Date.now();
    if (lastTapRef.current?.id === id && now - lastTapRef.current.time < 400) {
      // Double-tap → Take
      haptic('heavy');
      playTick(1200);
      setState(prev => ({ ...prev, programCamera: id, previewCamera: prev.programCamera }));
      pushState({ programCamera: id, previewCamera: state.programCamera });
      lastTapRef.current = null;
      return;
    }

    lastTapRef.current = { id, time: now };
    // Single tap → Preview
    setState(prev => ({ ...prev, previewCamera: id }));
    pushState({ previewCamera: id });
  }, [pushState, state.programCamera]);

  const handleToggleLive = useCallback(() => {
    haptic('heavy');
    const n = !state.isLive;
    setState(prev => ({ ...prev, isLive: n }));
    pushState({ isLive: n });
  }, [state.isLive, pushState]);

  const sendCue = useCallback((text: string) => {
    haptic('light');
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directorCue: text }),
    }).catch(console.error);
  }, []);

  const programCam = state.cameras.find(c => c.id === state.programCamera);
  const previewCam = state.cameras.find(c => c.id === state.previewCamera);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#05060B] font-outfit text-[#e2e8f0] overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}>

      {/* ═══ HEADER BAR ═══ */}
      <div className="flex items-center justify-between px-4 h-12 surface-dark-steel shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <a href="/ops" className="touch-target flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </a>
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-sky-500/60">SanctuaryOS</div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white">Phone Switcher</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="display-lcd text-[10px] px-2 py-1">{time}</div>
          <div className={`led ${connected ? 'led-green' : 'led-red'}`} />
        </div>
      </div>

      {/* ═══ PROGRAM MONITOR ═══ */}
      <div className="relative flex-shrink-0" style={{ height: '28%' }}>
        <div className="absolute inset-0 bg-black flex items-center justify-center"
          style={{ border: `2px solid ${state.isLive ? '#ef4444' : 'rgba(239,68,68,0.3)'}` }}>
          {/* Placeholder — in production, shows the actual video stream */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1a0505 0%, #0a0505 100%)' }}>
            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/[0.04]" />
          </div>

          {/* Tally + Label */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${state.isLive ? 'bg-red-600' : 'bg-red-600/30'}`}>
              {state.isLive && <div className="w-1.5 h-1.5 rounded-full bg-white tally-live" />}
              <span className="text-[8px] font-black tracking-widest text-white uppercase">PGM</span>
            </div>
            <span className="text-[8px] font-mono font-bold text-white/60 bg-black/50 px-2 py-0.5 rounded">
              {programCam?.label || 'NO SOURCE'}
            </span>
          </div>

          {/* Fade overlay */}
          {isFading && <div className="absolute inset-0 bg-black z-20 animate-pulse" />}
        </div>
      </div>

      {/* ═══ PREVIEW MONITOR ═══ */}
      <div className="relative flex-shrink-0" style={{ height: '18%' }}>
        <div className="absolute inset-0 bg-black flex items-center justify-center"
          style={{ border: '2px solid rgba(34,197,94,0.3)' }}>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #051a05 0%, #050a05 100%)' }}>
            <Eye className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/[0.04]" />
          </div>

          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-600/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] font-black tracking-widest text-green-500 uppercase">PVW</span>
            </div>
            <span className="text-[8px] font-mono font-bold text-white/60 bg-black/50 px-2 py-0.5 rounded">
              {previewCam?.label || 'NO SOURCE'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CAMERA GRID ═══ */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <div className="grid grid-cols-3 gap-2">
          {state.cameras.map((cam, idx) => {
            const isProgram = cam.id === state.programCamera;
            const isPreview = cam.id === state.previewCamera;
            const Icon = CAM_ICON[cam.type] || Camera;

            return (
              <button
                key={cam.id}
                onClick={() => handleCameraSelect(cam.id)}
                className="relative aspect-[4/3] rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all active:scale-95 touch-target"
                style={{
                  background: isProgram ? 'rgba(239,68,68,0.08)' : isPreview ? 'rgba(34,197,94,0.08)' : '#0e1015',
                  border: `2px solid ${isProgram ? '#ef4444' : isPreview ? '#22c55e' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isProgram ? '0 0 16px rgba(239,68,68,0.15)' : isPreview ? '0 0 16px rgba(34,197,94,0.1)' : 'none',
                }}
              >
                <Icon className="w-5 h-5 mb-1"
                  style={{ color: isProgram ? '#ef4444' : isPreview ? '#22c55e' : 'rgba(255,255,255,0.15)' }} />

                <span className="text-[8px] font-black uppercase tracking-wider"
                  style={{ color: isProgram ? '#ef4444' : isPreview ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                  {cam.label}
                </span>

                {/* Tally dot */}
                <div className="absolute top-1.5 right-1.5">
                  {isProgram && <div className="w-2 h-2 rounded-full bg-red-500 tally-live" />}
                  {isPreview && <div className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px #22c55e' }} />}
                </div>

                {/* Camera number */}
                <div className="absolute top-1.5 left-1.5 text-[7px] font-mono font-bold text-slate-700">{idx + 1}</div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <div className="text-center mt-2">
          <span className="text-[8px] text-slate-700 font-mono">Tap = Preview · Double-tap = Take Live</span>
        </div>
      </div>

      {/* ═══ TRANSITION BAR ═══ */}
      <div className="shrink-0 p-3 surface-aluminum" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Transition Type Toggle */}
        <div className="flex gap-1 mb-3">
          {(['CUT', 'FADE'] as const).map(t => (
            <button key={t}
              onClick={() => { setTransType(t); haptic('light'); }}
              className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all touch-target"
              style={{
                background: transType === t ? (t === 'CUT' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)') : 'rgba(255,255,255,0.03)',
                border: `1px solid ${transType === t ? (t === 'CUT' ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)') : 'rgba(255,255,255,0.06)'}`,
                color: transType === t ? (t === 'CUT' ? '#ef4444' : '#38bdf8') : 'rgba(255,255,255,0.3)',
              }}>
              {t === 'CUT' ? <Scissors className="w-3 h-3 mx-auto mb-0.5" /> : <Zap className="w-3 h-3 mx-auto mb-0.5" />}
              {t}
            </button>
          ))}
        </div>

        {/* Main Action Row */}
        <div className="flex gap-2">
          {/* TAKE Button */}
          <button
            onClick={handleTakeTransition}
            disabled={isFading}
            className="flex-1 py-4 rounded-2xl flex flex-col items-center justify-center touch-target-lg active:scale-95 transition-transform"
            style={{
              background: transType === 'CUT'
                ? 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)'
                : 'linear-gradient(180deg, #0284c7 0%, #075985 100%)',
              boxShadow: transType === 'CUT'
                ? '0 4px 20px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 4px 20px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {transType === 'CUT'
              ? <Scissors className="w-6 h-6 text-white mb-1" />
              : <Zap className="w-6 h-6 text-white mb-1" />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
              {transType === 'CUT' ? 'CUT' : 'FADE'}
            </span>
          </button>

          {/* GO LIVE */}
          <button
            onClick={handleToggleLive}
            className="w-20 py-4 rounded-2xl flex flex-col items-center justify-center touch-target-lg active:scale-95 transition-transform"
            style={{
              background: state.isLive
                ? 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)'
                : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: state.isLive
                ? '0 0 30px rgba(239,68,68,0.3)'
                : '0 2px 10px rgba(0,0,0,0.4)',
              border: state.isLive ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Radio className={`w-5 h-5 mb-1 ${state.isLive ? 'text-white' : 'text-slate-500'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${state.isLive ? 'text-white' : 'text-slate-500'}`}>
              {state.isLive ? 'LIVE' : 'GO LIVE'}
            </span>
          </button>

          {/* CUE Button */}
          <button
            onClick={() => { setShowCues(!showCues); haptic('light'); }}
            className="w-16 py-4 rounded-2xl flex flex-col items-center justify-center touch-target-lg active:scale-95 transition-transform"
            style={{
              background: showCues ? 'rgba(14,165,233,0.15)' : '#0e1015',
              border: `1px solid ${showCues ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <MessageSquare className={`w-5 h-5 mb-1 ${showCues ? 'text-sky-400' : 'text-slate-600'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${showCues ? 'text-sky-400' : 'text-slate-600'}`}>CUE</span>
          </button>
        </div>
      </div>

      {/* ═══ CUE PANEL (Bottom Sheet) ═══ */}
      {showCues && (
        <div className="shrink-0 p-3 surface-dark-steel" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {CUE_PRESETS.map(cue => (
              <button key={cue}
                onClick={() => { sendCue(cue); haptic('light'); setShowCues(false); }}
                className="py-2.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-slate-400 touch-target active:scale-95 transition-transform"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {cue}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customCue}
              onChange={e => setCustomCue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customCue.trim()) {
                  sendCue(customCue.trim());
                  setCustomCue('');
                  setShowCues(false);
                }
              }}
              placeholder="Custom cue..."
              className="flex-1 pro-input text-[10px] py-2 touch-target"
            />
            <button onClick={() => { if (customCue.trim()) { sendCue(customCue.trim()); setCustomCue(''); setShowCues(false); } }}
              className="w-10 h-10 rounded-lg flex items-center justify-center touch-target"
              style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
              <Send className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM STATUS ═══ */}
      <div className="h-7 flex items-center justify-between px-4 shrink-0"
        style={{ background: '#020408', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-sky-500' : 'bg-red-500'}`}
            style={{ boxShadow: connected ? '0 0 6px #0ea5e9' : '0 0 6px #ef4444' }} />
          <span className="text-[7px] font-mono font-bold text-slate-700 uppercase tracking-widest">
            {connected ? 'Sync Active' : 'Reconnecting...'}
          </span>
        </div>
        <span className="text-[7px] font-mono text-slate-800">SanctuaryOS Switch v1.0</span>
      </div>
    </div>
  );
}
