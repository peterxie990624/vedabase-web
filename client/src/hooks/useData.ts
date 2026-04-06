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

  // Use Promise.race as fallback for older browsers that don't support Promise.any
  // Promise.any is not supported in Safari < 15 and older iPad versions
  try {
    // Try Promise.any first (modern browsers)
    if (Promise.any) {
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
    } else {
      // Fallback to Promise.race for older browsers
      const winner = await Promise.race([jsdPromise, ghPromise]);
      const durationMs = Date.now() - t0;

      // Cancel both requests after one succeeds
      jsdCtrl.abort();
      ghCtrl.abort();

      cache[path] = winner.data;
      onProgress?.({ url: winner.url, source: winner.source, status: 'ok', durationMs });
      return winner.data as T;
    }
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
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [onProgress]);

  return { data, loading, error };
}

export function useSBIndex(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<SBIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<SBIndex>('/data/sb_index.json', onProgress)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [onProgress]);

  return { data, loading, error };
}

export function useSBCantoData(cantoId: number | null, onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<SBCantoData | null>(null);
  const [loading, setLoading] = useState(!!cantoId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cantoId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadJSON<SBCantoData>(`/data/sb/canto_${cantoId}.json`, onProgress)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [cantoId, onProgress]);

  return { data, loading, error };
}

// 缓存多个篇的数据
const cantoDataCache: Record<number, SBCantoData> = {};
const cantoLoadingState: Record<number, boolean> = {};

export function useSBCantoDataCache() {
  const [cachedCantos, setCachedCantos] = useState<Record<number, SBCantoData>>({});

  const loadCantoData = async (cantoId: number): Promise<SBCantoData | null> => {
    // 如果已在缓存中，直接返回
    if (cantoDataCache[cantoId]) {
      return cantoDataCache[cantoId];
    }

    // 如果正在加载，等待加载完成
    if (cantoLoadingState[cantoId]) {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (cantoDataCache[cantoId]) {
            clearInterval(checkInterval);
            resolve(cantoDataCache[cantoId]);
          }
        }, 100);
        // 超时5秒
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      });
    }

    // 开始加载
    cantoLoadingState[cantoId] = true;
    try {
      const data = await loadJSON<SBCantoData>(`/data/sb/canto_${cantoId}.json`);
      cantoDataCache[cantoId] = data;
      // 更新React状态，使组件能够看到新的缓存数据
      setCachedCantos(prev => ({ ...prev, [cantoId]: data }));
      return data;
    } catch (e) {
      console.error(`Failed to load canto ${cantoId}:`, e);
      return null;
    } finally {
      cantoLoadingState[cantoId] = false;
    }
  };

  return { cachedCantos, loadCantoData };
}

export function useAkadasiData(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<AkadasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<AkadasiData>('/data/akadasi_data.json', onProgress)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [onProgress]);

  return { data, loading, error };
}

export function useCalendarData(onProgress?: (p: LoadProgress) => void) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<CalendarData>('/data/calendar_data.json', onProgress)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [onProgress]);

  return { data, loading, error };
}

// 预加载相邻篇
export function useSBPreload(cantoId: number | null, ready: boolean) {
  useEffect(() => {
    if (!ready || !cantoId) return;

    // 预加载相邻篇
    const preloadCantos = [cantoId - 1, cantoId + 1].filter(id => id > 0 && id <= 12);
    preloadCantos.forEach(id => {
      // 后台预加载，不等待
      loadJSON<SBCantoData>(`/data/sb/canto_${id}.json`).catch(() => {
        // 忽略预加载失败
      });
    });
  }, [cantoId, ready]);
}


// 预加载函数
export function preloadBGData() {
  loadJSON<BGData>('/data/bg_data.json').catch(() => {
    // 忽略预加载失败
  });
}

export function preloadSBIndex() {
  loadJSON<SBIndex>('/data/sb_index.json').catch(() => {
    // 忽略预加载失败
  });
}
