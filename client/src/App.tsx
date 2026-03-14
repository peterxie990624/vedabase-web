import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import BookshelfPage from './pages/BookshelfPage';
import BGChaptersPage from './pages/BGChaptersPage';
import BGSectionsPage from './pages/BGSectionsPage';
import BGReadPage from './pages/BGReadPage';
import SBCantosPage from './pages/SBCantosPage';
import SBChaptersPage from './pages/SBChaptersPage';
import SBSectionsPage from './pages/SBSectionsPage';
import SBReadPage from './pages/SBReadPage';
import AkadasiPage from './pages/AkadasiPage';
import BookmarksPage from './pages/BookmarksPage';
import SearchPage from './pages/SearchPage';
import type { SearchState } from './pages/SearchPage';
import CalendarPage from './pages/CalendarPage';
import { useSettings } from './hooks/useSettings';
import type { TabType, Bookmark } from './types';

// Route types
type Route =
  | { page: 'home' }
  | { page: 'bg-chapters' }
  | { page: 'bg-sections'; chapterId: number }
  | { page: 'bg-read'; chapterId: number; sectionIndex: number; fromSearch?: boolean }
  | { page: 'sb-cantos' }
  | { page: 'sb-chapters'; cantoId: number }
  | { page: 'sb-sections'; chapterId: number }
  | { page: 'sb-read'; chapterId: number; sectionIndex: number; fromSearch?: boolean }
  | { page: 'akadasi' };

function VedabaseApp() {
  const [activeTab, setActiveTab] = useState<TabType>('bookshelf');
  const [routeStack, setRouteStack] = useState<Route[]>([{ page: 'home' }]);
  // Persist search state so returning to search tab restores results
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    selectedBook: 'bg',
    results: [],
    searched: false,
  });

  const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();
  const currentRoute = routeStack[routeStack.length - 1];

  // Apply dark theme to document body for full-page coverage
  useEffect(() => {
    document.documentElement.setAttribute('data-veda-theme', theme);
    if (theme === 'dark') {
      document.body.style.background = '#0f1923';
    } else {
      document.body.style.background = '';
    }
  }, [theme]);

  const push = useCallback((route: Route) => {
    setRouteStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setRouteStack(prev => {
      if (prev.length <= 1) return prev;
      const leaving = prev[prev.length - 1];
      // If leaving a page that came from search, go back to search tab
      if ((leaving.page === 'bg-read' || leaving.page === 'sb-read') && leaving.fromSearch) {
        setActiveTab('search');
        return [{ page: 'home' }];
      }
      return prev.slice(0, -1);
    });
  }, []);

  const goHome = useCallback(() => {
    setRouteStack([{ page: 'home' }]);
    setActiveTab('bookshelf');
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // When switching to bookshelf tab, reset to home
    if (tab === 'bookshelf') {
      setRouteStack([{ page: 'home' }]);
    }
    // Search state is preserved when switching tabs
  }, []);

  const handleSelectBook = useCallback((bookId: string) => {
    if (bookId === 'bg') push({ page: 'bg-chapters' });
    else if (bookId === 'sb') push({ page: 'sb-cantos' });
    else if (bookId === 'akadasi') push({ page: 'akadasi' });
  }, [push]);

  const handleOpenBookmark = useCallback((bookmark: Bookmark) => {
    setActiveTab('bookshelf');
    const secIdx = bookmark.sectionIndex ?? 0;
    if (bookmark.bookType === 'bg') {
      setRouteStack([{ page: 'home' }, { page: 'bg-read', chapterId: bookmark.chapterId, sectionIndex: secIdx }]);
    } else if (bookmark.bookType === 'sb') {
      setRouteStack([{ page: 'home' }, { page: 'sb-read', chapterId: bookmark.chapterId, sectionIndex: secIdx }]);
    } else if (bookmark.bookType === 'akadasi') {
      setRouteStack([{ page: 'home' }, { page: 'akadasi' }]);
    }
  }, []);

  const handleSearchResult = useCallback((result: { bookType: 'bg' | 'sb'; chapterId: number; sectionIndex: number }) => {
    // Navigate to reading page, mark as fromSearch so back button returns to search
    setActiveTab('bookshelf');
    if (result.bookType === 'bg') {
      setRouteStack([{ page: 'home' }, { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true }]);
    } else if (result.bookType === 'sb') {
      setRouteStack([{ page: 'home' }, { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true }]);
    }
  }, []);

  const renderContent = () => {
    if (activeTab === 'bookmarks') {
      return <BookmarksPage onOpenBookmark={handleOpenBookmark} theme={theme} />;
    }
    if (activeTab === 'search') {
      return (
        <SearchPage
          onOpenResult={handleSearchResult}
          language={language}
          searchState={searchState}
          onSearchStateChange={setSearchState}
          theme={theme}
        />
      );
    }
    if (activeTab === 'calendar') {
      return <CalendarPage theme={theme} />;
    }

    switch (currentRoute.page) {
      case 'home':
        return (
          <BookshelfPage
            onSelectBook={handleSelectBook}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            setTheme={setTheme}
          />
        );

      case 'bg-chapters':
        return (
          <BGChaptersPage
            onBack={pop}
            onHome={goHome}
            onSelectChapter={chId => push({ page: 'bg-sections', chapterId: chId })}
            language={language}
            theme={theme}
          />
        );

      case 'bg-sections':
        return (
          <BGSectionsPage
            chapterId={currentRoute.chapterId}
            onBack={pop}
            onHome={goHome}
            onSelectSection={(chId, secIdx) => push({ page: 'bg-read', chapterId: chId, sectionIndex: secIdx })}
            language={language}
            theme={theme}
          />
        );

      case 'bg-read':
        return (
          <BGReadPage
            chapterId={currentRoute.chapterId}
            sectionIndex={currentRoute.sectionIndex}
            onBack={pop}
            onHome={goHome}
            onNavigate={(chId, secIdx) => {
              setRouteStack(prev => [
                ...prev.slice(0, -1),
                { page: 'bg-read', chapterId: chId, sectionIndex: secIdx, fromSearch: (currentRoute as any).fromSearch },
              ]);
            }}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
          />
        );

      case 'sb-cantos':
        return (
          <SBCantosPage
            onBack={pop}
            onHome={goHome}
            onSelectCanto={cantoId => push({ page: 'sb-chapters', cantoId })}
            language={language}
            theme={theme}
          />
        );

      case 'sb-chapters':
        return (
          <SBChaptersPage
            cantoId={currentRoute.cantoId}
            onBack={pop}
            onHome={goHome}
            onSelectChapter={chId => push({ page: 'sb-sections', chapterId: chId })}
            language={language}
            theme={theme}
          />
        );

      case 'sb-sections':
        return (
          <SBSectionsPage
            chapterId={currentRoute.chapterId}
            onBack={pop}
            onHome={goHome}
            onSelectSection={(chId, secIdx) => push({ page: 'sb-read', chapterId: chId, sectionIndex: secIdx })}
            language={language}
            theme={theme}
          />
        );

      case 'sb-read':
        return (
          <SBReadPage
            chapterId={currentRoute.chapterId}
            sectionIndex={currentRoute.sectionIndex}
            onBack={pop}
            onHome={goHome}
            onNavigate={(chId, secIdx) => {
              setRouteStack(prev => [
                ...prev.slice(0, -1),
                { page: 'sb-read', chapterId: chId, sectionIndex: secIdx, fromSearch: (currentRoute as any).fromSearch },
              ]);
            }}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
          />
        );

      case 'akadasi':
        return <AkadasiPage onBack={pop} onHome={goHome} theme={theme} />;

      default:
        return (
          <BookshelfPage
            onSelectBook={handleSelectBook}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            setTheme={setTheme}
          />
        );
    }
  };

  return (
    <>
      <div
        data-veda-theme={theme}
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          position: 'relative',
          minHeight: '100vh',
          background: 'var(--veda-bg)',
        }}
      >
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} theme={theme} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <VedabaseApp />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
