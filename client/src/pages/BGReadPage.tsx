import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import DevPanel from '../components/DevPanel';
import SectionContent from '../components/SectionContent';
import { useBGData } from '../hooks/useData';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSettings } from '../hooks/useSettings';
import type { Language, FontSize, VedaTheme } from '../types';

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
}

const fontSizeCycle: FontSize[] = ['sm', 'md', 'lg', 'xl'];

export default function BGReadPage({
  chapterId,
  sectionIndex,
  onBack,
  onHome,
  onNavigate,
}: BGReadPageProps) {
  const { data, loading, error } = useBGData();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { language, setLanguage, fontSize, setFontSize, theme } = useSettings();
  const [animClass, setAnimClass] = useState('fade-in');
  const touchStartX = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const chapters = data?.chapters || [];
  const allSections = data?.sections || {};

  // Get current chapter index
  const chapterIdx = chapters.findIndex(c => c.id === chapterId);
  const chapter = chapters[chapterIdx];
  const sections = allSections[String(chapterId)] || [];
  const section = sections[sectionIndex];

  // Navigation logic
  const hasPrev = sectionIndex > 0 || chapterIdx > 0;
  const hasNext = sectionIndex < sections.length - 1 || chapterIdx < chapters.length - 1;

  const goTo = useCallback((newChapterId: number, newSectionIdx: number, direction: 'left' | 'right') => {
    setAnimClass(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
    onNavigate(newChapterId, newSectionIdx);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
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

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && hasNext) goNext();
      else if (diff < 0 && hasPrev) goPrev();
    }
    touchStartX.current = null;
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

  const cycleFontSize = () => {
    const idx = fontSizeCycle.indexOf(fontSize);
    setFontSize(fontSizeCycle[(idx + 1) % fontSizeCycle.length]);
  };

  const toggleLang = () => setLanguage(language === 'zh' ? 'en' : 'zh');

  const DEV_MODE = import.meta.env.DEV;

  if (loading || error || !section) {
    const resourceStatus = [{
      name: '博伽梵歌数据',
      url: `${import.meta.env.BASE_URL}data/bg_data.json`,
      loading: loading,
      error: error || (!loading && !data ? '数据为空，请检查文件路径' : null),
      source: 'jsdelivr' as const,
    }];
    return (
      <div style={{ paddingTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f1923' : 'var(--veda-bg)', gap: '16px' }}>
        <div style={{ textAlign: 'center', color: 'var(--veda-blue)' }}>
          {loading ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0' }}>正在加载博伽梵歌数据...</div>
            </>
          ) : error ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <div style={{ color: '#e05050', fontWeight: 600 }}>加载失败</div>
              {DEV_MODE && <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0', fontSize: '13px', marginTop: '8px', maxWidth: '280px' }}>{error}</div>}
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😔</div>
              <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0' }}>内容未找到</div>
            </>
          )}
        </div>
        {DEV_MODE && (
          <DevPanel
            resources={resourceStatus}
            env={{
              BASE_URL: import.meta.env.BASE_URL,
              主题: theme || 'light',
              语言: language || 'zh',
              章节ID: String(chapterId),
              节索引: String(sectionIndex),
            }}
            isDark={isDark}
          />
        )}
      </div>
    );
  }

  const sectionLabel = `Bg ${section.section_id}`;
  const bookmarked = isBookmarked('bg', chapterId, section.section_id);

  // Get word-for-word based on language
  const wfwSanskrit = section.ldw_fc;
  const wfwLang = language === 'zh' ? section.words_zh_fc : section.words_en_fc;
  const translation = language === 'zh' ? section.yw_zh : section.yw_en;
  const purport = language === 'zh' ? section.yz_zh : section.yz_en;

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
          const preview = (translation || '').replace(/<[^>]+>/g, '').slice(0, 50);
          toggleBookmark({
            bookType: 'bg',
            chapterId,
            sectionId: section.section_id,
            sectionIndex,  // ← 精确保存sectionIndex，修复书签跳转bug
            title: sectionLabel,
            preview,
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
        onFontSize={cycleFontSize}
        theme={theme}
      />

      <div
        ref={contentRef}
        key={`${chapterId}-${sectionIndex}`}
        className={animClass}
        style={{ paddingTop: '56px', paddingBottom: '80px', minHeight: '100vh' }}
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
        />
      </div>
    </div>
  );
}
