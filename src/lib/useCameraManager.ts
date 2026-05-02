'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { defaultCameras, type CameraSource } from '@/data/cameras';
import { GenesisEngine, GENESIS_PRESETS, GENESIS_DEFAULT_CONFIG, type GenesisConfig } from './GenesisEngine';

export interface ManagedCamera extends CameraSource {
  stream?: MediaStream;
}

interface RtcPeer {
  peerId: string;
  conn: RTCPeerConnection;
  stream?: MediaStream;
  iceCandidateBuffer: RTCIceCandidateInit[];
  remoteDescriptionSet: boolean;
}

// ─── ICE config — STUN (same-LAN) + TURN relays (cross-network / mobile data) ─
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
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

const POLL_INTERVAL_MS = 1500;

// ─────────────────────────────────────────────────────────────────────────────
export function useCameraManager() {
  const [cameras, setCameras] = useState<ManagedCamera[]>(
    defaultCameras.map(c => ({ ...c }))
  );
  const [hostId, setHostId] = useState<string | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // camerasRef — always holds the latest cameras array, avoiding stale closures
  const camerasRef = useRef<ManagedCamera[]>(cameras);
  useEffect(() => { camerasRef.current = cameras; }, [cameras]);

  const rtcPeers = useRef<Map<string, RtcPeer>>(new Map());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GENESIS II Engine State ───────────────────────────────────────────────────
  const [genesisPreset, setGenesisPreset] = useState<string>('off');
  const [genesisConfig, setGenesisConfig] = useState<GenesisConfig>({ ...GENESIS_DEFAULT_CONFIG });
  const genesisEngines = useRef<Map<string, GenesisEngine>>(new Map());

  // Sync config to all active engines when config changes
  useEffect(() => {
    genesisEngines.current.forEach(engine => engine.updateConfig(genesisConfig));
  }, [genesisConfig]);

  // When preset changes, populate config from the preset library
  const handleSetPreset = useCallback((presetId: string) => {
    setGenesisPreset(presetId);
    const preset = GENESIS_PRESETS[presetId];
    if (preset) {
      setGenesisConfig({ ...preset.config });
    }
  }, []);

  // When a manual slider is adjusted, mark preset as 'custom'
  const handleSetConfig = useCallback((partial: Partial<GenesisConfig>) => {
    setGenesisPreset('custom');
    setGenesisConfig(prev => ({ ...prev, ...partial }));
  }, []);

  // Legacy compat for isCinematicMode
  const isCinematicMode = genesisPreset !== 'off';
  const setIsCinematicMode = useCallback((enabled: boolean) => {
    handleSetPreset(enabled ? 'natural' : 'off');
  }, [handleSetPreset]);

  // applyGenesis — wraps every stream through the WebGL pipeline.
  // When preset is 'off', the shader passes through untouched (zero overhead).
  const applyGenesis = useCallback((id: string, rawStream: MediaStream): MediaStream => {
    if (genesisEngines.current.has(id)) {
      genesisEngines.current.get(id)?.destroy();
    }
    if (rawStream.getVideoTracks().length === 0) return rawStream;
    const engine = new GenesisEngine(rawStream);
    engine.updateConfig(genesisConfig);
    genesisEngines.current.set(id, engine);
    return engine.processedStream;
  }, [genesisConfig]);

  const removeGenesis = useCallback((id: string) => {
    if (genesisEngines.current.has(id)) {
      genesisEngines.current.get(id)?.destroy();
      genesisEngines.current.delete(id);
    }
  }, []);

  // Stable refs so callbacks never stale-close over genesis functions
  const applyGenesisRef = useRef(applyGenesis);
  useEffect(() => { applyGenesisRef.current = applyGenesis; }, [applyGenesis]);
  const removeGenesisRef = useRef(removeGenesis);
  useEffect(() => { removeGenesisRef.current = removeGenesis; }, [removeGenesis]);

  // ── Stable host peer ID generation ──────────────────────────────────────────
  useEffect(() => {
    try {
      let id = localStorage.getItem('sanctuary_host_id');
      if (!id) {
        id = `sanctuary-host-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('sanctuary_host_id', id);
      }
      console.log('[CameraManager] ✅ Host ID generated/loaded:', id);
      setHostId(id);
    } catch {
      // Fallback for private browsing
      const fallbackId = `sanctuary-host-${Math.random().toString(36).slice(2, 10)}`;
      console.log('[CameraManager] ✅ Host ID generated (memory):', fallbackId);
      setHostId(fallbackId);
    }
  }, []);

  // ── Enumerate & open local camera(s) ───────────────────────────────────────
  const refreshLocalDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    setIsLoadingDevices(true);
    try {
      const currentLocalCams = camerasRef.current.filter(c => c.type === 'local' || c.type === 'usb');
      const hasActiveStream = currentLocalCams.some(c => c.connected && c.stream &&
        c.stream.getTracks().some(t => t.readyState === 'live'));

      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(d => d.kind === 'videoinput');
      const labelsHidden = videoDevices.some(d => d.label === '');

      let firstStream: MediaStream | null = null;
      let processedFirstStream: MediaStream | null = null;
      let firstCamId = '';

      // We always need to request a stream if: labels are hidden OR we have no active streams
      if (labelsHidden || !hasActiveStream) {
        try {
          try {
            firstStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
            });
          } catch (err: any) {
            console.warn('[CameraManager] Failed to get video+audio, trying video only...', err.message);
            firstStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: false,
            });
          }
          setPermissionState('granted');
          // Re-enumerate now that we have permission (labels are now visible)
          devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(d => d.kind === 'videoinput');
          firstCamId = videoDevices.length > 0 ? `local-${videoDevices[0].deviceId}` : 'local-default';
          processedFirstStream = applyGenesisRef.current(firstCamId, firstStream);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') setPermissionState('denied');
          console.warn('[CameraManager] getUserMedia failed:', err.message);
        }
      } else {
        setPermissionState('granted');
      }

      const localCams: ManagedCamera[] = videoDevices.map((dev, idx) => {
        const id = `local-${dev.deviceId}`;
        const existing = currentLocalCams.find(c => c.id === id);

        // Keep any already-live stream alive
        if (existing && existing.stream && existing.connected &&
            existing.stream.getTracks().some(t => t.readyState === 'live')) {
          return { ...existing, label: dev.label || existing.label };
        }

        // Use the stream we just acquired
        if (firstStream && firstCamId && id === firstCamId) {
          const firstTrack = firstStream.getVideoTracks()[0];
          const firstSettings = firstTrack?.getSettings();
          const resolution = firstSettings?.width && firstSettings?.height
            ? `${firstSettings.width}x${firstSettings.height}` : undefined;
          return {
            id,
            name: idx === 0 ? 'LOCAL' : `USB ${idx}`,
            label: dev.label || `Camera ${idx + 1}`,
            color: idx === 0 ? 'from-sky-900 to-slate-900' : 'from-indigo-900 to-slate-900',
            status: 'live' as const,
            type: (idx === 0 ? 'local' : 'usb') as 'local' | 'usb',
            deviceId: dev.deviceId,
            connected: true,
            stream: processedFirstStream!,
            resolution,
          };
        }

        // Standby / secondary cameras
        return {
          id,
          name: idx === 0 ? 'LOCAL' : `USB ${idx}`,
          label: dev.label || `Camera ${idx + 1}`,
          color: idx === 0 ? 'from-sky-900 to-slate-900' : 'from-indigo-900 to-slate-900',
          status: 'standby' as const,
          type: (idx === 0 ? 'local' : 'usb') as 'local' | 'usb',
          deviceId: dev.deviceId,
          connected: false,
        };
      });

      setCameras(prev => {
        const rtcSources = prev.filter(c => c.type === 'rtc');
        return [...localCams, ...rtcSources];
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setPermissionState('denied');
      console.warn('[CameraManager] enumerate failed:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    refreshLocalDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshLocalDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshLocalDevices);
    };
  }, [refreshLocalDevices]);

  // ── Open a live stream for a local/USB camera ───────────────────────────────
  const connectLocalCamera = useCallback(async (cameraId: string) => {
    const cam = camerasRef.current.find(c => c.id === cameraId);
    if (!cam?.deviceId) { console.warn('[CameraManager] No deviceId for', cameraId); return; }
    if (cam.connected && cam.stream) return;   // already live
    if (cam.status === 'connecting') return;   // already in progress

    cam.stream?.getTracks().forEach(t => t.stop()); // release hardware first
    removeGenesisRef.current(cameraId);
    const { deviceId } = cam;

    setCameras(prev => prev.map(c =>
      c.id === cameraId ? { ...c, status: 'connecting', stream: undefined } : c
    ));

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        });
      } catch (err: any) {
        console.warn('[CameraManager] Failed to get video+audio for specific device, trying video only...', err.message);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      }
      const track = stream.getVideoTracks()[0];
      const s = track.getSettings();
      const resolution = s.width && s.height ? `${s.width}x${s.height}` : undefined;
      const processedStream = applyGenesisRef.current(cameraId, stream);
      
      setCameras(prev => prev.map(c =>
        c.id === cameraId ? { ...c, stream: processedStream, connected: true, status: 'live', resolution } : c
      ));
    } catch (err: any) {
      const msg = err?.name === 'NotReadableError'
        ? 'Camera is in use by another app or tab.'
        : err?.message ?? 'Camera error';
      console.error('[CameraManager] getUserMedia failed:', msg);
      setCameras(prev => prev.map(c =>
        c.id === cameraId ? { ...c, status: 'disconnected', connected: false, stream: undefined } : c
      ));
    }
  }, []);

  // ── Disconnect a camera ────────────────────────────────────────────────────
  const disconnectCamera = useCallback((cameraId: string) => {
    setCameras(prev => prev.map(c => {
      if (c.id !== cameraId) return c;
      c.stream?.getTracks().forEach(t => t.stop());
      removeGenesis(cameraId);
      return { ...c, stream: undefined, connected: false, status: 'standby' };
    }));
    const peer = [...rtcPeers.current.values()].find(p => `rtc-${p.peerId}` === cameraId);
    if (peer) { peer.conn.close(); rtcPeers.current.delete(peer.peerId); }
  }, []);

  // ── WebRTC: host ANSWERS an offer from a phone ─────────────────────────────
  // Phone is the offerer (sends offer first); host answers.
  // This avoids the need for host-to-phone peer discovery.
  const handleRtcOffer = useCallback(async (
    peerId: string,
    peerLabel: string,
    offerSdp: RTCSessionDescriptionInit,
    peerOrientation?: 'portrait' | 'landscape',
  ) => {
    console.log('[CameraManager] 📞 handleRtcOffer called:', { peerId, peerLabel, hasOffer: !!offerSdp });
    if (!hostId) { console.log('[CameraManager] ⚠️ No hostId, aborting'); return; }
    if (peerId === hostId) { console.log('[CameraManager] ⚠️ Self-message, aborting'); return; }
    if (rtcPeers.current.has(peerId)) { console.log('[CameraManager] ⚠️ Already handling peer', peerId); return; }

    const rtcCamId = `rtc-${peerId}`;
    console.log('[CameraManager] 🔧 Creating RTC camera entry:', rtcCamId);

    setCameras(prev => {
      if (prev.some(c => c.id === rtcCamId)) return prev;
      return [...prev, {
        id: rtcCamId, name: '📱', label: peerLabel,
        color: 'from-emerald-900 to-slate-900',
        status: 'connecting' as const, type: 'rtc' as const,
        peerId, connected: false,
        orientation: peerOrientation || 'landscape',
      }];
    });

    const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const peer: RtcPeer = { peerId, conn, iceCandidateBuffer: [], remoteDescriptionSet: false };
    rtcPeers.current.set(peerId, peer);

    // Safe ICE candidate adder — buffers until remote desc is set
    const safeAddCandidate = async (c: RTCIceCandidateInit) => {
      if (!peer.remoteDescriptionSet) { peer.iceCandidateBuffer.push(c); return; }
      try { await conn.addIceCandidate(new RTCIceCandidate(c)); } catch { /* stale */ }
    };
    (peer as any).safeAddCandidate = safeAddCandidate;

    conn.ontrack = (ev) => {
      console.log('[CameraManager] 🎥 ontrack fired! Streams:', ev.streams.length);
      const [remoteStream] = ev.streams;
      if (!remoteStream) return;
      
      const processedStream = applyGenesisRef.current(rtcCamId, remoteStream);
      peer.stream = processedStream;
      
      console.log('[CameraManager] ✅ Remote stream received — tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      setCameras(prev => prev.map(c =>
        c.id === rtcCamId ? { ...c, stream: processedStream, connected: true, status: 'live' } : c
      ));
    };

    conn.onicecandidate = async (ev) => {
      if (!ev.candidate) { console.log('[CameraManager] 🧊 ICE gathering complete'); return; }
      console.log('[CameraManager] 🧊 Sending ICE candidate to phone');
      await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: hostId, to: peerId, action: 'candidate', candidate: ev.candidate.toJSON() }),
      }).catch(console.error);
    };

    conn.oniceconnectionstatechange = () => {
      console.log('[CameraManager] 🧊 ICE connection state:', conn.iceConnectionState);
    };

    conn.onconnectionstatechange = () => {
      const s = conn.connectionState;
      console.log('[CameraManager] 🔗 Connection state:', s);
      if (s === 'disconnected' || s === 'failed' || s === 'closed') {
        setCameras(prev => prev.map(c =>
          c.id === rtcCamId ? { ...c, connected: false, status: 'disconnected', stream: undefined } : c
        ));
        rtcPeers.current.delete(peerId);
      }
    };

    // Apply phone's offer → create answer → send back
    console.log('[CameraManager] 📨 Setting remote description (phone offer)');
    await conn.setRemoteDescription(new RTCSessionDescription(offerSdp)).catch(e => console.error('[CameraManager] ❌ setRemoteDescription failed:', e));
    peer.remoteDescriptionSet = true;

    // Drain buffered candidates
    console.log('[CameraManager] 🧊 Draining', peer.iceCandidateBuffer.length, 'buffered ICE candidates');
    for (const c of [...peer.iceCandidateBuffer]) {
      try { await conn.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
    peer.iceCandidateBuffer = [];

    const answer = await conn.createAnswer();
    await conn.setLocalDescription(answer);
    console.log('[CameraManager] 📤 Sending answer SDP back to phone');
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: hostId, to: peerId, action: 'answer', sdp: answer, label: 'SanctuaryOS Host' }),
    }).catch(e => console.error('[CameraManager] ❌ Failed to send answer:', e));
    console.log('[CameraManager] ✅ Answer sent, waiting for connection...');

  }, [hostId]);

  // ── Signal polling — host reads its inbox for offers & ICE from phones ──────
  useEffect(() => {
    if (!hostId) { console.log('[CameraManager] ⏳ Waiting for hostId before polling...'); return; }
    console.log('[CameraManager] 🔄 Starting signal polling for hostId:', hostId);

    let pollCount = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/signal?peerId=${hostId}`);
        if (!res.ok) {
          console.warn('[CameraManager] ⚠️ Signal poll got status', res.status);
          return;
        }
        const data = await res.json() as any;
        const messages = data?.messages ?? [];

        pollCount++;
        // Log every 20th poll to confirm polling is alive (avoid spam)
        if (pollCount % 20 === 1) {
          console.log(`[CameraManager] 🔄 Poll #${pollCount} — ${messages.length} messages`);
        }

        if (messages.length > 0) {
          console.log('[CameraManager] 📬 Received', messages.length, 'signal messages:', messages.map((m: any) => `${m.action} from ${m.from}`));
        }

        for (const msg of messages) {
          if (msg.from === hostId) continue; // ignore self-messages

          const peer = rtcPeers.current.get(msg.from);

          if (msg.action === 'offer' && msg.sdp) {
            console.log('[CameraManager] 📞 Received OFFER from', msg.from, '— label:', msg.label, '— orientation:', msg.orientation);
            await handleRtcOffer(msg.from, msg.label || msg.from, msg.sdp, msg.orientation);
          }
          if (msg.action === 'candidate' && msg.candidate && peer) {
            console.log('[CameraManager] 🧊 Received ICE candidate from', msg.from);
            await (peer as any).safeAddCandidate?.(msg.candidate);
          }
          if (msg.action === 'orientation' && msg.orientation) {
            console.log('[CameraManager] 📐 Orientation change from', msg.from, '→', msg.orientation);
            const camId = `rtc-${msg.from}`;
            setCameras(prev => prev.map(c =>
              c.id === camId ? { ...c, orientation: msg.orientation } : c
            ));
          }
          if (msg.action === 'bye' && peer) {
            console.log('[CameraManager] 👋 Received BYE from', msg.from);
            const camId = `rtc-${msg.from}`;
            setCameras(prev => prev.filter(c => c.id !== camId));
            removeGenesis(camId);
            peer.conn.close();
            rtcPeers.current.delete(msg.from);
          }
        }
      } catch (err) {
        console.warn('[CameraManager] poll error:', err);
      }
    };

    // Run first poll immediately
    poll();
    pollTimer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [hostId, handleRtcOffer]);

  // ── Clear Disconnected Cameras ───────────────────────────────────────────────
  const clearDisconnected = useCallback(() => {
    setCameras(prev => prev.filter(c => c.status !== 'disconnected'));
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      camerasRef.current.forEach(c => c.stream?.getTracks().forEach(t => t.stop()));
      rtcPeers.current.forEach(p => p.conn.close());
      genesisEngines.current.forEach(e => e.destroy());
    };
  }, []);

  return { cameras, hostId, permissionState, isLoadingDevices, connectLocalCamera, disconnectCamera, refreshLocalDevices, clearDisconnected, isCinematicMode, setIsCinematicMode, genesisPreset, setGenesisPreset: handleSetPreset, genesisConfig, setGenesisConfig: handleSetConfig };
}
