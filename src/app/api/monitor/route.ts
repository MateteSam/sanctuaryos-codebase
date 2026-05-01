/**
 * GET /api/monitor
 * SSE endpoint for monitor bus state sync to mobile devices.
 * Band members connect from their phones to receive real-time mix updates.
 */

import { subscribe } from '@/lib/sseState';

export async function GET() {
  const encoder = new TextEncoder();
  let unsub: (() => void) | null = null;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': monitor-connected\n\n'));

      unsub = subscribe((json: string) => {
        try {
          const state = JSON.parse(json);
          // Only forward audio-relevant state to monitors
          const monitorState = {
            channels: state.channels,
            channelLevels: state.channelLevels,
            buses: state.buses,
            busLevels: state.busLevels,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(monitorState)}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        }
      });

      heartbeatId = setInterval(() => {
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')); }
        catch { if (heartbeatId) clearInterval(heartbeatId); }
      }, 15_000);
    },
    cancel() {
      if (unsub) unsub();
      if (heartbeatId) clearInterval(heartbeatId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
