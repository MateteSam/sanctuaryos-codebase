import { NextResponse } from 'next/server';

/**
 * GET /api/bible?ref=John+3:16&translation=kjv
 *
 * Free proxy to bible-api.com — no key required.
 * Supported translations: web (default), kjv, asv, ylt, dour, emphb, webster
 *
 * Returns: { reference, text, verses, translation_name, translation_id }
 * On error: { error: string } with appropriate HTTP status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');
  const translation = searchParams.get('translation') || 'web';

  if (!ref || !ref.trim()) {
    return NextResponse.json({ error: 'Missing required parameter: ref' }, { status: 400 });
  }

  // Normalize the reference for the upstream API
  const encodedRef = encodeURIComponent(ref.trim().toLowerCase());
  const upstreamUrl = `https://bible-api.com/${encodedRef}?translation=${translation}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'Accept': 'application/json' },
      // 8-second timeout — be respectful to the free service
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // bible-api.com returns 404 for unrecognized references
      if (res.status === 404) {
        return NextResponse.json({ error: `Reference not found: "${ref}"` }, { status: 404 });
      }
      return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json() as any;

    // Shape the response consistently
    return NextResponse.json({
      reference: data.reference,
      text: (data.text as string).replace(/\n+/g, ' ').trim(),
      verses: (data.verses as any[]).map((v: any) => ({
        verse: v.verse,
        chapter: v.chapter,
        book: v.book_name,
        text: (v.text as string).replace(/\n+/g, ' ').trim(),
      })),
      translation_id: data.translation_id,
      translation_name: data.translation_name,
    }, {
      headers: {
        // Cache for 1 hour — the text never changes
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out fetching scripture' }, { status: 504 });
    }
    console.error('[Bible API proxy]', err);
    return NextResponse.json({ error: 'Failed to fetch scripture' }, { status: 500 });
  }
}
