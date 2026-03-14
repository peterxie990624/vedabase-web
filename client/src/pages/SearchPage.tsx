// SearchPage — 搜索页面
// Features: 历史搜索记录（localStorage）、搜索状态持久化、关键词位置截取预览、右上角编辑删除历史
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, ChevronRight, Edit2, Trash2, Check } from 'lucide-react';
import { useBGData, useSBIndex, useSBCantoData } from '../hooks/useData';
import type { Language, VedaTheme } from '../types';

// ---- Types ----
export interface SearchResult {
  bookType: 'bg' | 'sb';
  chapterId: number;
  sectionIndex: number;
  sectionId: string;
  label: string;
  preview: string;
}

export interface SearchState {
  query: string;
  selectedBook: 'bg' | 'sb';
  results: SearchResult[];
  searched: boolean;
}

interface SearchPageProps {
  onOpenResult: (result: SearchResult) => void;
  language: Language;
  searchState?: SearchState;
  onSearchStateChange?: (state: SearchState) => void;
  theme?: VedaTheme;
}

const BOOK_OPTIONS = [
  { id: 'bg', label: '博伽梵歌' },
  { id: 'sb', label: '博伽瓦谭' },
];

const HISTORY_KEY = 'veda_search_history';
const MAX_HISTORY = 20;

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveHistory(history: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addToHistory(query: string) {
  const h = getHistory().filter(q => q !== query);
  h.unshift(query);
  saveHistory(h.slice(0, MAX_HISTORY));
}

// Extract preview snippet centered around keyword
function extractPreview(text: string, keyword: string, maxLen = 100): string {
  const clean = text.replace(/<[^>]+>/g, '').trim();
  if (!keyword) return clean.slice(0, maxLen);
  const lower = clean.toLowerCase();
  const kwLower = keyword.toLowerCase();
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return clean.slice(0, maxLen);
  // Center the snippet around the keyword
  const halfLen = Math.floor((maxLen - keyword.length) / 2);
  const start = Math.max(0, idx - halfLen);
  const end = Math.min(clean.length, idx + keyword.length + halfLen);
  let snippet = clean.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < clean.length) snippet = snippet + '...';
  return snippet;
}

function highlightText(text: string, keyword: string): string {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), match => `<mark class="search-highlight">${match}</mark>`);
}

export default function SearchPage({
  onOpenResult,
  language,
  searchState,
  onSearchStateChange,
  theme = 'light',
}: SearchPageProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#0f1923' : '#f5f7fa';
  const navBg = isDark ? '#1a2535' : '#ffffff';
  const navBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const textPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const textSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const cardBg = isDark ? '#1a2535' : '#ffffff';
  const inputBg = isDark ? '#1a2535' : '#ffffff';
  const inputBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const resultTextColor = isDark ? '#c0d0e0' : '#444';
  const labelColor = isDark ? '#6aacdc' : '#2e6fa0';

  // Use persistent state from parent if provided, otherwise local state
  const [localSelectedBook, setLocalSelectedBook] = useState<'bg' | 'sb'>(searchState?.selectedBook || 'bg');
  const [localQuery, setLocalQuery] = useState(searchState?.query || '');
  const [localResults, setLocalResults] = useState<SearchResult[]>(searchState?.results || []);
  const [localSearched, setLocalSearched] = useState(searchState?.searched || false);

  const selectedBook = searchState ? searchState.selectedBook : localSelectedBook;
  const query = searchState ? searchState.query : localQuery;
  const results = searchState ? searchState.results : localResults;
  const searched = searchState ? searchState.searched : localSearched;

  const updateState = useCallback((updates: Partial<SearchState>) => {
    const newState: SearchState = {
      query: updates.query !== undefined ? updates.query : query,
      selectedBook: updates.selectedBook !== undefined ? updates.selectedBook : selectedBook,
      results: updates.results !== undefined ? updates.results : results,
      searched: updates.searched !== undefined ? updates.searched : searched,
    };
    if (onSearchStateChange) {
      onSearchStateChange(newState);
    } else {
      if (updates.query !== undefined) setLocalQuery(updates.query);
      if (updates.selectedBook !== undefined) setLocalSelectedBook(updates.selectedBook as 'bg' | 'sb');
      if (updates.results !== undefined) setLocalResults(updates.results);
      if (updates.searched !== undefined) setLocalSearched(updates.searched);
    }
  }, [query, selectedBook, results, searched, onSearchStateChange]);

  const [searching, setSearching] = useState(false);
  const [sbLoading, setSbLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [editMode, setEditMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const sbAllSectionsRef = useRef<Record<string, unknown>>({});

  const { data: bgData } = useBGData();
  const { data: sbIndex } = useSBIndex();

  const loadAllSBForSearch = useCallback(async () => {
    if (Object.keys(sbAllSectionsRef.current).length > 0) return sbAllSectionsRef.current;
    setSbLoading(true);
    try {
      for (let i = 1; i <= 12; i++) {
        const base = import.meta.env.BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/data/sb/canto_${i}.json`);
        const data = await res.json();
        Object.assign(sbAllSectionsRef.current, data.sections);
      }
    } catch (e) {
      console.error('Failed to load SB data for search', e);
    }
    setSbLoading(false);
    return sbAllSectionsRef.current;
  }, []);

  const doSearch = useCallback(async (q: string, book?: 'bg' | 'sb') => {
    const searchBook = book || selectedBook;
    if (!q.trim()) return;
    setSearching(true);
    updateState({ query: q, selectedBook: searchBook, searched: true });
    addToHistory(q.trim());
    setHistory(getHistory());
    const keyword = q.trim().toLowerCase();
    const found: SearchResult[] = [];

    if (searchBook === 'bg' && bgData) {
      for (const [chIdStr, sections] of Object.entries(bgData.sections)) {
        const chId = parseInt(chIdStr);
        (sections as Array<{
          id: number; section_id: string | number;
          yw_zh: string | null; yw_en: string | null;
          yz_zh: string | null; yz_en: string | null;
          words_zh_fc: string | null; words_en_fc: string | null;
        }>).forEach((section, idx) => {
          const searchText = [
            section.yw_zh, section.yw_en, section.yz_zh, section.yz_en,
            section.words_zh_fc, section.words_en_fc,
          ].filter(Boolean).join(' ').toLowerCase();

          if (searchText.includes(keyword)) {
            const rawPreview = language === 'zh'
              ? (section.yw_zh || section.yz_zh || section.yw_en || '')
              : (section.yw_en || section.yz_en || '');
            const preview = extractPreview(rawPreview, q.trim(), 100);
            found.push({
              bookType: 'bg',
              chapterId: chId,
              sectionIndex: idx,
              sectionId: String(section.section_id),
              label: `BG ${section.section_id}`,
              preview,
            });
          }
        });
      }
    } else if (searchBook === 'sb') {
      const allSections = await loadAllSBForSearch() as Record<string, Array<{
        id: number; section_id: string;
        yw_zh: string | null; yw_en: string | null;
        yz_zh: string | null; yz_en: string | null;
        words_zh_fc: string | null; words_en_fc: string | null;
      }>>;
      if (sbIndex) {
        for (const chapter of sbIndex.chapters) {
          const sections = allSections[String(chapter.id)] || [];
          sections.forEach((section, idx) => {
            const searchText = [
              section.yw_zh, section.yw_en, section.yz_zh, section.yz_en,
              section.words_zh_fc, section.words_en_fc,
            ].filter(Boolean).join(' ').toLowerCase();

            if (searchText.includes(keyword)) {
              const rawPreview = language === 'zh'
                ? (section.yw_zh || section.yz_zh || section.yw_en || '')
                : (section.yw_en || section.yz_en || '');
              const preview = extractPreview(rawPreview, q.trim(), 100);
              found.push({
                bookType: 'sb',
                chapterId: chapter.id,
                sectionIndex: idx,
                sectionId: section.section_id,
                label: `SB ${section.section_id}`,
                preview,
              });
            }
          });
        }
      }
    }

    updateState({ results: found.slice(0, 200), searched: true, query: q, selectedBook: searchBook });
    setSearching(false);
  }, [selectedBook, bgData, sbIndex, language, loadAllSBForSearch, updateState]);

  const handleSearch = () => doSearch(query);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    updateState({ query: '', results: [], searched: false });
    inputRef.current?.focus();
  };

  const handleDeleteHistory = (indices: number[]) => {
    const h = getHistory();
    const newH = h.filter((_, i) => !indices.includes(i));
    saveHistory(newH);
    setHistory(newH);
    setSelectedForDelete(new Set());
    setEditMode(false);
  };

  const toggleSelectForDelete = (idx: number) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '70px', minHeight: '100vh', background: bg }}>
      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          height: '56px',
          background: navBg,
          borderBottom: `1px solid ${navBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        {searched ? (
          <button
            onClick={() => updateState({ searched: false, results: [], query: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: labelColor, fontSize: '1.2rem', padding: '4px 8px' }}
          >
            ←
          </button>
        ) : (
          <div style={{ width: '40px' }} />
        )}
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
          {searched ? `搜索"${query}"` : '搜索'}
        </h1>
        {!searched && history.length > 0 ? (
          editMode ? (
            <button
              onClick={() => {
                if (selectedForDelete.size > 0) {
                  handleDeleteHistory(Array.from(selectedForDelete));
                } else {
                  setEditMode(false);
                }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: labelColor, fontSize: '14px', fontWeight: 600 }}
            >
              {selectedForDelete.size > 0 ? `删除(${selectedForDelete.size})` : '完成'}
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: '4px' }}
            >
              <Edit2 size={16} />
            </button>
          )
        ) : (
          <div style={{ width: '40px' }} />
        )}
      </div>

      {!searched ? (
        <div style={{ padding: '16px' }}>
          {/* Book selector */}
          <div
            style={{
              background: inputBg,
              borderRadius: '24px',
              border: `1px solid ${inputBorder}`,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <select
              value={selectedBook}
              onChange={e => updateState({ selectedBook: e.target.value as 'bg' | 'sb' })}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '1rem',
                color: isDark ? '#c0d0e0' : '#333',
                width: '100%',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {BOOK_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <div
            style={{
              background: inputBg,
              borderRadius: '24px',
              border: `1px solid ${inputBorder}`,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={e => updateState({ query: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="输入关键词..."
              style={{
                border: 'none',
                background: 'none',
                fontSize: '1rem',
                flex: 1,
                outline: 'none',
                color: isDark ? '#c0d0e0' : '#333',
              }}
            />
            {query && (
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}>
                <X size={16} />
              </button>
            )}
            <button
              onClick={handleSearch}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: labelColor }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Search history */}
          {history.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}>搜索历史</span>
                {!editMode && (
                  <button
                    onClick={() => { saveHistory([]); setHistory([]); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> 清空
                  </button>
                )}
              </div>
              <div style={{ background: cardBg, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isDark ? '#2a3a50' : 'transparent'}` }}>
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: idx < history.length - 1 ? `1px solid ${isDark ? '#2a3a50' : '#f0f4f8'}` : 'none',
                      cursor: editMode ? 'default' : 'pointer',
                      background: editMode && selectedForDelete.has(idx) ? (isDark ? 'rgba(255,80,80,0.1)' : 'rgba(255,80,80,0.05)') : 'transparent',
                    }}
                    onClick={() => {
                      if (editMode) {
                        toggleSelectForDelete(idx);
                      } else {
                        updateState({ query: h });
                        doSearch(h);
                      }
                    }}
                  >
                    {editMode && (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedForDelete.has(idx) ? '#e05050' : (isDark ? '#4a6a8a' : '#c0d0e0')}`,
                          background: selectedForDelete.has(idx) ? '#e05050' : 'transparent',
                          marginRight: '12px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedForDelete.has(idx) && <Check size={12} color="white" />}
                      </div>
                    )}
                    <span style={{ flex: 1, fontSize: '14px', color: isDark ? '#c0d0e0' : '#333' }}>{h}</span>
                    {!editMode && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteHistory([idx]); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div style={{ textAlign: 'center', color: textSecondary, fontSize: '14px', marginTop: '40px' }}>
              暂无搜索历史
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Compact search bar */}
          <div style={{ padding: '12px 16px', background: bg }}>
            <div
              style={{
                background: inputBg,
                borderRadius: '24px',
                border: `1px solid ${inputBorder}`,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                value={query}
                onChange={e => updateState({ query: e.target.value })}
                onKeyDown={handleKeyDown}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '0.95rem',
                  flex: 1,
                  outline: 'none',
                  color: isDark ? '#c0d0e0' : '#333',
                }}
              />
              {query && (
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}>
                  <X size={16} />
                </button>
              )}
              <button onClick={handleSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: labelColor }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {searching || sbLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: labelColor }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <div style={{ color: textSecondary }}>{sbLoading ? '正在加载博伽瓦谭数据...' : '搜索中...'}</div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: textSecondary }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😔</div>
              <div>未找到相关内容</div>
            </div>
          ) : (
            <div style={{ background: cardBg }}>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: textSecondary, borderBottom: `1px solid ${isDark ? '#2a3a50' : '#f0f4f8'}` }}>
                找到 {results.length} 条结果
              </div>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenResult(result)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${isDark ? '#2a3a50' : '#f0f4f8'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? '#1e2e42' : '#f8fbff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ color: labelColor, fontWeight: 600, fontSize: '0.85rem' }}>
                    {result.label}
                  </span>
                  <div
                    style={{ fontSize: '0.88rem', color: resultTextColor, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: highlightText(result.preview, query) }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
