// SearchPage — 搜索页面
// Features: 历史搜索记录（localStorage）、搜索状态持久化、关键词位置截取预览、右上角编辑删除历史
// v1.2: 搜索进度条 + 开发模式调试面板 + jsDelivr CDN 加速
// v1.3: 自定义下拉菜单（主题一致）+ 支持同时搜索 BG+SB
// v1.7: 滚动位置记忆、返回高亮条目、英文词搜中文、开发模式状态标记与测试按钮
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, Edit2, Trash2, Check, Info } from 'lucide-react';
import { useBGData, useSBIndex } from '../hooks/useData';
import type { LoadProgress } from '../hooks/useData';
import LoadingProgress from '../components/LoadingProgress';
import type { Language, VedaTheme } from '../types';

// ---- Types ----
export interface SearchResult {
  bookType: 'bg' | 'sb';
  chapterId: number;
  sectionIndex: number;
  sectionId: string;
  label: string;
  preview: string;
  searchKeyword?: string;
}

export type BookFilter = 'bg' | 'sb' | 'all';

export interface SearchState {
  query: string;
  selectedBook: BookFilter;
  results: SearchResult[];
  searched: boolean;
}

interface SearchPageProps {
  onOpenResult: (result: SearchResult & { resultIdx?: number; scrollTop?: number }) => void;
  language: Language;
  searchState?: SearchState;
  onSearchStateChange?: (state: SearchState) => void;
  theme?: VedaTheme;
  devMode?: boolean;
  // 滚动位置记忆
  savedScrollTop?: number;
  onScrollTopChange?: (top: number) => void;
  // 上次点击的结果索引（返回时高亮+滚动）
  lastClickedIdx?: number | null;
  onClearLastClicked?: () => void;
}

const BOOK_OPTIONS: { id: BookFilter; label: string; sublabel?: string }[] = [
  { id: 'all', label: '全部', sublabel: '博伽梵歌 + 博伽瓦谭' },
  { id: 'bg', label: '博伽梵歌' },
  { id: 'sb', label: '博伽瓦谭' },
];

const HISTORY_KEY = 'veda_search_history';
const SEARCH_TIME_KEY = 'vedabase_last_search_time';
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

// Extract preview snippet: find the sentence containing the keyword
// 关键词不在句首时，截取关键词所在完整句子，超长时从中间截取并加"..."
function extractPreview(text: string, keyword: string, maxLen = 120): string {
  const clean = text.replace(/<[^>]+>/g, '').trim();
  if (!keyword) return clean.slice(0, maxLen) + (clean.length > maxLen ? '...' : '');
  const lower = clean.toLowerCase();
  const kwLower = keyword.toLowerCase();
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return clean.slice(0, maxLen) + (clean.length > maxLen ? '...' : '');

  // Try to find the sentence containing the keyword
  // Sentence boundaries: Chinese/English period, exclamation, question mark, newline
  const sentenceEnd = /[.!?\n。！？]/;
  let start = idx;
  let end = idx + kwLower.length;

  // Expand backward to find sentence start
  while (start > 0 && !sentenceEnd.test(clean[start - 1])) {
    start--;
  }
  // Expand forward to find sentence end
  while (end < clean.length && !sentenceEnd.test(clean[end])) {
    end++;
  }
  // Include the sentence-ending punctuation
  if (end < clean.length && sentenceEnd.test(clean[end])) end++;

  let snippet = clean.slice(start, end).trim();

  // If snippet is too long, extract centered window around keyword
  if (snippet.length > maxLen) {
    const halfLen = Math.floor((maxLen - kwLower.length) / 2);
    const s = Math.max(0, idx - halfLen);
    const e = Math.min(clean.length, idx + kwLower.length + halfLen);
    snippet = clean.slice(s, e);
    if (s > 0) snippet = '...' + snippet;
    if (e < clean.length) snippet = snippet + '...';
  } else {
    if (start > 0) snippet = '...' + snippet;
    if (end < clean.length) snippet = snippet + '...';
  }
  return snippet;
}

// 高亮文本中的关键词（大小写不敏感）
// 使用 span 而不是 mark，避免 Tailwind/浏览器默认 mark 样式干扰
function highlightText(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(escaped, 'gi'),
    match => `<span style="background:#d4a017;color:#1a1a1a;border-radius:2px;padding:0 2px;font-weight:700;display:inline">${match}</span>`
  );
}

// SB has 12 cantos, each loaded individually during search
const SB_TOTAL_CANTOS = 12;

// 开发模式功能说明
const DEV_MODE_FEATURES = `开发模式 vs 生产模式功能对比

【开发模式专有功能】
• 搜索页顶部显示模式标记（开发/测试/生产）
• 测试按钮：清除"上次打开时间戳"（测试2小时限时记忆）
• 搜索加载时显示详细进度（jsDelivr/GitHub 来源、耗时）
• 搜索结果显示数据来源（jsDelivr CDN / GitHub Pages）
• 无结果时显示加载进度详情
• 阅读页错误时显示 DevPanel（资源状态、环境信息）
• 激活方式：在书架页"设置"菜单中长按"关于"按钮3秒

【测试模式（localStorage: vedabase_devmode=test）】
• 同开发模式，另加：模拟网络延迟、强制使用备用CDN

【生产模式（默认）】
• 仅显示用户界面，无调试信息
• 关闭方式：再次长按"关于"按钮3秒`;

export default function SearchPage({
  onOpenResult,
  language,
  searchState,
  onSearchStateChange,
  theme = 'light',
  devMode = false,
  savedScrollTop = 0,
  onScrollTopChange,
  lastClickedIdx = null,
  onClearLastClicked,
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
  const dropdownBg = isDark ? '#1e2e42' : '#ffffff';
  const dropdownHover = isDark ? '#2a3a50' : '#f0f6ff';
  const dropdownBorder = isDark ? '#2a3a50' : '#e0eaf2';

  const [localSelectedBook, setLocalSelectedBook] = useState<BookFilter>(
    (searchState?.selectedBook as BookFilter) || 'bg'
  );
  const [localQuery, setLocalQuery] = useState(searchState?.query || '');
  const [localResults, setLocalResults] = useState<SearchResult[]>(searchState?.results || []);
  const [localSearched, setLocalSearched] = useState(searchState?.searched || false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDevInfo, setShowDevInfo] = useState(false);

  const selectedBook: BookFilter = searchState ? (searchState.selectedBook as BookFilter) : localSelectedBook;
  const query = searchState ? searchState.query : localQuery;
  const results = searchState ? searchState.results : localResults;
  const searched = searchState ? searchState.searched : localSearched;

  // 滚动容器 ref（用于记忆滚动位置）
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 上次点击的结果条目 ref（用于滚动到该位置）
  const resultItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 是否已恢复滚动位置
  const scrollRestoredRef = useRef(false);

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
      if (updates.selectedBook !== undefined) setLocalSelectedBook(updates.selectedBook as BookFilter);
      if (updates.results !== undefined) setLocalResults(updates.results);
      if (updates.searched !== undefined) setLocalSearched(updates.searched);
    }
  }, [query, selectedBook, results, searched, onSearchStateChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 恢复滚动位置：当搜索结果渲染完成后，滚动到上次位置并高亮上次点击的条目
  useEffect(() => {
    if (!searched || scrollRestoredRef.current) return;
    if (results.length === 0) return;

    scrollRestoredRef.current = true;

    // 使用 requestAnimationFrame 确保 DOM 已渲染
    requestAnimationFrame(() => {
      // 如果有上次点击的条目，滚动到该条目（让它在屏幕顶部，减去56px固定导航栏高度）
      if (lastClickedIdx !== null && lastClickedIdx >= 0 && resultItemRefs.current[lastClickedIdx]) {
        const el = resultItemRefs.current[lastClickedIdx];
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 56 - 8;
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
        }
      } else if (savedScrollTop > 0) {
        // 否则恢复上次滚动位置
        window.scrollTo({ top: savedScrollTop, behavior: 'instant' });
      }
    });
  }, [searched, results.length, lastClickedIdx, savedScrollTop]);

  // 当 searched 变为 false（回到搜索首页）时，重置恢复标记
  useEffect(() => {
    if (!searched) {
      scrollRestoredRef.current = false;
    }
  }, [searched]);

  // 清除高亮标记（滚动恢复后）
  useEffect(() => {
    if (scrollRestoredRef.current && lastClickedIdx !== null) {
      // 延迟2秒后清除高亮
      const timer = setTimeout(() => {
        onClearLastClicked?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scrollRestoredRef.current, lastClickedIdx, onClearLastClicked]);

  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [editMode, setEditMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const sbAllSectionsRef = useRef<Record<string, unknown>>({});

  // Progress tracking for search loading
  const [loadProgresses, setLoadProgresses] = useState<LoadProgress[]>([]);
  const [loadedCantos, setLoadedCantos] = useState(0);
  const [totalCantos, setTotalCantos] = useState(0);

  const addProgress = useCallback((p: LoadProgress) => {
    setLoadProgresses(prev => {
      const idx = prev.findIndex(x => x.url === p.url && x.source === p.source);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [...prev, p];
    });
    if (p.status === 'ok') {
      setLoadedCantos(c => c + 1);
    }
  }, []);

  const { data: bgData } = useBGData();
  const { data: sbIndex } = useSBIndex();

  const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/peterxie990624/vedabase-web@main/client/public';
  const GH_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

  const loadCantoWithProgress = useCallback(async (cantoId: number): Promise<unknown> => {
    const path = `/data/sb/canto_${cantoId}.json`;
    const jsdUrl = `${JSDELIVR_BASE}${path}`;
    const ghUrl = `${GH_BASE}${path}`;

    addProgress({ url: jsdUrl, source: 'jsdelivr', status: 'loading' });
    const t0 = Date.now();
    try {
      const res = await fetch(jsdUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      addProgress({ url: jsdUrl, source: 'jsdelivr', status: 'ok', durationMs: Date.now() - t0 });
      return data;
    } catch (e1) {
      const msg1 = e1 instanceof Error ? e1.message : String(e1);
      addProgress({ url: jsdUrl, source: 'jsdelivr', status: 'error', error: msg1 });
      addProgress({ url: ghUrl, source: 'github', status: 'loading' });
      const t1 = Date.now();
      try {
        const res2 = await fetch(ghUrl);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
        const data2 = await res2.json();
        addProgress({ url: ghUrl, source: 'github', status: 'ok', durationMs: Date.now() - t1 });
        return data2;
      } catch (e2) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        addProgress({ url: ghUrl, source: 'github', status: 'error', error: msg2 });
        throw new Error(`Canto ${cantoId} load failed`);
      }
    }
  }, [addProgress, JSDELIVR_BASE, GH_BASE]);

  const loadAllSBForSearch = useCallback(async () => {
    if (Object.keys(sbAllSectionsRef.current).length > 0) return sbAllSectionsRef.current;
    setTotalCantos(SB_TOTAL_CANTOS);
    setLoadedCantos(0);
    setLoadProgresses([]);

    for (let i = 1; i <= SB_TOTAL_CANTOS; i++) {
      try {
        const data = await loadCantoWithProgress(i) as { sections: Record<string, unknown> };
        Object.assign(sbAllSectionsRef.current, data.sections);
      } catch (e) {
        console.error(`Failed to load canto ${i}`, e);
      }
    }
    return sbAllSectionsRef.current;
  }, [loadCantoWithProgress]);

  // Helper: search BG data
  // 支持：中文关键词搜中文字段，英文关键词搜英文字段，两者都搜
  const searchBG = useCallback((keyword: string, q: string): SearchResult[] => {
    if (!bgData) return [];
    const found: SearchResult[] = [];
    const kwLower = keyword.toLowerCase();
    for (const [chIdStr, sections] of Object.entries(bgData.sections)) {
      const chId = parseInt(chIdStr);
      (sections as Array<{
        id: number; section_id: string | number;
        yw_zh: string | null; yw_en: string | null;
        yz_zh: string | null; yz_en: string | null;
        words_zh_fc: string | null; words_en_fc: string | null;
      }>).forEach((section, idx) => {
        const zhText = [section.yw_zh, section.yz_zh, section.words_zh_fc].filter(Boolean).join(' ');
        const enText = [section.yw_en, section.yz_en, section.words_en_fc].filter(Boolean).join(' ');
        const searchText = (zhText + ' ' + enText).toLowerCase();

        if (searchText.includes(kwLower)) {
          // 根据语言和关键词匹配情况选择预览文本
          // 如果中文模式：优先中文预览，但如果关键词在英文中，也用中文预览（显示对应内容）
          let rawPreview: string;
          if (language === 'zh') {
            rawPreview = section.yw_zh || section.yz_zh || section.yw_en || '';
          } else {
            rawPreview = section.yw_en || section.yz_en || '';
          }
          // 如果选定语言的预览文本中没有关键词，尝试用另一语言的预览
          const previewLower = rawPreview.toLowerCase();
          if (!previewLower.includes(kwLower)) {
            // 关键词在另一语言字段中，用包含关键词的字段做预览
            const altPreview = language === 'zh'
              ? (section.yw_en || section.yz_en || '')
              : (section.yw_zh || section.yz_zh || '');
            if (altPreview.toLowerCase().includes(kwLower)) {
              rawPreview = altPreview;
            }
          }
          found.push({
            bookType: 'bg',
            chapterId: chId,
            sectionIndex: idx,
            sectionId: String(section.section_id),
            label: `BG ${section.section_id}`,
            preview: extractPreview(rawPreview, q, 100),
            searchKeyword: q.trim(),
          });
        }
      });
    }
    return found;
  }, [bgData, language]);

  // Helper: search SB data
  const searchSB = useCallback(async (keyword: string, q: string): Promise<SearchResult[]> => {
    const allSections = await loadAllSBForSearch() as Record<string, Array<{
      id: number; section_id: string;
      yw_zh: string | null; yw_en: string | null;
      yz_zh: string | null; yz_en: string | null;
      words_zh_fc: string | null; words_en_fc: string | null;
    }>>;
    const found: SearchResult[] = [];
    const kwLower = keyword.toLowerCase();
    if (sbIndex) {
      for (const chapter of sbIndex.chapters) {
        const sections = allSections[String(chapter.id)] || [];
        sections.forEach((section, idx) => {
          const zhText = [section.yw_zh, section.yz_zh, section.words_zh_fc].filter(Boolean).join(' ');
          const enText = [section.yw_en, section.yz_en, section.words_en_fc].filter(Boolean).join(' ');
          const searchText = (zhText + ' ' + enText).toLowerCase();

          if (searchText.includes(kwLower)) {
            let rawPreview: string;
            if (language === 'zh') {
              rawPreview = section.yw_zh || section.yz_zh || section.yw_en || '';
            } else {
              rawPreview = section.yw_en || section.yz_en || '';
            }
            const previewLower = rawPreview.toLowerCase();
            if (!previewLower.includes(kwLower)) {
              const altPreview = language === 'zh'
                ? (section.yw_en || section.yz_en || '')
                : (section.yw_zh || section.yz_zh || '');
              if (altPreview.toLowerCase().includes(kwLower)) {
                rawPreview = altPreview;
              }
            }
            found.push({
              bookType: 'sb',
              chapterId: chapter.id,
              sectionIndex: idx,
              sectionId: section.section_id,
              label: `SB ${section.section_id}`,
              searchKeyword: q.trim(),
              preview: extractPreview(rawPreview, q, 100),
            });
          }
        });
      }
    }
    return found;
  }, [sbIndex, language, loadAllSBForSearch]);

  const doSearch = useCallback(async (q: string, book?: BookFilter) => {
    const searchBook: BookFilter = book || selectedBook;
    if (!q.trim()) return;
    setSearching(true);
    updateState({ query: q, selectedBook: searchBook, searched: true });
    addToHistory(q.trim());
    setHistory(getHistory());
    // 记录搜索时间戳（用于2小时记忆时限）
    localStorage.setItem(SEARCH_TIME_KEY, String(Date.now()));
    const keyword = q.trim().toLowerCase();
    let found: SearchResult[] = [];

    if (searchBook === 'bg') {
      found = searchBG(keyword, q.trim());
    } else if (searchBook === 'sb') {
      found = await searchSB(keyword, q.trim());
    } else if (searchBook === 'all') {
      // Search BG first (fast), then SB
      const bgResults = searchBG(keyword, q.trim());
      const sbResults = await searchSB(keyword, q.trim());
      found = [...bgResults, ...sbResults];
    }

    updateState({ results: found.slice(0, 200), searched: true, query: q, selectedBook: searchBook });
    setSearching(false);
    // 新搜索时重置滚动位置
    scrollRestoredRef.current = false;
    onScrollTopChange?.(0);
  }, [selectedBook, searchBG, searchSB, updateState, onScrollTopChange]);

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

  const handleSelectAll = () => {
    if (selectedForDelete.size === history.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(history.map((_, i) => i)));
    }
  };

  // 点击结果条目：记录当前滚动位置和条目索引
  const handleOpenResult = (result: SearchResult, idx: number) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    onScrollTopChange?.(scrollTop);
    onOpenResult({ ...result, resultIdx: idx, scrollTop });
  };

  const isLoadingSB = searching && (selectedBook === 'sb' || selectedBook === 'all') && totalCantos > 0;

  const selectedBookLabel = BOOK_OPTIONS.find(o => o.id === selectedBook)?.label || '博伽梵歌';

  // 开发模式标记颜色
  const devBadgeColor = isDark ? '#5ad88a' : '#2a8a4a';
  const devBadgeBg = isDark ? 'rgba(90,216,138,0.12)' : 'rgba(42,138,74,0.1)';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
            {searched ? `搜索"${query}"` : '搜索'}
          </h1>
          {/* 开发模式标记 */}
          {devMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, color: devBadgeColor,
                background: devBadgeBg, borderRadius: '4px', padding: '1px 6px',
                border: `1px solid ${devBadgeColor}`,
                letterSpacing: '0.05em',
              }}>
                DEV
              </span>
              <button
                onClick={() => setShowDevInfo(v => !v)}
                title="查看开发模式功能说明"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: devBadgeColor, padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <Info size={14} />
              </button>
            </div>
          )}
        </div>
        {!searched && history.length > 0 ? (
          editMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleSelectAll}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontSize: '13px' }}
              >
                {selectedForDelete.size === history.length ? '取消全选' : '全选'}
              </button>
              {selectedForDelete.size > 0 && (
                <button
                  onClick={() => handleDeleteHistory(Array.from(selectedForDelete))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05050', fontSize: '14px', fontWeight: 600 }}
                >
                  删除({selectedForDelete.size})
                </button>
              )}
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedForDelete(new Set());
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: labelColor, fontSize: '14px', fontWeight: 600 }}
              >
                取消
              </button>
            </div>
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

      {/* 开发模式信息弹窗 */}
      {devMode && showDevInfo && (
        <div
          style={{
            position: 'fixed', top: '56px', left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '640px', zIndex: 200,
            background: isDark ? '#1a2535' : '#fff',
            borderBottom: `1px solid ${navBorder}`,
            padding: '16px',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 700, color: devBadgeColor, fontSize: '13px' }}>开发模式功能说明</span>
            <button onClick={() => setShowDevInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}>
              <X size={16} />
            </button>
          </div>
          <pre style={{
            fontSize: '12px', color: isDark ? '#c0d0e0' : '#444',
            whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7,
            fontFamily: 'monospace',
          }}>
            {DEV_MODE_FEATURES}
          </pre>
          {/* 测试按钮区 */}
          <div style={{ marginTop: '12px', borderTop: `1px solid ${navBorder}`, paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', color: textSecondary, marginBottom: '8px', fontWeight: 600 }}>测试工具</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  localStorage.removeItem(SEARCH_TIME_KEY);
                  alert('已清除上次打开时间戳！\n现在切换到其他tab再切回搜索，将不会恢复上次搜索状态（超过2小时限制）。');
                }}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: `1px solid ${devBadgeColor}`,
                  background: devBadgeBg, color: devBadgeColor, cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                }}
              >
                🕐 清除时间戳（测试2h限时记忆）
              </button>
              <button
                onClick={() => {
                  const ts = localStorage.getItem(SEARCH_TIME_KEY);
                  if (ts) {
                    const diff = Math.round((Date.now() - parseInt(ts)) / 1000 / 60);
                    alert(`上次搜索时间戳：${new Date(parseInt(ts)).toLocaleString()}\n距今：${diff} 分钟\n${diff >= 120 ? '（已超过2小时，下次切回会重置）' : '（未超过2小时，切回会恢复）'}`);
                  } else {
                    alert('无时间戳记录（从未搜索或已清除）');
                  }
                }}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: `1px solid ${textSecondary}`,
                  background: 'none', color: textSecondary, cursor: 'pointer', fontSize: '12px',
                }}
              >
                📊 查看时间戳状态
              </button>
              <button
                onClick={() => {
                  // 设置一个2小时前的时间戳，模拟超时
                  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000 - 1000;
                  localStorage.setItem(SEARCH_TIME_KEY, String(twoHoursAgo));
                  alert('已设置"2小时前"时间戳！\n现在切换tab再切回搜索，将重置到搜索首页。');
                }}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: `1px solid ${textSecondary}`,
                  background: 'none', color: textSecondary, cursor: 'pointer', fontSize: '12px',
                }}
              >
                ⏩ 模拟超时（设为2h前）
              </button>
            </div>
          </div>
        </div>
      )}

      {!searched ? (
        <div style={{ padding: '16px' }}>
          {/* Custom book selector dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '12px' }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                width: '100%',
                background: inputBg,
                borderRadius: '24px',
                border: `1px solid ${dropdownOpen ? labelColor : inputBorder}`,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontSize: '1rem', color: isDark ? '#c0d0e0' : '#333', fontFamily: "'Noto Serif SC', serif" }}>
                {selectedBookLabel}
              </span>
              <ChevronDown
                size={16}
                color={textSecondary}
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: dropdownBg,
                  border: `1px solid ${dropdownBorder}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  zIndex: 200,
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(74,127,165,0.15)',
                }}
              >
                {BOOK_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateState({ selectedBook: opt.id });
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: selectedBook === opt.id
                        ? (isDark ? 'rgba(106,172,220,0.15)' : 'rgba(46,111,160,0.08)')
                        : 'transparent',
                      border: 'none',
                      borderBottom: idx < BOOK_OPTIONS.length - 1 ? `1px solid ${dropdownBorder}` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (selectedBook !== opt.id) {
                        (e.currentTarget as HTMLElement).style.background = dropdownHover;
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedBook !== opt.id) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.95rem', color: selectedBook === opt.id ? labelColor : (isDark ? '#c0d0e0' : '#333'), fontFamily: "'Noto Serif SC', serif", fontWeight: selectedBook === opt.id ? 600 : 400 }}>
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div style={{ fontSize: '0.75rem', color: textSecondary, marginTop: '2px' }}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {selectedBook === opt.id && (
                      <Check size={16} color={labelColor} />
                    )}
                  </button>
                ))}
              </div>
            )}
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
        <div ref={scrollContainerRef}>
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

          {searching ? (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
              <div style={{ color: textPrimary, fontWeight: 600, marginBottom: '6px', fontSize: '15px' }}>
                {isLoadingSB
                  ? `正在加载博伽瓦谭数据... (${loadedCantos}/${totalCantos} 篇)`
                  : selectedBook === 'all'
                    ? '正在搜索全部经典...'
                    : '搜索中...'}
              </div>
              {isLoadingSB ? (
                <LoadingProgress
                  progresses={loadProgresses}
                  totalSteps={totalCantos * 2}
                  isDark={isDark}
                  devMode={devMode}
                />
              ) : (
                <div style={{ color: textSecondary, fontSize: '13px' }}>
                  {selectedBook === 'all' ? '正在博伽梵歌中搜索...' : '正在博伽梵歌中搜索...'}
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: textSecondary }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😔</div>
              <div>未找到相关内容</div>
              {devMode && loadProgresses.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <LoadingProgress
                    progresses={loadProgresses}
                    totalSteps={totalCantos * 2}
                    isDark={isDark}
                    devMode={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: cardBg }}>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: textSecondary, borderBottom: `1px solid ${isDark ? '#2a3a50' : '#f0f4f8'}` }}>
                找到 {results.length} 条结果
                {results.some(r => r.bookType === 'bg') && results.some(r => r.bookType === 'sb') && (
                  <span style={{ marginLeft: '6px' }}>
                    （BG: {results.filter(r => r.bookType === 'bg').length} · SB: {results.filter(r => r.bookType === 'sb').length}）
                  </span>
                )}
                {devMode && loadProgresses.length > 0 && (
                  <span style={{ marginLeft: '8px', color: isDark ? '#5ad88a' : '#2a8a4a' }}>
                    · 通过 {loadProgresses.find(p => p.status === 'ok')?.source === 'jsdelivr' ? 'jsDelivr CDN' : 'GitHub Pages'} 加载
                  </span>
                )}
              </div>
              {results.map((result, idx) => {
                const isLastClicked = lastClickedIdx === idx;
                return (
                  <div
                    key={idx}
                    ref={el => { resultItemRefs.current[idx] = el; }}
                    onClick={() => handleOpenResult(result, idx)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${isDark ? '#2a3a50' : '#f0f4f8'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      // 上次点击的条目高亮（返回时标记）
                      background: isLastClicked
                        ? (isDark ? 'rgba(212,160,23,0.15)' : 'rgba(212,160,23,0.1)')
                        : 'transparent',
                      borderLeft: isLastClicked ? `3px solid #d4a017` : '3px solid transparent',
                      transition: 'background 0.3s',
                    }}
                    onMouseEnter={e => {
                      if (!isLastClicked) {
                        (e.currentTarget as HTMLElement).style.background = isDark ? '#1e2e42' : '#f8fbff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isLastClicked) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ color: labelColor, fontWeight: 600, fontSize: '0.85rem' }}>
                      {result.label}
                    </span>
                    <div
                      style={{ fontSize: '0.88rem', color: resultTextColor, lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: highlightText(result.preview, query) }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
