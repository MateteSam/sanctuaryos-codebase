'use client';

/**
 * useStationSync — Shared SSE sync hook for operator stations.
 *
 * Provides real-time two-way state synchronization between
 * any number of operator stations via SSE + POST /api/state.
 *
 * Each station subscribes to the SSE stream and gets live updates
 * from all other stations. Changes are pushed via debounced POST.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { OperatorStation } from '@/types/operatorTypes';

export interface LiveState {
  room: string;
  atmosphere: string;
  flowMode: boolean;
  activeSlide: any;
  nextSlide: any;
  layoutStyle: string;
  useMediaBackground: boolean;
  showBranding: boolean;
  programCamera: string;
  previewCamera: string;
  activeOverlay: string | null;
  lowerThirdText: string;
  lowerThirdSub: string;
  lowerThirdStyle: string;
  lowerThirdColor: string;
  isLive: boolean;
  outputMode: string;
  activeMediaOverlays: string[];
  textPosition: string;
  textStylePreset: string;
  textFontSize: string;
  textFontFamily: string;
  lastUpdated: number;
  [key: string]: any;
}

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting';

interface UseStationSyncReturn {
  liveState: LiveState | null;
  connStatus: ConnectionStatus;
  pushState: (patch: Partial<LiveState>) => void;
}

export function useStationSync(station: OperatorStation): UseStationSyncReturn {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting');

  // ── Debounced push (same pattern as BroadcastShell) ──────────────────────
  const pendingPatch = useRef<Record<string, any>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPatch = useCallback(() => {
    const patch = pendingPatch.current;
    if (!Object.keys(patch).length) return;
    pendingPatch.current = {};
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(console.error);
  }, []);

  const pushState = useCallback((patch: Partial<LiveState>) => {
    Object.assign(pendingPatch.current, patch);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flushPatch, 80);
  }, [flushPatch]);

  // ── SSE subscription ────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      setConnStatus('connecting');
      es = new EventSource('/api/state/stream');

      es.onopen = () => {
        setConnStatus('live');
        // Fetch current state immediately on connect
        fetch('/api/state')
          .then(r => r.json())
          .then(d => setLiveState(d as LiveState))
          .catch(console.error);
      };

      es.onmessage = (event) => {
        try {
          setLiveState(JSON.parse(event.data) as LiveState);
        } catch { /* malformed — ignore */ }
      };

      es.onerror = () => {
        setConnStatus('reconnecting');
        es.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // ── Heartbeat for operator presence ─────────────────────────────────────
  useEffect(() => {
    const beat = () => {
      fetch('/api/ops/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station }),
      }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 5000);
    return () => clearInterval(id);
  }, [station]);

  return { liveState, connStatus, pushState };
}
