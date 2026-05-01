'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BibleApiVerse {
  verse: number;
  chapter: number;
  book: string;
  text: string;
}

export interface BibleApiResult {
  reference: string;
  text: string;         // Full joined text of all verses
  verses: BibleApiVerse[];
  translation_id: string;
  translation_name: string;
}

export type BibleTranslation = 'web' | 'kjv' | 'asv' | 'ylt' | 'dour' | 'emphb' | 'webster';

export const TRANSLATIONS: { id: BibleTranslation; label: string; full: string }[] = [
  { id: 'web',     label: 'WEB',      full: 'World English Bible' },
  { id: 'kjv',     label: 'KJV',      full: 'King James Version' },
  { id: 'asv',     label: 'ASV',      full: 'American Standard' },
  { id: 'ylt',     label: 'YLT',      full: "Young's Literal Translation" },
  { id: 'dour',    label: 'DOUAY',    full: 'Douay-Rheims' },
  { id: 'emphb',   label: 'EMPH',     full: 'Emphasized Bible' },
  { id: 'webster', label: 'WEBSTER',  full: 'Webster Bible' },
];

// ── In-memory cache ────────────────────────────────────────────────────────────
// key: "john 3:16::kjv" → result
const verseCache = new Map<string, BibleApiResult>();

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBibleApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BibleApiResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Fetch any Bible reference. Returns the result AND sets lastResult.
   *
   * Examples:
   *   fetchVerse('John 3:16')
   *   fetchVerse('Psalm 23:1-3', 'kjv')
   *   fetchVerse('Romans 8:28-39', 'web')
   */
  const fetchVerse = useCallback(async (
    ref: string,
    translation: BibleTranslation = 'web',
  ): Promise<BibleApiResult | null> => {
    if (!ref.trim()) return null;

    const cacheKey = `${ref.toLowerCase().trim()}::${translation}`;
    const cached = verseCache.get(cacheKey);
    if (cached) {
      setLastResult(cached);
      setError(null);
      return cached;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ ref: ref.trim(), translation });
      const res = await fetch(`/api/bible?${params}`, {
        signal: abortRef.current.signal,
      });

      const data = await res.json() as any;

      if (!res.ok) {
        const msg = (data as any).error || `Error ${res.status}`;
        setError(msg);
        setIsLoading(false);
        return null;
      }

      const result = data as BibleApiResult;
      verseCache.set(cacheKey, result);
      setLastResult(result);
      setIsLoading(false);
      return result;

    } catch (err: any) {
      if (err?.name === 'AbortError') return null; // cancelled — not an error
      const msg = err?.message || 'Failed to fetch verse';
      setError(msg);
      setIsLoading(false);
      return null;
    }
  }, []);

  /** Clear the last result (e.g. when closing a panel) */
  const clearResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return { fetchVerse, isLoading, error, lastResult, clearResult };
}
