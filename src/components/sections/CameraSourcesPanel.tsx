'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Smartphone, Camera, AlertCircle, CheckCircle2, X,
  RefreshCw, QrCode, Link2, Loader2, Usb, Monitor, Signal, Film, SlidersHorizontal
} from 'lucide-react';
import { type ManagedCamera } from '@/lib/useCameraManager';
import { GENESIS_PRESETS, GENESIS_DEFAULT_CONFIG, type GenesisConfig } from '@/lib/GenesisEngine';

// ── Tiny inline QR code renderer using the free QR Server API ────────────────
function QrCodeImage({ url, size = 180 }: { url: string; size?: number }) {
  const encoded = encodeURIComponent(url);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=0a0f1a&color=6EC9FF&margin=16`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-2xl border border-white/10"
    />
  );
}

// ── Small live-video thumbnail ─────────────────────────────────────────────────
function VideoThumb({ stream, label, type }: { stream?: MediaStream; label: string; type: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream && type !== 'usb-audio') {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream, type]);

  if (type === 'usb-audio') {
    return (
      <div className="w-16 h-10 rounded-lg bg-slate-900 border border-purple-500/40 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1 bg-purple-400 rounded-full ${stream ? 'animate-pulse' : 'opacity-30'}`} style={{ height: stream ? 12 + Math.random() * 12 : 4, animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="w-16 h-10 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center">
        <Camera className="w-4 h-4 text-slate-700" />
      </div>
    );
  }
  return (
    <video
      ref={ref}
      autoPlay muted playsInline
      className="w-16 h-10 rounded-lg object-cover border border-emerald-500/40"
    />
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    local:       { icon: <Monitor className="w-2.5 h-2.5" />, label: 'LOCAL',   cls: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
    usb:         { icon: <Usb className="w-2.5 h-2.5" />,    label: 'USB',     cls: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
    'usb-audio': { icon: <Usb className="w-2.5 h-2.5" />,    label: 'USB AUDIO',cls: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
    rtc:         { icon: <Wifi className="w-2.5 h-2.5" />,   label: 'WIFI',    cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    placeholder: { icon: <Signal className="w-2.5 h-2.5" />, label: 'EMPTY',   cls: 'text-slate-600 bg-slate-800 border-slate-700' },
  };
  const cfg = map[type] ?? map.placeholder;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  cameras: ManagedCamera[];
  hostId: string | null;
  permissionState: 'unknown' | 'granted' | 'denied';
  isLoadingDevices: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onRefresh: () => void;
  onClose: () => void;
  onClearDisconnected: () => void;
  isCinematicMode: boolean;
  setIsCinematicMode: (v: boolean) => void;
  genesisPreset: string;
  setGenesisPreset: (v: string) => void;
  genesisConfig: GenesisConfig;
  setGenesisConfig: (v: Partial<GenesisConfig>) => void;
}

export function CameraSourcesPanel({
  cameras, hostId, permissionState, isLoadingDevices,
  onConnect, onDisconnect, onRefresh, onClose, onClearDisconnected,
  isCinematicMode, setIsCinematicMode,
  genesisPreset, setGenesisPreset, genesisConfig, setGenesisConfig
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);



  // Build the pairing URL from the current page's origin.
  // On Cloudflare: https://sanctuaryos.gtmediatech444.workers.dev
  // On localhost:  http://localhost:3002
  // This replaces the old local-IP detection which was unreliable.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pairingUrl = hostId && origin
    ? `${origin}/camera-client?hostId=${hostId}`
    : null;

  const copyUrl = () => {
    if (!pairingUrl) return;
    navigator.clipboard.writeText(pairingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };


  const connectedCount = cameras.filter(c => c.connected).length;
  const phoneCount = cameras.filter(c => c.type === 'rtc' && c.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/10 bg-[#080c14] shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">Camera Sources</h3>
            <p className="text-[10px] text-slate-500">
              {connectedCount} active · {phoneCount} via WiFi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cameras.some(c => c.status === 'disconnected') && (
            <button
              onClick={onClearDisconnected}
              className="px-2.5 py-1 rounded-lg border border-red-500/30 text-[9px] uppercase font-black tracking-widest text-red-400 hover:bg-red-500/10 transition"
              title="Clear disconnected cameras"
            >
              Clear Stale
            </button>
          )}
          <div className="flex items-center gap-2">
             <Film className="w-4 h-4 text-purple-400" />
             <span className="text-[9px] font-black uppercase tracking-widest text-purple-300">Genesis II</span>
             <span className="text-[8px] font-mono text-slate-600 ml-1">{GENESIS_PRESETS[genesisPreset]?.label || (genesisPreset === 'custom' ? 'Custom' : 'Off')}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoadingDevices}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition disabled:opacity-40"
            title="Re-scan devices"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDevices ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:divide-x lg:divide-white/[0.05]">

        {/* ── Left: Camera list ──────────────────────────────────────────────── */}
        <div className="flex-1 p-4 space-y-2 min-w-0">

          {/* Permission warning */}
          {permissionState === 'denied' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              <p className="text-xs leading-5">
                Camera permission was denied. Please allow camera access in your browser settings and click <strong>re-scan</strong>.
              </p>
            </div>
          )}

          {/* Loading */}
          {isLoadingDevices && (
            <div className="flex items-center gap-2 px-3 py-2 text-slate-500 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Scanning devices…
            </div>
          )}

          {/* Camera rows */}
          {cameras.map(cam => (
            <motion.div
              key={cam.id}
              layout
              className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all group"
            >
              <VideoThumb stream={cam.stream} label={cam.label} type={cam.type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-200 truncate">{cam.label}</span>
                  <TypeBadge type={cam.type} />
                  {cam.connected && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  {cam.resolution && <span>{cam.resolution}</span>}
                  {cam.latency !== undefined && <span>{cam.latency}ms</span>}
                  {cam.status === 'connecting' && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Connecting…
                    </span>
                  )}
                  {cam.status === 'disconnected' && (
                    <span className="text-red-400">Disconnected</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                {cam.connected ? (
                  <button
                    onClick={() => onDisconnect(cam.id)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                  >
                    Disconnect
                  </button>
                ) : cam.type !== 'placeholder' && cam.type !== 'rtc' ? (
                  <button
                    onClick={() => onConnect(cam.id)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition"
                  >
                    Connect
                  </button>
                ) : null}
              </div>
            </motion.div>
          ))}

          {cameras.length === 0 && !isLoadingDevices && (
            <div className="text-center py-8 text-slate-700 text-xs">
              No camera sources found. Grant camera permission and press re-scan.
            </div>
          )}
        </div>

        {/* ── Center: GENESIS II Color Science ─────────────────────────────── */}
        <div className="lg:w-80 p-5 space-y-4 shrink-0 lg:border-r lg:border-white/[0.05]">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <Film className="w-3 h-3" /> Genesis II Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GENESIS_PRESETS).map(([id, preset]) => (
                <button
                  key={id}
                  onClick={() => setGenesisPreset(id)}
                  className={`flex flex-col p-2.5 rounded-xl border transition-all text-left ${
                    genesisPreset === id
                      ? 'bg-purple-500/15 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wide ${
                    genesisPreset === id ? 'text-purple-300' : 'text-slate-400'
                  }`}>{preset.label}</span>
                  <span className="text-[8px] text-slate-600 leading-tight mt-0.5">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fine-Tune Sliders */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-3 h-3" /> Fine-Tune
              {genesisPreset === 'custom' && <span className="text-[7px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">CUSTOM</span>}
            </h4>
            <div className="space-y-3">
              {[
                { key: 'exposure' as const,    label: 'Exposure',    min: -2,  max: 2,   step: 0.05 },
                { key: 'contrast' as const,    label: 'Contrast',    min: 0.5, max: 2,   step: 0.05 },
                { key: 'clarity' as const,     label: 'Clarity',     min: 0,   max: 2,   step: 0.05 },
                { key: 'vibrance' as const,    label: 'Vibrance',    min: 0,   max: 2,   step: 0.05 },
                { key: 'temperature' as const, label: 'Temperature', min: -1,  max: 1,   step: 0.05 },
                { key: 'vignette' as const,    label: 'Vignette',    min: 0,   max: 1,   step: 0.05 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 w-20 shrink-0">{label}</span>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={genesisConfig[key]}
                    onChange={e => setGenesisConfig({ [key]: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500 w-10 text-right">
                    {genesisConfig[key] > 0 && key !== 'contrast' && key !== 'clarity' && key !== 'vibrance' && key !== 'vignette' ? '+' : ''}{genesisConfig[key].toFixed(2)}
                  </span>
                </div>
              ))}
              {/* Film Stock selector */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 w-20 shrink-0">Film Stock</span>
                <div className="flex gap-1.5 flex-1">
                  {[
                    { v: 0, label: 'None' },
                    { v: 1, label: 'Portra' },
                    { v: 2, label: 'Cine' },
                    { v: 3, label: 'Koda' },
                  ].map(({ v, label: l }) => (
                    <button key={v} onClick={() => setGenesisConfig({ filmStock: v })}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                        genesisConfig.filmStock === v
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-white/[0.03] text-slate-600 border border-white/[0.06] hover:text-slate-400'
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>
              {/* Reset */}
              <button
                onClick={() => setGenesisPreset('off')}
                className="w-full py-2 rounded-xl border border-white/[0.06] text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white hover:bg-white/5 transition-all mt-1"
              >Reset to Raw</button>
            </div>
          </div>
        </div>

        {/* ── Right: WiFi Phone Pairing ──────────────────────────────────────── */}
        <div className="lg:w-72 p-5 space-y-4 shrink-0">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
              <Smartphone className="w-3 h-3" /> Add Phone Camera
            </h4>
            <p className="text-[11px] text-slate-600 leading-5">
              Connect any phone or tablet on the same WiFi. No app needed — just open the link in their browser.
            </p>
          </div>

          {/* QR toggle */}
          <button
            onClick={() => setShowQr(v => !v)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-black uppercase tracking-widest transition-all ${
              showQr
                ? 'border-sky-400/50 bg-sky-400/10 text-sky-300'
                : 'border-dashed border-sky-500/30 bg-sky-500/5 text-sky-500 hover:bg-sky-500/10'
            }`}
          >
            <QrCode className="w-4 h-4" />
            {showQr ? 'Hide QR Code' : 'Show QR Code'}
          </button>

          <AnimatePresence>
            {showQr && pairingUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col items-center gap-4 p-4 rounded-2xl border border-white/10 bg-slate-950/60">
                  <QrCodeImage url={pairingUrl} size={160} />

                  <div className="w-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Pairing URL</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-mono text-slate-400 truncate flex-1 bg-slate-900 px-2 py-1.5 rounded-lg border border-white/5">
                        {pairingUrl}
                      </p>
                      <button
                        onClick={copyUrl}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        title="Copy URL"
                      >
                        {copied
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <Link2 className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  {/* HTTPS notice */}
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-400 text-xs mt-0.5">⚠</span>
                    <p className="text-[10px] text-amber-300/80 leading-4">
                      Phones need <strong>HTTPS</strong> for camera access. On Chrome Android, enable{' '}
                      <span className="font-mono">chrome://flags → Insecure origins treated as secure</span>{' '}
                      and add this URL, then relaunch.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status of phone connections */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Connected Phones ({phoneCount})
            </p>
            {cameras.filter(c => c.type === 'rtc').length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/5 text-slate-700 text-[10px]">
                <Wifi className="w-4 h-4" />
                Waiting for phone to connect…
              </div>
            ) : (
              cameras.filter(c => c.type === 'rtc').map(cam => (
                <div key={cam.id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{cam.label}</p>
                    <p className="text-[9px] text-emerald-500/70">{cam.connected ? 'Streaming' : cam.status}</p>
                  </div>
                  {cam.connected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
              ))
            )}
          </div>

          {/* Tips */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Requirements</p>
            <ul className="text-[10px] text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                Same WiFi network as this device
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                Phone browser with camera permission
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                No app install required
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
