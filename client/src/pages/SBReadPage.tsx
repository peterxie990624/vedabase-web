import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import DevPanel from '../components/DevPanel';
import SectionContent from '../components/SectionContent';
import SBTableOfContents from '../components/SBTableOfContents';
import LoadingProgress from '../components/LoadingProgress';
import { useSBIndex, useSBCantoData, useSBPreload } from '../hooks/useData';
import type { LoadProgress } from '../hooks/useData';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSettings } from '../hooks/useSettings';
import type { Language, FontSize, VedaTheme } from '../types';
import { formatSectionLabel } from '../constants';
import { toast } from 'sonner';

interface SBReadPageProps {
  chapterId: number;
  sectionIndex: number;
  onBack: () => void;
  onHome: () => void;
  onNavigate: (chapterId: number, sectionIndex: number) => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
  fontSize?: FontSize;
  setFontSize?: (size: FontSize) => void;
  theme?: VedaTheme;
  devMode?: boolean;
  onGoToCanto?: (cantoId: number) => void;
  searchKeyword?: string;
  // Phase 2: 多位置高亮支持
  highlightKeyword?: string;
  highlightKeywordZh?: string;  // 中文高亮关键词
  highlightKeywordEn?: string;  // 英文高亮关键词
  matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
}

const PROGRESS_KEY = 'vedabase_progress_sb';

function saveProgress(chapterId: number, sectionIndex: number, sectionId?: string) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ chapterId, sectionIndex, sectionId }));
  } catch {}
}

export default function SBReadPage({
  chapterId,
  sectionIndex,
  onBack,
  onHome,
  onNavigate,
  language = 'zh',
  setLanguage,
  fontSize = 'md',
  setFontSize,
  theme = 'dark',
  devMode = false,
  onGoToCanto,
  searchKeyword,
  highlightKeyword,
  highlightKeywordZh,
  highlightKeywordEn,
  matchLocation,
}: SBReadPageProps) {
  const [progresses, setProgresses] = useState<LoadProgress[]>([]);
  const onProgress = useCallback((p: LoadProgress) => {
    setProgresses(prev => {
      const idx = prev.findIndex(x => x.url === p.url);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [...prev, p];
    });
  }, []);

  const { data: index, loading: indexLoading, error: indexError } = useSBIndex(onProgress);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  // 注意：不再使用useSettings，而是从Props获取language/fontSize/theme
  // 这样确保语言状态在App.tsx中集中管理，避免状态不同步
  const [animClass, setAnimClass] = useState('fade-in');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [showToc, setShowToc] = useState(false);
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const tocHeaderRef = useRef<HTMLDivElement>(null);
  const [tocHeaderHeight, setTocHeaderHeight] = useState(60);
  const [stickyCantoTitle, setStickyCantoTitle] = useState<string | null>(null);
  const [stickyChapterTitle, setStickyChapterTitle] = useState<string | null>(null);
  const [expandedCantos, setExpandedCantos] = useState<Set<number>>(new Set());
  const [currentCantoId, setCurrentCantoId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const chapter = index?.chapters.find(c => c.id === chapterId);
  const cantoId = chapter?.canto_id || null;
  const { data: cantoData, loading: cantoLoading, error: cantoError } = useSBCantoData(cantoId, onProgress);
  const loading = indexLoading || cantoLoading;

  // 后台预加载相邻篇
  useSBPreload(cantoId, !cantoLoading && !!cantoData);

  const chapters = index?.chapters || [];
  const sections = cantoData?.sections[String(chapterId)] || [];
  const section = sections[sectionIndex];

  const chapterIdx = chapters.findIndex(c => c.id === chapterId);
  const hasPrev = sectionIndex > 0 || chapterIdx > 0;
  const hasNext = sectionIndex < sections.length - 1 || chapterIdx < chapters.length - 1;

  // 初始化时，自动展开当前篇和当前章
  useEffect(() => {
    if (cantoId && chapterId && !initializedRef.current) {
      // 只在第一次初始化时展开当前篇和章
      initializedRef.current = true;
      setExpandedCantos(new Set([cantoId]));
      setExpandedChapters(new Set([chapterId]));
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (section) saveProgress(chapterId, sectionIndex, String(section.section_id));
  }, [chapterId, sectionIndex, section]);

  const goTo = useCallback((newChapterId: number, newSectionIdx: number, direction: 'left' | 'right') => {
    setAnimClass(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
    onNavigate(newChapterId, newSectionIdx);
    window.scrollTo(0, 0);
  }, [onNavigate]);

  const goPrev = useCallback(() => {
    if (sectionIndex > 0) {
      goTo(chapterId, sectionIndex - 1, 'left');
    } else if (chapterIdx > 0) {
      const prevChapter = chapters[chapterIdx - 1];
      goTo(prevChapter.id, 0, 'left');
    }
  }, [sectionIndex, chapterIdx, chapterId, chapters, goTo]);

  const goNext = useCallback(() => {
    if (sectionIndex < sections.length - 1) {
      goTo(chapterId, sectionIndex + 1, 'right');
    } else if (chapterIdx < chapters.length - 1) {
      const nextChapter = chapters[chapterIdx + 1];
      goTo(nextChapter.id, 0, 'right');
    }
  }, [sectionIndex, sections.length, chapterIdx, chapterId, chapters, goTo]);

  // Touch swipe — require horizontal dominance to avoid diagonal triggers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && hasNext) goNext();
      else if (dx < 0 && hasPrev) goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) goNext();
      if (e.key === 'ArrowLeft' && hasPrev) goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, hasNext, hasPrev]);

  // 测量 TOC header 的高度
  useEffect(() => {
    if (!tocHeaderRef.current) return;
    const height = tocHeaderRef.current.offsetHeight;
    setTocHeaderHeight(height);
  }, [showToc]);

  // 处理目录滑动时的浮动块显示
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const handleScroll = () => {
      const container = tocContainerRef.current;
      if (!container) return;

      // 查找最后一个已经滑出顶部的篇和章标题
      // 需求：只有当篇被展开且滑出时才显示篇；只有当章被展开且滑出时才显示章
      const cantoElements = container.querySelectorAll('[data-canto-id]');
      const chapterElements = container.querySelectorAll('[data-chapter-id]');
      
      let visibleCanto: string | null = null;
      let visibleCantoId: number | null = null;
      let visibleChapter: string | null = null;
      let currentCantoId: number | null = null;
      const containerRect = container.getBoundingClientRect();

      // 目录容器的顶部作为边界
      const topBoundary = containerRect.top;

      // 找当前阅读的篇，判断其是否超过目录容器顶部
      // 只有当前篇的底部超过目录顶部时，才显示篇块
      const currentCantoEl = container.querySelector(`[data-canto-id="${cantoId}"]`);
      if (currentCantoEl) {
        const rect = currentCantoEl.getBoundingClientRect();
        // 当前篇的底部已经超过目录容器顶部时，显示篇块
        if (rect.bottom < topBoundary) {
          visibleCanto = currentCantoEl.getAttribute('data-canto-title');
          visibleCantoId = cantoId;
        }
      }

      // 找当前阅读的章，判断其是否超过目录容器顶部
      // 只有当前章的底部超过目录顶部时，才显示章块
      const currentChapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
      if (currentChapterEl) {
        const rect = currentChapterEl.getBoundingClientRect();
        // 当前章的底部已经超过目录容器顶部时，显示章块
        if (rect.bottom < topBoundary) {
          visibleChapter = currentChapterEl.getAttribute('data-chapter-title');
        }
      }

      setStickyCantoTitle(visibleCanto);
      setStickyChapterTitle(visibleChapter);
    };

    const container = tocContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [showToc, expandedCantos]);

  // 打开目录时自动滑动到当前小节
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const timer = setTimeout(() => {
      const container = tocContainerRef.current;
      if (!container) return;

      // 先尝试找到当前小节
      const currentSectionEl = container.querySelector(`[data-section-id="${section?.section_id}"]`);
      if (currentSectionEl) {
        currentSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // 如果找不到小节，则滑动到当前章
        const currentChapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
        if (currentChapterEl) {
          currentChapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showToc, chapterId, section?.section_id]);

  // 当打开TOC时，展开当前篇
  useEffect(() => {
    if (showToc && cantoId) {
      setCurrentCantoId(cantoId);
      setExpandedCantos(prev => new Set([...prev, cantoId]));
    }
  }, [showToc, cantoId]);

  const handleFontSize = (size: FontSize) => setFontSize(size);
  const toggleLang = () => setLanguage(language === 'zh' ? 'en' : 'zh');

  const toggleCantoExpand = (id: number) => {
    setExpandedCantos(prev => {
      // 只展开当前篇，其他篇自动合上
      if (prev.has(id)) {
        // 如果已经展开，则合上
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        // 如果未展开，则清空其他，只展开该篇
        return new Set([id]);
      }
    });
  };

  const toggleChapterExpand = (id: number) => {
    setExpandedChapters(prev => {
      // 展开/收起该章，其他章自动合上
      if (prev.has(id)) {
        // 如果已经展开，则合上
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        // 如果未展开，则清空其他，只展开该章
        // 并自动滑动到该章的位置
        setTimeout(() => {
          const chapterEl = document.querySelector(`[data-chapter-id="${id}"]`);
          if (chapterEl) {
            chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
        return new Set([id]);
      }
    });
  };

  const DEV_MODE = devMode || import.meta.env.DEV;
  const uniqueUrls = Array.from(new Set(progresses.map(p => p.url)));
  const totalSteps = Math.max(2, uniqueUrls.length);

  if (loading || indexError || cantoError || !section) {
    const hasError = !!(indexError || cantoError);
    return (
      <div style={{ paddingTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f1923' : 'var(--veda-bg)', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📖</div>
              <div style={{ color: isDark ? '#c8a84b' : '#8a6a00', fontWeight: 600, marginBottom: '4px' }}>
                {indexLoading ? (isEn ? 'Loading index...' : '正在加载目录...') : cantoId ? (isEn ? `Loading Canto ${cantoId}...` : `正在加载第${cantoId}篇经典...`) : (isEn ? 'Loading...' : '正在加载...')}
              </div>
            </>
          ) : hasError ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <div style={{ color: '#e05050', fontWeight: 600 }}>{isEn ? 'Load failed' : '加载失败'}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😔</div>
              <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0' }}>{isEn ? 'Content not found' : '内容未找到'}</div>
            </>
          )}
        </div>
        {(loading || hasError) && progresses.length > 0 && (
          <LoadingProgress progresses={progresses} totalSteps={totalSteps} isDark={isDark} devMode={DEV_MODE} />
        )}
        {DEV_MODE && (
          <DevPanel
            resources={[
              { name: '博伽瓦谭目录', url: `${import.meta.env.BASE_URL}data/sb_index.json`, loading: indexLoading, error: indexError, source: 'jsdelivr' as const },
              { name: cantoId ? `博伽瓦谭第${cantoId}篇` : '章节数据', url: cantoId ? `${import.meta.env.BASE_URL}data/sb/canto_${cantoId}.json` : undefined, loading: cantoLoading, error: cantoError || (!cantoLoading && !cantoData && cantoId ? '数据为空' : null), source: 'jsdelivr' as const },
            ]}
            env={{ BASE_URL: import.meta.env.BASE_URL, 主题: theme || 'light', 语言: language || 'zh', 章节ID: String(chapterId), 篇ID: String(cantoId), 节索引: String(sectionIndex) }}
            isDark={isDark}
          />
        )}
      </div>
    );
  }

  const sectionLabel = formatSectionLabel('sb', section.section_id, language);
  const bookmarked = isBookmarked('sb', chapterId, section.section_id);

  const wfwSanskrit = section.ldw_fc;
  const wfwLang = section.words_en_fc; // SB only has English word-for-word
  const translation = language === 'zh' ? section.yw_zh : section.yw_en;
  const purport = language === 'zh' ? section.yz_zh : section.yz_en;

  // Share handler
  const handleShare = () => {
    const verseText = section.ldw || '';
    const translationText = (translation || '').replace(/<[^>]+>/g, '').trim().slice(0, 200);
    const shareText = `${sectionLabel}\n\n${verseText}\n\n${translationText}...\n\n— 韦达书库 vedabase-web`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success(isEn ? 'Verse copied to clipboard / 经典已复制' : '经典已复制到剪贴板', { duration: 2000 });
      });
    } else {
      toast.error(isEn ? 'Copy not supported' : '复制不支持', { duration: 2000 });
    }
  };

  // TOC colors
  const tocBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
  const tocPanelBg = isDark ? '#1a2535' : '#ffffff';
  const tocBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const tocTextPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const tocTextSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const tocActiveColor = isDark ? '#e8d5a3' : '#2e6fa0';
  const tocActiveBg = isDark ? 'rgba(232,213,163,0.1)' : 'rgba(46,111,160,0.08)';

  // Group chapters by canto for TOC
  const cantos = index?.cantos || [];

  // Handle tap on left/right 1/3 of screen to navigate
  // 已注释掉点击屏幕左右翻页功能
  const handleContentClick = () => {};

  return (
    <div
      style={{ minHeight: '100vh', background: isDark ? '#0f1923' : 'white' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <TopNav
        title={sectionLabel}
        onBack={onBack}
        onHome={onHome}
        showBookmark
        isBookmarked={bookmarked}
        onBookmark={() => {
          // 直接使用formatSectionLabel生成中英文标题，确保正确
          const title_zh = formatSectionLabel('sb', section.section_id, 'zh');
          const title_en = formatSectionLabel('sb', section.section_id, 'en');
          
          // 中文preview（总是使用section.yw_zh，不管当前语言）
          const preview_zh = (section.yw_zh || '').replace(/<[^>]+>/g, '').slice(0, 50);
          
          // 英文preview（总是使用section.yw_en，不管当前语言）
          const preview_en = (section.yw_en || '').replace(/<[^>]+>/g, '').slice(0, 50);
          
          toggleBookmark({
            bookType: 'sb',
            chapterId,
            sectionId: section.section_id,
            sectionIndex,
            title: language === 'zh' ? title_zh : title_en,  // 向后兼容
            preview: language === 'zh' ? preview_zh : preview_en,  // 向后兼容
            title_zh: title_zh,
            preview_zh: preview_zh,
            title_en: title_en,
            preview_en: preview_en,
          });
        }}
        showNavigation
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        language={language}
        onLanguageToggle={toggleLang}
        fontSize={fontSize}
        onFontSize={handleFontSize}
        theme={theme}
        onToc={() => {
          setShowToc(true);
          // 打开目录时，自动展开当前篇和章
          if (chapterId) {
            const chapter = chapters.find(c => c.id === chapterId);
            if (chapter) {
              // 展开当前篇
              setExpandedCantos(prev => new Set([...prev, chapter.canto_id]));
              // 展开当前章
              setExpandedChapters(prev => new Set([...prev, chapterId]));
            }
          }
        }}
      />

      <div
        key={`${chapterId}-${sectionIndex}`}
        className={animClass}
        style={{ paddingTop: '56px', paddingBottom: '80px', minHeight: '100vh' }}
      >
        <SectionContent
          verseText={section.ldw}
          wordForWordSanskrit={wfwSanskrit}
          wordForWordLang={wfwLang}
          translation={translation}
          purport={purport}
          language={language}
          fontSize={fontSize}
          theme={theme}
          onShare={handleShare}
          searchKeyword={searchKeyword}
          highlightKeyword={highlightKeyword}
          highlightKeywordZh={highlightKeywordZh}
          highlightKeywordEn={highlightKeywordEn}
          matchLocation={matchLocation}
        />
      </div>

      {DEV_MODE && (
        <DevPanel
          resources={[
            { name: '博伽瓦谭目录', url: `${import.meta.env.BASE_URL}data/sb_index.json`, loading: indexLoading, error: indexError, source: 'jsdelivr' as const },
            { name: cantoId ? `博伽瓦谭第${cantoId}篇` : '章节数据', url: cantoId ? `${import.meta.env.BASE_URL}data/sb/canto_${cantoId}.json` : undefined, loading: cantoLoading, error: cantoError || (!cantoLoading && !cantoData && cantoId ? '数据为空' : null), source: 'jsdelivr' as const },
          ]}
          env={{ BASE_URL: import.meta.env.BASE_URL, 主题: theme || 'light', 语言: language || 'zh', 章节ID: String(chapterId), 篇ID: String(cantoId), 节索引: String(sectionIndex) }}
          isDark={isDark}
        />
      )}

      {/* TOC Overlay */}
      <SBTableOfContents
        bookType="sb"
        cantos={cantos}
        chapters={chapters}
        cantoData={cantoData}
        chapterId={chapterId}
        sectionIndex={sectionIndex}
        cantoId={cantoId}
        language={language}
        theme={theme}
        showToc={showToc}
        onNavigate={(newChapterId, newSectionIdx, direction) => {
          setShowToc(false);
          goTo(newChapterId, newSectionIdx, direction);
        }}
        onCloseToc={() => setShowToc(false)}
        tocBg={tocBg}
        tocPanelBg={tocPanelBg}
        tocBorder={tocBorder}
        tocTextPrimary={tocTextPrimary}
        tocTextSecondary={tocTextSecondary}
        tocActiveBg={tocActiveBg}
        tocActiveColor={tocActiveColor}
      />
    </div>
  );
}
