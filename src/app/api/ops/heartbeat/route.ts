import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import type { OperatorStation, OperatorPresence } from '@/types/operatorTypes';

/**
 * In-memory operator presence registry.
 *
 * Stations POST a heartbeat every 5 seconds. GET returns
 * which stations are currently active (within the last 15s).
 */
const operators = new Map<OperatorStation, OperatorPresence>();
const STALE_MS = 15_000; // Consider offline after 15s without heartbeat

function pruneStale() {
  const now = Date.now();
  for (const [key, op] of operators) {
    if (now - op.lastHeartbeat > STALE_MS) {
      operators.delete(key);
    }
  }
}

// ── POST /api/ops/heartbeat ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json() as { station: OperatorStation };
    if (!body.station) {
      return NextResponse.json({ error: 'Missing station' }, { status: 400 });
    }

    const now = Date.now();
    const existing = operators.get(body.station);
    operators.set(body.station, {
      station: body.station,
      connectedAt: existing?.connectedAt ?? now,
      lastHeartbeat: now,
    });

    pruneStale();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// ── GET /api/ops/heartbeat ───────────────────────────────────────────────────
export async function GET() {
  pruneStale();
  const active: OperatorPresence[] = Array.from(operators.values());
  return NextResponse.json({ operators: active }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
