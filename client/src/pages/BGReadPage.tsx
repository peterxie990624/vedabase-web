import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import DevPanel from '../components/DevPanel';
import SectionContent from '../components/SectionContent';
import { useBGData } from '../hooks/useData';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSettings } from '../hooks/useSettings';
import type { Language, FontSize, VedaTheme } from '../types';
import { formatSectionLabel } from '../constants';
import { toast } from 'sonner';

interface BGReadPageProps {
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
  onGoToChapter?: (chapterId: number) => void;
  searchKeyword?: string;
  // Phase 2: 多位置高亮支持
  highlightKeyword?: string;
  highlightKeywordZh?: string;  // 中文高亮关键词
  highlightKeywordEn?: string;  // 英文高亮关键词
  matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
}

const PROGRESS_KEY = 'vedabase_progress_bg';

function saveProgress(chapterId: number, sectionIndex: number, sectionId?: string) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ chapterId, sectionIndex, sectionId }));
  } catch {}
}

export default function BGReadPage({
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
  onGoToChapter,
  searchKeyword,
  highlightKeyword,
  highlightKeywordZh,
  highlightKeywordEn,
  matchLocation,
}: BGReadPageProps) {
  const { data, loading, error } = useBGData();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  // 注意：不再使用useSettings，而是从Props获取language/fontSize/theme
  // 这样确保语言状态在App.tsx中集中管理，避免状态不同步
  const [animClass, setAnimClass] = useState('fade-in');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToc, setShowToc] = useState(false);

  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const chapters = data?.chapters || [];
  const allSections = data?.sections || {};

  const chapterIdx = chapters.findIndex(c => c.id === chapterId);
  const chapter = chapters[chapterIdx];
  const sections = allSections[String(chapterId)] || [];
  const section = sections[sectionIndex];

  const hasPrev = sectionIndex > 0 || chapterIdx > 0;
  const hasNext = sectionIndex < sections.length - 1 || chapterIdx < chapters.length - 1;

  // Save progress whenever position changes
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
      const prevSections = allSections[String(prevChapter.id)] || [];
      goTo(prevChapter.id, prevSections.length - 1, 'left');
    }
  }, [sectionIndex, chapterIdx, chapterId, chapters, allSections, goTo]);

  const goNext = useCallback(() => {
    if (sectionIndex < sections.length - 1) {
      goTo(chapterId, sectionIndex + 1, 'right');
    } else if (chapterIdx < chapters.length - 1) {
      const nextChapter = chapters[chapterIdx + 1];
      goTo(nextChapter.id, 0, 'right');
    }
  }, [sectionIndex, sections.length, chapterIdx, chapterId, chapters, goTo]);

  // Touch swipe — require horizontal movement to dominate (ratio > 1.5) to avoid diagonal triggers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    // Only trigger if horizontal movement > 60px AND horizontal dominates (|dx|/|dy| > 1.5)
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

  const handleFontSize = (size: FontSize) => setFontSize(size);

  const toggleLang = () => setLanguage(language === 'zh' ? 'en' : 'zh');

  const DEV_MODE = devMode || import.meta.env.DEV;

  if (loading || error || !section) {
    return (
      <div style={{ paddingTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f1923' : 'var(--veda-bg)', gap: '16px' }}>
        <div style={{ textAlign: 'center', color: 'var(--veda-blue)' }}>
          {loading ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0' }}>{isEn ? 'Loading...' : '正在加载博伽梵歌数据...'}</div>
            </>
          ) : error ? (
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
        {DEV_MODE && (
          <DevPanel
            resources={[{ name: '博伽梵歌数据', url: `${import.meta.env.BASE_URL}data/bg_data.json`, loading, error: error || null, source: 'jsdelivr' as const }]}
            env={{ BASE_URL: import.meta.env.BASE_URL, 主题: theme || 'light', 语言: language || 'zh', 章节ID: String(chapterId), 节索引: String(sectionIndex) }}
            isDark={isDark}
          />
        )}
      </div>
    );
  }

  const sectionLabel = formatSectionLabel('bg', section.section_id, language);
  const bookmarked = isBookmarked('bg', chapterId, section.section_id);

  const wfwSanskrit = section.ldw_fc;
  const wfwLang = language === 'zh' ? section.words_zh_fc : section.words_en_fc;
  const translation = language === 'zh' ? section.yw_zh : section.yw_en;
  const purport = language === 'zh' ? section.yz_zh : section.yz_en;

  // Share handler
  const handleShare = () => {
    const verseText = section.ldw_fd || '';
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

  // Handle tap on left/right 1/3 of screen to navigate
  // 已注释掉点击屏幕左右翻页功能
  // const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
  //   const target = e.target as HTMLElement;
  //   // Don't trigger if clicking on interactive elements
  //   if (target.closest('button, a, mark, .purport-text')) return;
  //   const rect = e.currentTarget.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const third = rect.width / 3;
  //   if (x < third && hasPrev) {
  //     goPrev();
  //   } else if (x > third * 2 && hasNext) {
  //     goNext();
  //   }
  // };
  const handleContentClick = () => {};

  return (
    <div
      style={{ minHeight: '100vh', background: isDark ? '#0f1923' : 'var(--veda-bg)' }}
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
          const title_zh = formatSectionLabel('bg', section.section_id, 'zh');
          const title_en = formatSectionLabel('bg', section.section_id, 'en');
          
          // 中文preview（总是使用section.yw_zh，不管当前语言）
          const preview_zh = (section.yw_zh || '').replace(/<[^>]+>/g, '').slice(0, 50);
          
          // 英文preview（总是使用section.yw_en，不管当前语言）
          const preview_en = (section.yw_en || '').replace(/<[^>]+>/g, '').slice(0, 50);
          
          toggleBookmark({
            bookType: 'bg',
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
        ref={contentRef}
        key={`${chapterId}-${sectionIndex}`}
        className={animClass}
        style={{ paddingTop: '56px', paddingBottom: '80px', minHeight: '100vh' }}
        // onClick={handleContentClick}  // 已注释掉点击屏幕左右翻页功能
      >
        <SectionContent
          verseText={section.ldw_fd}
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

      {/* TOC Overlay */}
      {showToc && (
        <div
          style={{ position: 'fixed', inset: 0, background: tocBg, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setShowToc(false)}
        >
          <div
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
            <div style={{ padding: '16px', borderBottom: `1px solid ${tocBorder}`, position: 'sticky', top: 0, background: tocPanelBg, zIndex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: tocTextPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                {isEn ? 'Table of Contents' : '目录'}
              </div>
              <div style={{ fontSize: '0.8rem', color: tocTextSecondary, marginTop: '2px' }}>
                {isEn ? 'Bhagavad-gītā As It Is' : '博伽梵歌原义'}
              </div>
            </div>

            {/* Chapters */}
            {chapters.map(ch => {
              const chSections = allSections[String(ch.id)] || [];
              const isCurrentChapter = ch.id === chapterId;
              return (
                <div key={ch.id}>
                  {/* Chapter title — clickable to go to sections page */}
                  <div
                    style={{
                      padding: '10px 16px',
                      background: isCurrentChapter ? tocActiveBg : 'transparent',
                      borderBottom: `1px solid ${tocBorder}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setShowToc(false);
                      if (onGoToChapter) {
                        onGoToChapter(ch.id);
                      } else {
                        // fallback: jump to first section of this chapter
                        goTo(ch.id, 0, ch.id > chapterId ? 'right' : 'left');
                      }
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: tocTextSecondary }}>{ch.zh_name}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isCurrentChapter ? tocActiveColor : tocTextPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                      {isEn ? ch.en_title : ch.zh_title}
                    </div>
                  </div>

                  {/* Sections (only show for current chapter) */}
                  {isCurrentChapter && chSections.map((sec, idx) => (
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
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: idx === sectionIndex ? tocActiveColor : tocTextSecondary, minWidth: '52px' }}>
                        Bg {sec.section_id}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: idx === sectionIndex ? tocActiveColor : tocTextSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {((isEn ? sec.yw_en : sec.yw_zh) || '').replace(/<[^>]+>/g, '').trim().slice(0, 30)}
                        {idx === sectionIndex && ' ◀'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
