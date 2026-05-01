'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CheckCircle2, XCircle, Loader2, Tv2, Monitor, Settings2 } from 'lucide-react';
import { useVmixBridge } from '@/lib/useVmixBridge';
import { useObsBridge } from '@/lib/useObsBridge';

interface IntegrationPanelProps {
  accentColor: string;
}

export function IntegrationPanel({ accentColor }: IntegrationPanelProps) {
  // Vmix
  const [vmixEnabled, setVmixEnabled] = useState(false);
  const [vmixIp, setVmixIp] = useState('192.168.1.100');
  const [vmixPort, setVmixPort] = useState('8088');
  const [vmixStatus, setVmixStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [vmixTesting, setVmixTesting] = useState(false);
  const vmix = useVmixBridge(vmixEnabled ? { ip: vmixIp, port: +vmixPort } : null);

  // OBS
  const [obsEnabled, setObsEnabled] = useState(false);
  const [obsUrl, setObsUrl] = useState('ws://localhost:4455');
  const [obsPassword, setObsPassword] = useState('');
  const obs = useObsBridge(obsEnabled ? { url: obsUrl, password: obsPassword } : null);

  const testVmix = async () => {
    setVmixTesting(true);
    setVmixStatus('idle');
    const ok = await vmix.testConnection();
    setVmixStatus(ok ? 'ok' : 'error');
    setVmixTesting(false);
  };

  const toggleObs = async () => {
    if (obs.isConnected) {
      obs.disconnect();
    } else {
      setObsEnabled(true);
      obs.connect();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

      {/* VMIX */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Tv2 className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-black text-white uppercase tracking-widest">Vmix Bridge</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-slate-500 font-black uppercase">HTTP API</span>
          </div>
          <button onClick={() => setVmixEnabled(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-all ${vmixEnabled ? 'bg-green-500/30' : 'bg-white/10'}`}>
            <motion.div animate={{ x: vmixEnabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-colors ${vmixEnabled ? 'bg-green-400' : 'bg-slate-600'}`} />
          </button>
        </div>

        <AnimatePresence>
          {vmixEnabled && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-500">SanctuaryOS sends HTTP commands to Vmix on your network. Vmix must be running with its Web Controller enabled.</p>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">Vmix IP Address</label>
                    <input value={vmixIp} onChange={e => setVmixIp(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-atmos" />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">Port</label>
                    <input value={vmixPort} onChange={e => setVmixPort(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-atmos" />
                  </div>
                </div>

                <button onClick={testVmix} disabled={vmixTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition disabled:opacity-50">
                  {vmixTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  Test Connection
                </button>

                {vmixStatus !== 'idle' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black ${vmixStatus === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {vmixStatus === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {vmixStatus === 'ok' ? 'Vmix reachable — bridge active' : 'Could not reach Vmix. Check IP, port, and that Web Controller is enabled in Vmix.'}
                  </motion.div>
                )}

                {vmixStatus === 'ok' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Cut Input 1', fn: () => vmix.cut(1) },
                      { label: 'Cut Input 2', fn: () => vmix.cut(2) },
                      { label: 'Start Stream', fn: () => vmix.startStream() },
                      { label: 'Start Record', fn: () => vmix.startRecord() },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.fn}
                        className="py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition">
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-slate-700 space-y-0.5">
                  <p>Enable in Vmix: Settings → Web Controller → Enable Web Controller</p>
                  <p>Default port for Vmix Web Controller is 8088.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OBS */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-black text-white uppercase tracking-widest">OBS WebSocket</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-slate-500 font-black uppercase">WS v5</span>
            {obs.isConnected && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-black uppercase">
                Connected
              </motion.span>
            )}
          </div>
          <button onClick={() => setObsEnabled(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-all ${obsEnabled ? 'bg-green-500/30' : 'bg-white/10'}`}>
            <motion.div animate={{ x: obsEnabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-colors ${obsEnabled ? 'bg-green-400' : 'bg-slate-600'}`} />
          </button>
        </div>

        <AnimatePresence>
          {obsEnabled && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-500">Connects to OBS via WebSocket v5 (built-in since OBS 28). Enable it in OBS: Tools → WebSocket Server Settings.</p>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">WebSocket URL</label>
                  <input value={obsUrl} onChange={e => setObsUrl(e.target.value)}
                    placeholder="ws://localhost:4455"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-atmos" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">Password (if set)</label>
                  <input type="password" value={obsPassword} onChange={e => setObsPassword(e.target.value)}
                    placeholder="Leave blank if not set"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-atmos" />
                </div>

                <button onClick={toggleObs}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                    obs.isConnected
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}>
                  {obs.status === 'connecting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  {obs.isConnected ? 'Disconnect' : obs.status === 'connecting' ? 'Connecting…' : 'Connect to OBS'}
                </button>

                {obs.status === 'error' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black">
                    <XCircle className="w-4 h-4" /> Could not connect. Check OBS is open and WebSocket is enabled.
                  </div>
                )}

                {obs.isConnected && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Start Stream',   fn: () => obs.startStreaming() },
                      { label: 'Stop Stream',    fn: () => obs.stopStreaming() },
                      { label: 'Start Record',   fn: () => obs.startRecording() },
                      { label: 'Stop Record',    fn: () => obs.stopRecording() },
                      { label: 'Start VirtCam',  fn: () => obs.startVirtualCam() },
                      { label: 'Stop VirtCam',   fn: () => obs.stopVirtualCam() },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.fn}
                        className="py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition">
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-black text-white uppercase tracking-widest">Keyboard Shortcuts</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ['→ / PageDown', 'Next Slide'],
              ['← / PageUp', 'Prev Slide'],
              ['Space', 'Cut'],
              ['Shift+Enter', 'Toggle Live'],
              ['B', 'Black Screen'],
              ['C', 'Clear Overlays'],
              ['L', 'Lower Third'],
              ['K', 'Countdown'],
              ['Esc', 'Break / Standby'],
              ['1 – 9', 'Atmosphere Preset'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[9px] font-mono text-slate-400 shrink-0">{key}</kbd>
                <span className="text-[9px] text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
