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

// Detect if jsDelivr is reachable (cached result)
let jsDelivrAvailable: boolean | null = null;

async function checkJsDelivr(): Promise<boolean> {
  if (jsDelivrAvailable !== null) return jsDelivrAvailable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `${JSDELIVR_BASE}/data/calendar_data.json`,
      { signal: ctrl.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    jsDelivrAvailable = res.ok;
  } catch {
    jsDelivrAvailable = false;
  }
  return jsDelivrAvailable;
}

export interface LoadProgress {
  url: string;
  source: 'jsdelivr' | 'github';
  status: 'loading' | 'ok' | 'error';
  error?: string;
  durationMs?: number;
}

async function loadJSON<T>(
  path: string,
  onProgress?: (p: LoadProgress) => void
): Promise<T> {
  // Try jsDelivr first
  const jsdelivrUrl = `${JSDELIVR_BASE}${path}`;
  const ghUrl = `${GH_PAGES_BASE}${path}`;

  // Use cache keyed by path
  if (cache[path]) return cache[path] as T;

  const useJsdelivr = await checkJsDelivr();
  const primaryUrl = useJsdelivr ? jsdelivrUrl : ghUrl;
  const primarySource: 'jsdelivr' | 'github' = useJsdelivr ? 'jsdelivr' : 'github';

  onProgress?.({ url: primaryUrl, source: primarySource, status: 'loading' });
  const t0 = Date.now();

  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[path] = data;
    onProgress?.({ url: primaryUrl, source: primarySource, status: 'ok', durationMs: Date.now() - t0 });
    return data;
  } catch (e1) {
    const msg1 = e1 instanceof Error ? e1.message : String(e1);
    onProgress?.({ url: primaryUrl, source: primarySource, status: 'error', error: msg1 });

    // Fallback to the other source
    if (useJsdelivr) {
      onProgress?.({ url: ghUrl, source: 'github', status: 'loading' });
      const t1 = Date.now();
      try {
        const res2 = await fetch(ghUrl);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
        const data2 = await res2.json();
        cache[path] = data2;
        onProgress?.({ url: ghUrl, source: 'github', status: 'ok', durationMs: Date.now() - t1 });
        return data2;
      } catch (e2) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        onProgress?.({ url: ghUrl, source: 'github', status: 'error', error: msg2 });
        throw new Error(`Both CDN failed.\njsDelivr: ${msg1}\nGitHub: ${msg2}`);
      }
    }

    throw new Error(`Failed to load ${primaryUrl}: ${msg1}`);
  }
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
