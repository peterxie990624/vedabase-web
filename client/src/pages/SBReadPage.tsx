import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import SectionContent from '../components/SectionContent';
import { useSBIndex, useSBCantoData } from '../hooks/useData';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSettings } from '../hooks/useSettings';
import type { Language, FontSize, VedaTheme } from '../types';

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
}

const fontSizeCycle: FontSize[] = ['sm', 'md', 'lg', 'xl'];

export default function SBReadPage({
  chapterId,
  sectionIndex,
  onBack,
  onHome,
  onNavigate,
}: SBReadPageProps) {
  const { data: index } = useSBIndex();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { language, setLanguage, fontSize, setFontSize, theme } = useSettings();
  const [animClass, setAnimClass] = useState('fade-in');
  const touchStartX = useRef<number | null>(null);

  const isDark = theme === 'dark';

  const chapter = index?.chapters.find(c => c.id === chapterId);
  const cantoId = chapter?.canto_id || null;
  const { data: cantoData, loading } = useSBCantoData(cantoId);

  const chapters = index?.chapters || [];
  const sections = cantoData?.sections[String(chapterId)] || [];
  const section = sections[sectionIndex];

  // Navigation
  const chapterIdx = chapters.findIndex(c => c.id === chapterId);
  const hasPrev = sectionIndex > 0 || chapterIdx > 0;
  const hasNext = sectionIndex < sections.length - 1 || chapterIdx < chapters.length - 1;

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

  if (loading || !section) {
    return (
      <div style={{
        paddingTop: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: isDark ? '#0f1923' : 'white',
      }}>
        <div style={{ textAlign: 'center', color: isDark ? '#c8a84b' : 'var(--veda-blue)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  const sectionLabel = `SB ${section.section_id}`;
  const bookmarked = isBookmarked('sb', chapterId, section.section_id);

  // SB: use ldw_fc for Sanskrit, words_en_fc for English word-for-word
  // (SB has no Chinese word-for-word in the database)
  const wfwSanskrit = section.ldw_fc;
  // Always use English word-for-word for SB (no Chinese available in DB)
  const wfwLang = section.words_en_fc;
  const translation = language === 'zh' ? section.yw_zh : section.yw_en;
  const purport = language === 'zh' ? section.yz_zh : section.yz_en;

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
          const preview = (translation || '').replace(/<[^>]+>/g, '').slice(0, 50);
          toggleBookmark({
            bookType: 'sb',
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
        onLanguageToggle={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
        fontSize={fontSize}
        onFontSize={cycleFontSize}
        theme={theme}
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
        />
      </div>
    </div>
  );
}
