import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { broadcastStateUpdate } from '@/lib/sseState';

// ── State shape ────────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  room: 'Main Auditorium',
  atmosphere: 'Deep Worship (Ocean Blue)',
  flowMode: false,
  activeSlide: null as any,
  nextSlide: null as any,
  layoutStyle: 'full_center',
  useMediaBackground: false,
  showBranding: false,
  programCamera: 'cam-local',
  previewCamera: 'cam2',
  activeOverlay: null as string | null,
  lowerThirdText: '',
  lowerThirdSub: '',
  lowerThirdStyle: 'classic',
  lowerThirdColor: '#6EC9FF',
  isLive: false,
  outputMode: 'graphics',
  activeMediaOverlays: [] as string[],
  textPosition: 'center',
  textStylePreset: 'clean_white',
  textFontSize: 'lg',
  textFontFamily: 'sans',
  autoAccept: true,
  showCamLabel: true,
  lastUpdated: Date.now(),
};

type LiveState = typeof DEFAULT_STATE;

// ── KV key ───────────────────────────────────────────────────────────────────
const STATE_KEY = 'live:state';
const STATE_TTL = 86400; // 24 hours — a service won't last longer than this

// ── KV accessor (same pattern as signal route) ────────────────────────────────
async function getKV() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ctx.env as any).SIGNAL_STORE as KVNamespace | undefined;
  } catch {
    return undefined;
  }
}

// ── In-memory fallback for local dev (single Node process = safe) ─────────────
let memState: LiveState = { ...DEFAULT_STATE };

async function readState(): Promise<LiveState> {
  const kv = await getKV();
  if (kv) {
    const raw = await kv.get(STATE_KEY);
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch { /* ignore syntax error */ }
    return { ...DEFAULT_STATE };
  }
  return memState;
}

async function writeState(patch: Partial<LiveState>): Promise<LiveState> {
  const kv = await getKV();
  const current = await readState();
  const next: LiveState = { ...current, ...patch, lastUpdated: Date.now() };
  if (kv) {
    await kv.put(STATE_KEY, JSON.stringify(next), { expirationTtl: STATE_TTL });
  } else {
    memState = next;
  }
  return next;
}

// ── GET /api/state ─────────────────────────────────────────────────────────────
export async function GET() {
  const state = await readState();
  return NextResponse.json(state, {
    headers: {
      // Never cache — always fresh for the Beam output
      'Cache-Control': 'no-store',
    },
  });
}

// ── POST /api/state ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<LiveState>;
    const next = await writeState(body);
    // Notify all SSE subscribers (Beam output clients) immediately
    broadcastStateUpdate(JSON.stringify(next));
    return NextResponse.json({ success: true, state: next });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
