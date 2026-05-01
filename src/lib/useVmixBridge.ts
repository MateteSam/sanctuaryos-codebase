'use client';
import { useCallback, useRef } from 'react';

export interface VmixConfig {
  ip: string;      // e.g. "192.168.1.100"
  port?: number;   // default 8088
}

/**
 * Vmix HTTP API bridge.
 * Vmix exposes a REST API at http://<ip>:<port>/api/?Function=<cmd>&...
 * This hook provides a simple command sender.
 * https://www.vmix.com/help27/XMLAPI.html
 */
export function useVmixBridge(config: VmixConfig | null) {
  const base = config
    ? `http://${config.ip}:${config.port ?? 8088}/api`
    : null;

  const send = useCallback(async (fn: string, params: Record<string, string | number> = {}) => {
    if (!base) return { ok: false, error: 'No Vmix IP configured' };
    const q = new URLSearchParams({ Function: fn, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    try {
      const res = await fetch(`${base}/?${q}`, { mode: 'no-cors' });
      return { ok: true, res };
    } catch (err: any) {
      console.warn('[VmixBridge] error:', err?.message);
      return { ok: false, error: err?.message };
    }
  }, [base]);

  return {
    /** Cut to input number (1-based) */
    cut: (input: number) => send('Cut', { Input: input }),
    /** Fade to input number */
    fade: (input: number, duration = 2000) => send('Fade', { Input: input, Duration: duration }),
    /** Set a lower third title */
    setTitle: (input: number, selectedIndex: number, text: string) =>
      send('SetText', { Input: input, SelectedIndex: selectedIndex, Value: text }),
    /** Active/deactivate overlay */
    overlay: (n: 1 | 2 | 3 | 4, input: number) => send(`OverlayInput${n}`, { Value: input }),
    /** Start recording */
    startRecord: () => send('StartRecording'),
    stopRecord:  () => send('StopRecording'),
    /** Start/stop streaming */
    startStream: () => send('StartStreaming'),
    stopStream:  () => send('StopStreaming'),
    /** Generic raw command */
    send,
    /** Test connection */
    testConnection: async () => {
      if (!base) return false;
      try {
        await fetch(`${base}`, { mode: 'no-cors' });
        return true;
      } catch { return false; }
    },
  };
}
