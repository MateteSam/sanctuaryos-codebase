import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

// Lazy-init fallback for local dev — NO top-level side effects
let _localHostId: string | undefined;

function getLocalHostId(): string {
  if (!_localHostId) {
    _localHostId = `sanctuary-host-${Math.random().toString(36).slice(2, 10)}`;
  }
  return _localHostId;
}

export async function GET() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (ctx.env as any).SIGNAL_STORE as KVNamespace | undefined;

    if (kv) {
      // In production: use a stable host ID stored in KV (survives isolate restarts)
      let hostId = await kv.get('host-id');
      if (!hostId) {
        hostId = `sanctuary-host-${Math.random().toString(36).slice(2, 10)}`;
        await kv.put('host-id', hostId, { expirationTtl: 86400 }); // 24 hours
      }
      return NextResponse.json({ hostId });
    }
  } catch { /* fall through to local fallback */ }

  // Local dev fallback — stable within the same Node.js process
  return NextResponse.json({ hostId: getLocalHostId() });
}
