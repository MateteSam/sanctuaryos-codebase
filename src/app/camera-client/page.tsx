'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Lock, Signal, Zap, Grid3X3, Camera, Smartphone, Activity, ChevronRight, Share2, RotateCw, MonitorSmartphone, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = 'welcome' | 'connecting' | 'live' | 'error';

// ── ICE servers — STUN (same-LAN) + free public TURN (cross-network / mobile data) ─
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

const MY_PEER_ID = `phone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function detectLabel() {
  if (typeof navigator === 'undefined') return 'Remote Camera';
  const ua = navigator.userAgent;
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  return 'Remote Camera';
}

function CameraClientInner() {
  const params   = useSearchParams();
  const hostId   = params.get('hostId');
  const [label, setLabel] = useState('Remote Camera');

  useEffect(() => {
    setLabel(detectLabel());
  }, []);

  const [phase, setPhase]     = useState<Phase>('welcome');
  const [errMsg, setErrMsg]   = useState('');
  const [facing, setFacing]   = useState<'user' | 'environment'>('environment');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [nickname, setNickname] = useState('');

  const [isProgram, setIsProgram] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [directorCueText, setDirectorCueText] = useState('');
  
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef   = useRef<RTCPeerConnection | null>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cueTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    pollRef.current && clearInterval(pollRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
  }, []);

  const openCamera = useCallback(async (facingMode: 'user' | 'environment', orient: 'portrait' | 'landscape' = 'landscape') => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    const isPortrait = orient === 'portrait';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width:  { ideal: isPortrait ? 1080 : 1920 },
        height: { ideal: isPortrait ? 1920 : 1080 },
      },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
    return stream;
  }, []);

  const startSignalling = useCallback((hostPeerId: string, conn: RTCPeerConnection) => {
    const iceBuf: RTCIceCandidateInit[] = [];
    let remoteDescSet = false;

    const safeAdd = async (c: RTCIceCandidateInit) => {
      if (!remoteDescSet) { iceBuf.push(c); return; }
      try { await conn.addIceCandidate(new RTCIceCandidate(c)); } catch { /* benign */ }
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/signal?peerId=${MY_PEER_ID}`);
        const { messages } = await res.json() as any;
        if (!peerRef.current) return;

        for (const msg of (messages ?? [])) {
          if (msg.action === 'answer' && msg.sdp && !remoteDescSet) {
            await conn.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            remoteDescSet = true;
            for (const c of [...iceBuf]) {
              try { await conn.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
            }
            iceBuf.length = 0;
          }
          if (msg.action === 'candidate' && msg.candidate) {
            await safeAdd(msg.candidate);
          }
          if (msg.action === 'state' && msg.payload) {
            const { programCamera, previewCamera } = msg.payload;
            const myCamId = `rtc-${MY_PEER_ID}`;
            const nowProgram = programCamera === myCamId;
            const nowPreview = previewCamera === myCamId;
            
            setIsProgram(prevProg => {
              if (nowProgram && !prevProg && navigator.vibrate) navigator.vibrate([200, 100, 200]);
              return nowProgram;
            });
            setIsPreview(prevPrev => {
              if (nowPreview && !prevPrev && !nowProgram && navigator.vibrate) navigator.vibrate(100);
              return nowPreview;
            });
          }
          if (msg.action === 'cue' && msg.payload?.text) {
            setDirectorCueText(msg.payload.text);
            if (cueTimer.current) clearTimeout(cueTimer.current);
            cueTimer.current = setTimeout(() => setDirectorCueText(''), 5000);
          }
        }
      } catch { /* network blip */ }
    };

    pollRef.current = setInterval(poll, 1500);
    poll();
  }, []);

  const handleConnect = useCallback(async () => {
    if (!hostId) { setPhase('error'); setErrMsg('No host ID found.'); return; }
    setPhase('connecting');
    try {
      const stream = await openCamera(facing, orientation);
      const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = conn;
      stream.getTracks().forEach(t => {
        const sender = conn.addTrack(t, stream);
        if (t.kind === 'video') {
          try {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            const connType = (navigator as any).connection?.effectiveType || '4g';
            let maxBitrate = 2500000;
            if (connType === '3g') maxBitrate = 800000;
            if (connType === '2g') maxBitrate = 250000;
            params.encodings[0].maxBitrate = maxBitrate;
            params.encodings[0].networkPriority = 'high';
            sender.setParameters(params).catch(() => {});
          } catch { /* unsupported */ }
        }
      });
      conn.onicecandidate = async ev => {
        if (!ev.candidate) return;
        await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: MY_PEER_ID, to: hostId, action: 'candidate', candidate: ev.candidate.toJSON(), label: nickname || label })
        }).catch(() => {});
      };
      conn.onconnectionstatechange = () => {
        const s = conn.connectionState;
        if (s === 'connected') setPhase('live');
        if (s === 'failed') { setPhase('error'); setErrMsg('Connection failed.'); }
      };
      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);
      await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: MY_PEER_ID, to: hostId, action: 'offer', sdp: offer, label: nickname || label, orientation })
      });
      startSignalling(hostId, conn);
    } catch (err: any) {
      setErrMsg(err?.name === 'NotAllowedError' ? 'Camera permission denied.' : err?.message || 'Could not start camera.');
      setPhase('error');
    }
  }, [hostId, facing, orientation, openCamera, startSignalling, nickname, label]);

  // ── Toggle orientation while live ──────────────────────────────────────────
  const toggleOrientation = useCallback(async () => {
    const next = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(next);
    if (phase === 'live' || phase === 'connecting') {
      try {
        const stream = await openCamera(facing, next);
        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
        const track = stream.getVideoTracks()[0];
        if (sender && track) await sender.replaceTrack(track);
        // Notify host of orientation change
        if (hostId) {
          await fetch('/api/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: MY_PEER_ID, to: hostId, action: 'orientation', orientation: next }),
          }).catch(() => {});
        }
      } catch { /* ignore */ }
    }
  }, [orientation, phase, facing, openCamera, hostId]);

  const flipCamera = useCallback(async () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    try {
      const stream = await openCamera(next);
      const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
      const track = stream.getVideoTracks()[0];
      if (sender && track) await sender.replaceTrack(track);
    } catch { /* ignore */ }
  }, [facing, openCamera]);

  const handleTapToFocus = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'live' && phase !== 'connecting') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setFocusPoint({ x, y }); setTimeout(() => setFocusPoint(null), 2000);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      // @ts-ignore
      const caps = (track.getCapabilities?.() || {}) as any;
      const advanced: any = { pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] };
      if (caps.focusMode?.includes('continuous')) advanced.focusMode = 'continuous';
      await track.applyConstraints({ advanced: [advanced] });
    } catch { /* unsupported */ }
  }, [phase]);

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const cameraOk = isHttps || isLocalhost;

  return (
    <div className="min-h-screen bg-[#020408] flex flex-col text-white font-outfit selection:bg-sky-500/30 overflow-hidden">
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.04] bg-black/40 backdrop-blur-xl shrink-0 z-50">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-widest uppercase">SANCTUARY OS</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-0.5">CAMERA NODE · {nickname || label}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {phase === 'live' && (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${isProgram ? 'bg-red-600 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : isPreview ? 'bg-green-600 border-green-500' : 'bg-white/5 border-white/10'}`}>
              <div className={`w-2 h-2 rounded-full bg-white ${isProgram ? 'tally-live' : ''}`} />
              <span className="text-[10px] font-black tracking-widest uppercase">{isProgram ? 'ON AIR' : isPreview ? 'PREVIEW' : 'CONNECTED'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
        {phase === 'welcome' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
            <div className="relative group">
               <div className="w-32 h-32 rounded-[2.5rem] bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-sky-400" />
               </div>
               <div className="absolute -inset-4 border border-sky-500/10 rounded-[3rem] animate-pulse" />
            </div>

            <div className="text-center space-y-2">
               <h2 className="text-2xl font-black tracking-tight">Wireless Camera Node</h2>
               <p className="text-slate-500 text-sm max-w-xs mx-auto">Transform your device into a professional-grade broadcast input in seconds.</p>
            </div>

            {!cameraOk && (
              <div className="w-full max-w-xs p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4">
                 <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-amber-500">Security Requirement</p>
                    <p className="text-[9px] text-amber-500/80 leading-relaxed uppercase font-bold tracking-widest">
                       WebRTC requires an HTTPS secure origin to access cameras.
                    </p>
                 </div>
              </div>
            )}

            <div className="w-full max-w-xs space-y-4">
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="LABEL THIS CAMERA..."
                className="pro-input w-full h-14 text-center uppercase font-black tracking-widest" />
              
              {/* Camera Selection */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {(['environment', 'user'] as const).map(f => (
                  <button key={f} onClick={() => setFacing(f)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${facing === f ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
                    {f === 'environment' ? 'Rear Cam' : 'Front Cam'}
                  </button>
                ))}
              </div>

              {/* Orientation Selection */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {(['landscape', 'portrait'] as const).map(o => (
                  <button key={o} onClick={() => setOrientation(o)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orientation === o ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                    {o === 'landscape' ? <RectangleHorizontal className="w-4 h-4" /> : <RectangleVertical className="w-4 h-4" />}
                    {o}
                  </button>
                ))}
              </div>
              <p className="text-[8px] text-slate-600 text-center uppercase tracking-widest font-bold -mt-2">How will the host see this feed?</p>

              <motion.button whileTap={{ scale: 0.98 }} onClick={handleConnect} disabled={!cameraOk}
                className="w-full h-16 rounded-3xl bg-sky-500 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-sky-500/30 disabled:opacity-30 flex items-center justify-center gap-3">
                GO LIVE <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 cursor-crosshair group" onClick={handleTapToFocus}>
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
            <div className="scanline-effect opacity-30" />
            
            {/* Tally Border Overlay */}
            {isProgram && <div className="absolute inset-0 border-[12px] border-red-600 z-10 pointer-events-none animate-pulse" />}
            {isPreview && <div className="absolute inset-0 border-[12px] border-green-600 z-10 pointer-events-none" />}

            {/* Director Cue */}
            <AnimatePresence>
              {directorCueText && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-8">
                  <div className="glass-panel-heavy p-12 rounded-[3rem] border-4 border-red-500/40 shadow-2xl">
                    <p className="text-5xl md:text-8xl font-black uppercase tracking-[0.2em] text-center text-white drop-shadow-2xl">
                      {directorCueText}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tactical Safe Zones */}
            <AnimatePresence>
               {showSafeZone && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                       {[...Array(9)].map((_, i) => <div key={i} className="border border-white/10 border-dashed" />)}
                    </div>
                    <div className="absolute inset-[15%] border-2 border-sky-400/20 rounded-3xl" />
                    <div className="absolute bottom-12 left-12 right-12 h-20 bg-emerald-400/5 border border-emerald-400/20 rounded-2xl flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60">Graphics Safe Zone</span>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-40">
               {/* Orientation Toggle */}
               <button onClick={(e) => { e.stopPropagation(); toggleOrientation(); }}
                 className={`w-14 h-14 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all ${orientation === 'portrait' ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-white/40'}`}
                 title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}>
                 <RotateCw className="w-6 h-6" />
               </button>
               {/* Safe Zones */}
               <button onClick={(e) => { e.stopPropagation(); setShowSafeZone(!showSafeZone); }}
                 className={`w-14 h-14 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all ${showSafeZone ? 'bg-sky-500 border-sky-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-white/40'}`}>
                 <Grid3X3 className="w-6 h-6" />
               </button>
               {/* Flip Camera */}
               <button onClick={(e) => { e.stopPropagation(); flipCamera(); }}
                 className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/40 flex items-center justify-center active:scale-90 transition-all">
                 <Share2 className="w-6 h-6 rotate-90" />
               </button>
            </div>

            {/* Orientation Badge */}
            <div className="absolute top-20 left-6 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur border border-white/10 pointer-events-none">
              {orientation === 'portrait' ? <RectangleVertical className="w-4 h-4 text-amber-400" /> : <RectangleHorizontal className="w-4 h-4 text-sky-400" />}
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: orientation === 'portrait' ? '#fbbf24' : '#38bdf8' }}>
                {orientation}
              </span>
            </div>

            {/* Status Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between pointer-events-none">
               <div className="flex items-center gap-3">
                  <Activity className={`w-5 h-5 ${phase === 'live' ? 'text-sky-400 animate-pulse' : 'text-amber-500'}`} />
                  <div className="flex flex-col">
                     <p className="text-[11px] font-black uppercase tracking-widest text-white">{phase === 'live' ? 'UPSTREAM ACTIVE' : 'CONNECTING...'}</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Bitrate Adaptive · 1080p</p>
                  </div>
               </div>
               <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KEEP TAB OPEN</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      <AnimatePresence>
        {phase === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="max-w-xs w-full text-center space-y-8">
               <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">Signal Lost</h3>
                  <p className="text-slate-400 text-sm leading-relaxed uppercase font-bold tracking-widest">{errMsg}</p>
               </div>
               <button onClick={handleConnect}
                 className="w-full py-4 rounded-3xl bg-white text-black font-black uppercase tracking-widest shadow-xl">
                 RECONNECT
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CameraClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020408] flex items-center justify-center"><div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" /></div>}>
      <CameraClientInner />
    </Suspense>
  );
}
