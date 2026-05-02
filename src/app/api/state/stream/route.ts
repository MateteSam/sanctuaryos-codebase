/**
 * GET /api/state/stream
 *
 * Server-Sent Events endpoint for the Beam output client.
 * Replaces the 400ms polling loop in BeamClient.tsx.
 *
 * How it works:
 * - The Beam opens this endpoint as an EventSource
 * - When the operator pushes state (POST /api/state), broadcastStateUpdate()
 *   is called, which pushes the new state to every open SSE connection instantly
 * - A 20s heartbeat keeps proxies from dropping the connection
 * - On disconnect the browser auto-reconnects (built into EventSource)
 *
 * Cloudflare Workers note:
 * SSE works in Cloudflare Workers/Pages with the ReadableStream pattern.
 * open-next wraps this correctly. The in-process subscriber set is fine because
 * a single isolate handles all connections to the same Beam page.
 */

import { subscribe } from '@/lib/sseState';

export const dynamic = 'force-dynamic';

// ── SSE handler ────────────────────────────────────────────────────────────────
export async function GET() {
  const encoder = new TextEncoder();

  let unsub: (() => void) | null = null;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment so the browser knows the connection is open
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Register subscriber — fired whenever /api/state is POSTed
      unsub = subscribe((json: string) => {
        controller.enqueue(encoder.encode(`data: ${json}\n\n`));
      });

      // 20-second heartbeat to keep the connection alive through proxies
      heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          if (heartbeatId) clearInterval(heartbeatId);
        }
      }, 20_000);
    },

    cancel() {
      // Client disconnected — clean up
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
