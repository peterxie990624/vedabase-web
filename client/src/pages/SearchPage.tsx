import React, { useState, useCallback, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useBGData, useSBIndex, useSBCantoData } from '../hooks/useData';
import type { Language } from '../types';

interface SearchResult {
  bookType: 'bg' | 'sb';
  chapterId: number;
  sectionIndex: number;
  sectionId: string;
  label: string;
  preview: string;
}

interface SearchPageProps {
  onOpenResult: (result: SearchResult) => void;
  language: Language;
}

const BOOK_OPTIONS = [
  { id: 'bg', label: '博伽梵歌' },
  { id: 'sb', label: '博伽瓦谭' },
];

// Common search suggestions
const SUGGESTIONS = ['解脱', '奉献', '奎师那', '梵', '瑜伽', '灵魂', '知识', '奉爱', 'liberation', 'devotion', 'yoga'];

function highlightText(text: string, keyword: string): string {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), match => `<mark class="search-highlight">${match}</mark>`);
}

export default function SearchPage({ onOpenResult, language }: SearchPageProps) {
  const [selectedBook, setSelectedBook] = useState<'bg' | 'sb'>('bg');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: bgData } = useBGData();
  const { data: sbIndex } = useSBIndex();

  // SB canto loading - we load all cantos for search
  const [sbAllSections, setSbAllSections] = useState<Record<string, unknown>>({});
  const [sbLoading, setSbLoading] = useState(false);

  const loadAllSBForSearch = useCallback(async () => {
    if (Object.keys(sbAllSections).length > 0) return sbAllSections;
    setSbLoading(true);
    const all: Record<string, unknown> = {};
    try {
      for (let i = 1; i <= 12; i++) {
        const res = await fetch(`/data/sb/canto_${i}.json`);
        const data = await res.json();
        Object.assign(all, data.sections);
      }
      setSbAllSections(all);
    } catch (e) {
      console.error('Failed to load SB data for search', e);
    }
    setSbLoading(false);
    return all;
  }, [sbAllSections]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setSearched(true);
    const keyword = q.trim().toLowerCase();
    const found: SearchResult[] = [];

    if (selectedBook === 'bg' && bgData) {
      for (const [chIdStr, sections] of Object.entries(bgData.sections)) {
        const chId = parseInt(chIdStr);
        sections.forEach((section, idx) => {
          const searchText = [
            section.yw_zh, section.yw_en, section.yz_zh, section.yz_en,
            section.words_zh_fc, section.words_en_fc,
          ].filter(Boolean).join(' ').toLowerCase();

          if (searchText.includes(keyword)) {
            const preview = language === 'zh'
              ? (section.yw_zh || section.yz_zh || '')
              : (section.yw_en || section.yz_en || '');
            const cleanPreview = preview.replace(/<[^>]+>/g, '').trim().slice(0, 80);
            found.push({
              bookType: 'bg',
              chapterId: chId,
              sectionIndex: idx,
              sectionId: String(section.section_id),
              label: `BG ${section.section_id}`,
              preview: cleanPreview,
            });
          }
        });
      }
    } else if (selectedBook === 'sb') {
      const allSections = await loadAllSBForSearch() as Record<string, unknown[]>;
      if (sbIndex) {
        for (const chapter of sbIndex.chapters) {
          const sections = (allSections[String(chapter.id)] || []) as Array<{
            id: number; section_id: string;
            yw_zh: string | null; yw_en: string | null;
            yz_zh: string | null; yz_en: string | null;
            words_zh_fc: string | null; words_en_fc: string | null;
          }>;
          sections.forEach((section, idx) => {
            const searchText = [
              section.yw_zh, section.yw_en, section.yz_zh, section.yz_en,
              section.words_zh_fc, section.words_en_fc,
            ].filter(Boolean).join(' ').toLowerCase();

            if (searchText.includes(keyword)) {
              const preview = language === 'zh'
                ? (section.yw_zh || section.yz_zh || '')
                : (section.yw_en || section.yz_en || '');
              const cleanPreview = preview.replace(/<[^>]+>/g, '').trim().slice(0, 80);
              found.push({
                bookType: 'sb',
                chapterId: chapter.id,
                sectionIndex: idx,
                sectionId: section.section_id,
                label: `SB ${section.section_id}`,
                preview: cleanPreview,
              });
            }
          });
        }
      }
    }

    setResults(found.slice(0, 200)); // Limit to 200 results
    setSearching(false);
  }, [selectedBook, bgData, sbIndex, language, loadAllSBForSearch]);

  const handleSearch = () => doSearch(query);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
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
          background: 'white',
          borderBottom: '1px solid var(--veda-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--veda-blue)' }}>
          {searched ? `搜索"${query}"` : '搜索'}
        </h1>
        {searched && (
          <button
            onClick={() => { setSearched(false); setResults([]); }}
            style={{
              position: 'absolute',
              left: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--veda-blue)',
            }}
          >
            ←
          </button>
        )}
      </div>

      {!searched ? (
        <div style={{ padding: '16px' }}>
          {/* Book selector */}
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid var(--veda-border)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value as 'bg' | 'sb')}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '1rem',
                color: 'var(--veda-text)',
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
              background: 'white',
              borderRadius: '24px',
              border: '1px solid var(--veda-border)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入关键词..."
              style={{
                border: 'none',
                background: 'none',
                fontSize: '1rem',
                flex: 1,
                outline: 'none',
                color: 'var(--veda-text)',
              }}
            />
            {query && (
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8aa0b4' }}>
                <X size={16} />
              </button>
            )}
            <button
              onClick={handleSearch}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--veda-blue)',
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className={`tag-chip ${query === s ? 'active' : ''}`}
                onClick={() => {
                  setQuery(s);
                  doSearch(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Search bar (compact) */}
          <div style={{ padding: '12px 16px', background: 'var(--veda-bg)' }}>
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                border: '1px solid var(--veda-border)',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '0.95rem',
                  flex: 1,
                  outline: 'none',
                  color: 'var(--veda-text)',
                }}
              />
              {query && (
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8aa0b4' }}>
                  <X size={16} />
                </button>
              )}
              <button onClick={handleSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--veda-blue)' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {searching || sbLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--veda-blue)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <div>搜索中{selectedBook === 'sb' ? '（正在加载博伽瓦谭数据...）' : ''}...</div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8aa0b4' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😔</div>
              <div>未找到相关内容</div>
            </div>
          ) : (
            <div style={{ background: 'white' }}>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#8aa0b4', borderBottom: '1px solid var(--veda-border)' }}>
                找到 {results.length} 条结果
              </div>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="list-item"
                  onClick={() => onOpenResult(result)}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <span style={{ color: 'var(--veda-blue)', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
                      {result.label}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: '0.88rem', color: '#444', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.preview, query),
                    }}
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
