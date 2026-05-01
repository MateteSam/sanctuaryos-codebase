'use client';
import { useCallback, useRef, useState } from 'react';

export interface ObsConfig {
  url: string;      // e.g. "ws://localhost:4455"
  password?: string;
}

type ObsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * OBS WebSocket v5 bridge.
 * Docs: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
 */
export function useObsBridge(config: ObsConfig | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ObsStatus>('disconnected');
  const msgId = useRef(1);

  const send = useCallback((requestType: string, requestData: Record<string, any> = {}) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const d = {
      op: 6, // Request
      d: { requestType, requestId: String(msgId.current++), requestData },
    };
    ws.current.send(JSON.stringify(d));
  }, []);

  const connect = useCallback(async () => {
    if (!config) return;
    setStatus('connecting');
    try {
      const socket = new WebSocket(config.url);
      ws.current = socket;

      socket.onopen = () => {
        // OBS WS v5: send identify after hello
        socket.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.op === 0) {
            // Hello — send Identify
            socket.send(JSON.stringify({
              op: 1, // Identify
              d: {
                rpcVersion: 1,
                authentication: config.password || '',
                eventSubscriptions: 33,
              },
            }));
          }
          if (msg.op === 2) {
            // Identified
            setStatus('connected');
          }
        };
      };

      socket.onerror = () => setStatus('error');
      socket.onclose = () => {
        setStatus('disconnected');
        ws.current = null;
      };
    } catch {
      setStatus('error');
    }
  }, [config]);

  const disconnect = useCallback(() => {
    ws.current?.close();
    ws.current = null;
    setStatus('disconnected');
  }, []);

  return {
    status,
    connect,
    disconnect,
    isConnected: status === 'connected',
    /** Switch to a named scene */
    setScene: (sceneName: string) => send('SetCurrentProgramScene', { sceneName }),
    /** Show/hide a source */
    setSourceVisible: (sceneName: string, sourceName: string, sceneItemEnabled: boolean) =>
      send('SetSceneItemEnabled', { sceneName, sourceName, sceneItemEnabled }),
    /** Start/stop recording */
    startRecording: () => send('StartRecord'),
    stopRecording: () => send('StopRecord'),
    /** Start/stop streaming */
    startStreaming: () => send('StartStream'),
    stopStreaming: () => send('StopStream'),
    /** Trigger virtual camera */
    startVirtualCam: () => send('StartVirtualCam'),
    stopVirtualCam: () => send('StopVirtualCam'),
    /** Generic request */
    send: (requestType: string, data?: Record<string, any>) => send(requestType, data),
  };
}
