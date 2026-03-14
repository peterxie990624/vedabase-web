import { useState, useEffect, useCallback } from 'react';
import type { BGData, SBIndex, SBCantoData, AkadasiData, CalendarData } from '../types';

// ── CDN Strategy ──────────────────────────────────────────────────────────────
// Primary: jsDelivr (GitHub CDN with China mainland nodes, fast without VPN)
// Fallback: GitHub Pages direct (original path)
//
// jsDelivr URL format:
//   https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/path/to/file
const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/peterxie990624/vedabase-web@main/client/public';
const GH_PAGES_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Cache for loaded data
const cache: Record<string, unknown> = {};

export interface LoadProgress {
  url: string;
  source: 'jsdelivr' | 'github';
  status: 'loading' | 'ok' | 'error';
  error?: string;
  durationMs?: number;
}

/**
 * 并行竞速加载策略：同时向 jsDelivr 和 GitHub Pages 发起请求，
 * 谁先成功响应就使用谁，另一个请求被取消。
 * 这样可以大幅减少等待时间，特别是在网络不稳定时。
 */
async function loadJSONParallel<T>(
  path: string,
  onProgress?: (p: LoadProgress) => void
): Promise<T> {
  // Use cache keyed by path
  if (cache[path]) return cache[path] as T;

  const jsdelivrUrl = `${JSDELIVR_BASE}${path}`;
  const ghUrl = `${GH_PAGES_BASE}${path}`;

  onProgress?.({ url: jsdelivrUrl, source: 'jsdelivr', status: 'loading' });
  onProgress?.({ url: ghUrl, source: 'github', status: 'loading' });

  const t0 = Date.now();

  // Create abort controllers for each request
  const jsdCtrl = new AbortController();
  const ghCtrl = new AbortController();

  // Race: first successful response wins
  const jsdPromise = fetch(jsdelivrUrl, { signal: jsdCtrl.signal })
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data, source: 'jsdelivr' as const, url: jsdelivrUrl };
    });

  const ghPromise = fetch(ghUrl, { signal: ghCtrl.signal })
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data, source: 'github' as const, url: ghUrl };
    });

  // Use Promise.any to get the first successful result
  try {
    const winner = await Promise.any([jsdPromise, ghPromise]);
    const durationMs = Date.now() - t0;

    // Cancel the losing request
    if (winner.source === 'jsdelivr') {
      ghCtrl.abort();
      onProgress?.({ url: ghUrl, source: 'github', status: 'error', error: 'cancelled (jsdelivr won)' });
    } else {
      jsdCtrl.abort();
      onProgress?.({ url: jsdelivrUrl, source: 'jsdelivr', status: 'error', error: 'cancelled (github won)' });
    }

    cache[path] = winner.data;
    onProgress?.({ url: winner.url, source: winner.source, status: 'ok', durationMs });
    return winner.data as T;
  } catch (aggErr) {
    // Both failed
    const durationMs = Date.now() - t0;
    onProgress?.({ url: jsdelivrUrl, source: 'jsdelivr', status: 'error', error: 'failed', durationMs });
    onProgress?.({ url: ghUrl, source: 'github', status: 'error', error: 'failed', durationMs });
    throw new Error(`Both CDN sources failed for ${path}`);
  }
}

// Keep the old sequential function as fallback (not used by default)
async function loadJSON<T>(
  path: string,
  onProgress?: (p: LoadProgress) => void
): Promise<T> {
  return loadJSONParallel<T>(path, onProgress);
}

export function useBGData(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<BGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<BGData>('/data/bg_data.json', onProgress)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSBIndex(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<SBIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<SBIndex>('/data/sb_index.json', onProgress)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSBCantoData(cantoId: number | null, onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<SBCantoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cantoId === null) return;
    setLoading(true);
    setError(null);
    loadJSON<SBCantoData>(`/data/sb/canto_${cantoId}.json`, onProgress)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [cantoId]);

  return { data, loading, error };
}

export function useAkadasiData(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<AkadasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<AkadasiData>('/data/akadasi_data.json', onProgress)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useCalendarData(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<CalendarData>('/data/calendar_data.json', onProgress)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// Preload functions
export function preloadBGData() {
  loadJSON('/data/bg_data.json').catch(() => {});
}

export function preloadSBIndex() {
  loadJSON('/data/sb_index.json').catch(() => {});
}
