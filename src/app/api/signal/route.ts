import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────────────────────
type Msg = {
  from: string;
  action: 'offer' | 'answer' | 'candidate' | 'bye' | 'state' | 'cue';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  label?: string;
  payload?: any;
  timestamp: number;
};

type PeerEntry = { peerId: string; label: string; lastSeen: number };

// ── KV accessor ───────────────────────────────────────────────────────────────
async function getKV(): Promise<KVNamespace | undefined> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (ctx.env as any).SIGNAL_STORE as KVNamespace | undefined;
    return kv;
  } catch (e) {
    console.error('[signal] getKV failed:', e);
    return undefined;
  }
}

// ── Safe JSON helpers ─────────────────────────────────────────────────────────
function safeParseObject(raw: string | null): Record<string, PeerEntry> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch { /* corrupt data */ }
  return {};
}

function safeParseArray(raw: string | null): Msg[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* corrupt data */ }
  return [];
}

// ── In-memory fallback (lazy init — NO top-level side effects) ────────────────
let _memPeers: Map<string, PeerEntry> | undefined;
let _memQueues: Map<string, Msg[]> | undefined;

function getMemPeers(): Map<string, PeerEntry> {
  if (!_memPeers) _memPeers = new Map();
  return _memPeers;
}
function getMemQueues(): Map<string, Msg[]> {
  if (!_memQueues) _memQueues = new Map();
  return _memQueues;
}

function memRegister(peerId: string, label: string, now: number) {
  const peers = getMemPeers();
  peers.set(peerId, { peerId, label: peers.get(peerId)?.label ?? label, lastSeen: now });
}
function memEnqueue(to: string, msg: Msg) {
  const queues = getMemQueues();
  const q = queues.get(to) ?? [];
  q.push(msg);
  if (q.length > 50) q.splice(0, q.length - 50);
  queues.set(to, q);
}
function memDrain(peerId: string): Msg[] {
  const queues = getMemQueues();
  const q = queues.get(peerId) ?? [];
  queues.set(peerId, []);
  return q;
}
function memGetPeers(peerId: string, now: number): PeerEntry[] {
  const peers = getMemPeers();
  return [...peers.values()]
    .filter(p => p.peerId !== peerId && now - p.lastSeen < 30_000)
    .map(p => ({ peerId: p.peerId, label: p.label, lastSeen: p.lastSeen }));
}

// ─── POST /api/signal ──────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { from, to, action, sdp, candidate, label, payload } = body;

    if (!from || !to || !action) {
      return NextResponse.json({ error: 'Missing from/to/action' }, { status: 400 });
    }

    const now = Date.now();

    let kv: KVNamespace | undefined;
    try { kv = await getKV(); } catch { kv = undefined; }

    if (kv) {
      try {
        // Register sender in peer list
        const peerlistRaw = await kv.get('peerlist');
        const peerlist = safeParseObject(peerlistRaw);
        peerlist[from] = { peerId: from, label: label || from, lastSeen: now };
        await kv.put('peerlist', JSON.stringify(peerlist), { expirationTtl: 300 });

        // Append message to recipient's inbox queue
        const qRaw = await kv.get(`msg:${to}`);
        const q = safeParseArray(qRaw);
        q.push({ from, action, sdp, candidate, label, payload, timestamp: now });
        if (q.length > 50) q.splice(0, q.length - 50);
        await kv.put(`msg:${to}`, JSON.stringify(q), { expirationTtl: 120 });
      } catch (kvErr) {
        console.error('[signal] POST KV error, falling back to mem:', kvErr);
        // Fall through to in-memory
        memRegister(from, label || from, now);
        memEnqueue(to, { from, action, sdp, candidate, label, payload, timestamp: now });
      }
    } else {
      memRegister(from, label || from, now);
      memEnqueue(to, { from, action, sdp, candidate, label, payload, timestamp: now });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[signal] POST error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// ─── GET /api/signal?peerId=xxx ────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get('peerId');
    if (!peerId) {
      return NextResponse.json({ error: 'Missing peerId' }, { status: 400 });
    }

    const now = Date.now();

    let kv: KVNamespace | undefined;
    try { kv = await getKV(); } catch { kv = undefined; }

    if (kv) {
      try {
        // Update our presence in the peer list
        const peerlistRaw = await kv.get('peerlist');
        const peerlist = safeParseObject(peerlistRaw);
        peerlist[peerId] = {
          peerId,
          label: peerlist[peerId]?.label ?? peerId,
          lastSeen: now,
        };
        await kv.put('peerlist', JSON.stringify(peerlist), { expirationTtl: 300 });

        // Drain our inbox
        const qRaw = await kv.get(`msg:${peerId}`);
        const messages = safeParseArray(qRaw);
        await kv.put(`msg:${peerId}`, JSON.stringify([]), { expirationTtl: 120 });

        // Build remote peers list (exclude self + stale > 30s)
        const remotePeers = Object.values(peerlist)
          .filter(p => p.peerId !== peerId && now - p.lastSeen < 30_000)
          .map(p => ({ peerId: p.peerId, label: p.label, lastSeen: p.lastSeen }));

        return NextResponse.json({ messages, remotePeers });
      } catch (kvErr) {
        console.error('[signal] GET KV error, falling back to mem:', kvErr);
        // Fall through to in-memory below
      }
    }

    // In-memory fallback (local dev or KV failure)
    memRegister(peerId, peerId, now);
    const messages = memDrain(peerId);
    const remotePeers = memGetPeers(peerId, now);
    return NextResponse.json({ messages, remotePeers });

  } catch (err) {
    console.error('[signal] GET error:', err);
    return NextResponse.json({ messages: [], remotePeers: [] });
  }
}
