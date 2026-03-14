import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import DevPanel from '../components/DevPanel';
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
  const { data: index, loading: indexLoading, error: indexError } = useSBIndex();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { language, setLanguage, fontSize, setFontSize, theme } = useSettings();
  const [animClass, setAnimClass] = useState('fade-in');
  const touchStartX = useRef<number | null>(null);

  const isDark = theme === 'dark';

  const chapter = index?.chapters.find(c => c.id === chapterId);
  const cantoId = chapter?.canto_id || null;
  const { data: cantoData, loading: cantoLoading, error: cantoError } = useSBCantoData(cantoId);
  const loading = indexLoading || cantoLoading;

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

  const DEV_MODE = import.meta.env.DEV;

  if (loading || indexError || cantoError || !section) {
    const resourceStatus = [
      {
        name: '博伽瓦谭目录',
        url: `${import.meta.env.BASE_URL}data/sb_index.json`,
        loading: indexLoading,
        error: indexError,
        source: 'jsdelivr' as const,
      },
      {
        name: cantoId ? `博伽瓦谭第${cantoId}篇` : '章节数据',
        url: cantoId ? `${import.meta.env.BASE_URL}data/sb/canto_${cantoId}.json` : undefined,
        loading: cantoLoading,
        error: cantoError || (!cantoLoading && !cantoData && cantoId ? '数据为空' : null),
        source: 'jsdelivr' as const,
      },
    ];
    const hasError = !!(indexError || cantoError);
    return (
      <div style={{ paddingTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f1923' : 'var(--veda-bg)', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0' }}>
                {indexLoading ? '正在加载目录...' : `正在加载第${cantoId}篇数据...`}
              </div>
            </>
          ) : hasError ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <div style={{ color: '#e05050', fontWeight: 600 }}>加载失败</div>
              {DEV_MODE && <div style={{ color: isDark ? '#8aa0b4' : '#6a8aa0', fontSize: '13px', marginTop: '8px', maxWidth: '280px' }}>{indexError || cantoError}</div>}
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
              篇ID: String(cantoId),
              节索引: String(sectionIndex),
            }}
            isDark={isDark}
          />
        )}
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
