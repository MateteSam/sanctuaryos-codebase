/**
 * Shared in-process SSE subscriber registry.
 *
 * Keeping this in a separate module (outside the route files) avoids
 * the Next.js type-checker error that fires when a route exports anything
 * other than HTTP method handlers or the standard Next.js route config
 * exports.
 */

type Subscriber = (json: string) => void;
const subscribers = new Set<Subscriber>();

/**
 * Register a new SSE subscriber.  Called by the GET /api/state/stream handler.
 * Returns an unsubscribe function for cleanup on disconnect.
 */
export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Broadcast a new state JSON string to all connected Beam clients.
 * Called by POST /api/state after writing to KV.
 */
export function broadcastStateUpdate(stateJson: string): void {
  const dead: Subscriber[] = [];
  for (const sub of subscribers) {
    try {
      sub(stateJson);
    } catch {
      dead.push(sub);
    }
  }
  for (const d of dead) subscribers.delete(d);
}
