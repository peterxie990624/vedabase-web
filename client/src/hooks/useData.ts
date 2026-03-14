import { useState, useEffect, useCallback } from 'react';
import type { BGData, SBIndex, SBCantoData, AkadasiData, CalendarData } from '../types';

// Base URL for data files - respects Vite's base path (e.g. /vedabase-web/ on GitHub Pages)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Cache for loaded data
const cache: Record<string, unknown> = {};

async function loadJSON<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  if (cache[url]) return cache[url] as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const data = await res.json();
  cache[url] = data;
  return data;
}

export function useBGData() {
  const [data, setData] = useState<BGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<BGData>('/data/bg_data.json')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSBIndex() {
  const [data, setData] = useState<SBIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<SBIndex>('/data/sb_index.json')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSBCantoData(cantoId: number | null) {
  const [data, setData] = useState<SBCantoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cantoId === null) return;
    setLoading(true);
    setError(null);
    loadJSON<SBCantoData>(`/data/sb/canto_${cantoId}.json`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [cantoId]);

  return { data, loading, error };
}

export function useAkadasiData() {
  const [data, setData] = useState<AkadasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<AkadasiData>('/data/akadasi_data.json')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useCalendarData() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<CalendarData>('/data/calendar_data.json')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// Preload all BG data
export function preloadBGData() {
  loadJSON('/data/bg_data.json').catch(() => {});
}

// Preload SB index
export function preloadSBIndex() {
  loadJSON('/data/sb_index.json').catch(() => {});
}
