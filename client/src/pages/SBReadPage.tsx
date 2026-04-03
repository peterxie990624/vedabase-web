import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import DevPanel from '../components/DevPanel';
import SectionContent from '../components/SectionContent';
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
  const [stickyCantoTitle, setStickyCantoTitle] = useState<string | null>(null);
  const [stickyChapterTitle, setStickyChapterTitle] = useState<string | null>(null);
  const [expandedCantos, setExpandedCantos] = useState<Set<number>>(new Set());
  const [currentCantoId, setCurrentCantoId] = useState<number | null>(null);

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

  // 处理目录滑动时的浮动块显示
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const handleScroll = () => {
      const container = tocContainerRef.current;
      if (!container) return;

      // 查找最后一个已经滑出顶部的篇和章标题（即当前正在滑出的）
      const cantoElements = container.querySelectorAll('[data-canto-id]');
      const chapterElements = container.querySelectorAll('[data-chapter-id]');
      
      let visibleCanto: string | null = null;
      let visibleChapter: string | null = null;

      // 找最后一个已经滑出顶部的篇（rect.top < containerRect.top + 60）
      for (const el of cantoElements) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top < containerRect.top + 60) {
          visibleCanto = el.getAttribute('data-canto-title');
        }
      }

      // 找最后一个已经滑出顶部的章（rect.top < containerRect.top + 120）
      for (const el of chapterElements) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top < containerRect.top + 120) {
          visibleChapter = el.getAttribute('data-chapter-title');
        }
      }

      setStickyCantoTitle(visibleCanto);
      setStickyChapterTitle(visibleChapter);
    };

    const container = tocContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [showToc]);

  // 打开目录时自动滑动到当前章节
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const timer = setTimeout(() => {
      const container = tocContainerRef.current;
      if (!container) return;

      const currentChapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
      if (currentChapterEl) {
        currentChapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showToc, chapterId]);

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
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
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
        onToc={() => setShowToc(true)}
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
      {showToc && (
        <div
          style={{ position: 'fixed', inset: 0, background: tocBg, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setShowToc(false)}
        >
          <div
            ref={tocContainerRef}
            style={{
              width: '80%',
              maxWidth: '360px',
              height: '100%',
              background: tocPanelBg,
              borderLeft: `1px solid ${tocBorder}`,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* TOC header */}
            <div style={{ padding: '16px', borderBottom: `1px solid ${tocBorder}`, position: 'sticky', top: 0, background: tocPanelBg, zIndex: 11 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: tocTextPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                {isEn ? 'Table of Contents' : '目录'}
              </div>
              <div style={{ fontSize: '0.8rem', color: tocTextSecondary, marginTop: '2px' }}>
                {isEn ? 'Śrīmad-Bhāgavatam' : '圣典博伽瓦谭'}
              </div>
            </div>

            {/* 浮动块：显示当前篇标题 */}
            {stickyCantoTitle && (
              <div style={{
                position: 'sticky',
                top: '60px',
                background: isDark ? 'rgba(15, 25, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderBottom: `2px solid ${isDark ? '#d4a017' : '#b8860b'}`,
                padding: '12px 16px',
                zIndex: 10,
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isDark ? '#d4a017' : '#b8860b',
                  fontFamily: "'Noto Serif SC', serif",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {stickyCantoTitle}
                </div>
              </div>
            )}

            {/* 浮动块：显示当前章标题 */}
            {stickyChapterTitle && (
              <div style={{
                position: 'sticky',
                top: stickyCantoTitle ? '120px' : '60px',
                background: isDark ? 'rgba(15, 25, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderBottom: `1.5px solid ${isDark ? '#c8a84b' : '#a08030'}`,
                padding: '8px 16px',
                zIndex: 9,
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isDark ? '#c8a84b' : '#a08030',
                  fontFamily: "'Noto Serif SC', serif",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {stickyChapterTitle}
                </div>
              </div>
            )}

            {/* Cantos */}
            {cantos.map(canto => {
              const cantoChapters = chapters.filter(c => c.canto_id === canto.id);
              const isCurrentCanto = cantoId === canto.id;
              const isExpanded = expandedCantos.has(canto.id);
              // 组合篇名和副标题
              const cantoLabel = isEn ? canto.en_name : canto.zh_name;
              const cantoSubtitle = isEn ? (canto.en_subtitle || '') : (canto.zh_subtitle || '');
              const cantoTitle = cantoSubtitle ? `${cantoLabel} ${cantoSubtitle}` : cantoLabel;
              return (
                <div key={canto.id}>
                  <div
                    data-canto-id={canto.id}
                    data-canto-title={cantoTitle}
                    style={{ padding: '8px 16px', background: isCurrentCanto ? tocActiveBg : (isDark ? '#0f1923' : '#f5f7fa'), borderBottom: `1px solid ${tocBorder}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCantoExpand(canto.id);
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrentCanto ? tocActiveColor : tocTextSecondary, letterSpacing: '0.05em', flex: 1 }}>
                      {cantoTitle}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isCurrentCanto ? tocActiveColor : tocTextSecondary, marginLeft: '8px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                  {isExpanded && cantoChapters.map(ch => {
                    const isCurrentChapter = ch.id === chapterId;
                    const chSections = isCurrentChapter ? sections : [];
                    // 组合章名和章节标题
                    const chapterName = isEn ? ch.en_name : ch.zh_name;
                    const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');
                    const fullChapterTitle = `${chapterName} ${chapterTitle}`;
                    return (
                      <div key={ch.id}>
                        <div
                          data-chapter-id={ch.id}
                          data-chapter-title={fullChapterTitle}
                          style={{
                            padding: '10px 16px',
                            background: isCurrentChapter ? tocActiveBg : 'transparent',
                            borderBottom: `1px solid ${tocBorder}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setShowToc(false);
                            if (onGoToCanto) {
                              onGoToCanto(ch.canto_id);
                            } else {
                              goTo(ch.id, 0, ch.id > chapterId ? 'right' : 'left');
                            }
                          }}
                        >
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isCurrentChapter ? tocActiveColor : tocTextPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                            {fullChapterTitle}
                          </div>
                        </div>

                        {/* Sections for current chapter only */}
                        {isCurrentChapter && chSections && chSections.map((sec, idx) => (
                          <div
                            key={sec.id}
                            style={{
                              padding: '8px 16px 8px 28px',
                              background: idx === sectionIndex ? tocActiveBg : 'transparent',
                              borderBottom: `1px solid ${isDark ? '#1a2535' : '#f5f7fa'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                            onClick={() => {
                              setShowToc(false);
                              goTo(chapterId, idx, idx > sectionIndex ? 'right' : 'left');
                            }}
                          >
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: idx === sectionIndex ? tocActiveColor : tocTextSecondary, minWidth: '60px' }}>
                              SB {sec.section_id}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: idx === sectionIndex ? tocActiveColor : tocTextSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {((isEn ? sec.yw_en : sec.yw_zh) || '').replace(/<[^>]+>/g, '').trim().slice(0, 28)}
                              {idx === sectionIndex && ' ◀'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
