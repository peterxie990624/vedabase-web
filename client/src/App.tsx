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

type TabRoute = 'bookshelf' | 'bookmarks' | 'search' | 'calendar';

// ─── Hash 解析与序列化 ───────────────────────────────────────────────────────

function routeToHash(route: Route, tab: TabType): string {
  if (tab === 'bookmarks') return '#/bookmarks';
  if (tab === 'search') return '#/search';
  if (tab === 'calendar') return '#/calendar';

  switch (route.page) {
    case 'home':        return '#/';
    case 'bg-chapters': return '#/bg';
    case 'bg-sections': return `#/bg/${route.chapterId}`;
    case 'bg-read':     return `#/bg/${route.chapterId}/${route.sectionIndex}`;
    case 'sb-cantos':   return '#/sb';
    case 'sb-chapters': return `#/sb/${route.cantoId}`;
    case 'sb-sections': return `#/sb/c${route.chapterId}`;
    case 'sb-read':     return `#/sb/c${route.chapterId}/${route.sectionIndex}`;
    case 'akadasi':     return '#/akadasi';
    default:            return '#/';
  }
}

function hashToState(hash: string): { route: Route; tab: TabType } {
  const path = hash.replace(/^#\/?/, '') || '';
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'bookmarks') return { route: { page: 'home' }, tab: 'bookmarks' };
  if (parts[0] === 'search')    return { route: { page: 'home' }, tab: 'search' };
  if (parts[0] === 'calendar')  return { route: { page: 'home' }, tab: 'calendar' };
  if (parts[0] === 'akadasi')   return { route: { page: 'akadasi' }, tab: 'bookshelf' };

  if (parts[0] === 'bg') {
    if (!parts[1]) return { route: { page: 'bg-chapters' }, tab: 'bookshelf' };
    const chapterId = parseInt(parts[1], 10);
    if (!parts[2]) return { route: { page: 'bg-sections', chapterId }, tab: 'bookshelf' };
    const sectionIndex = parseInt(parts[2], 10);
    return { route: { page: 'bg-read', chapterId, sectionIndex }, tab: 'bookshelf' };
  }

  if (parts[0] === 'sb') {
    if (!parts[1]) return { route: { page: 'sb-cantos' }, tab: 'bookshelf' };
    // sb/2 → cantos page (cantoId=2), sb/c15 → chapters page (chapterId=15)
    if (parts[1].startsWith('c')) {
      const chapterId = parseInt(parts[1].slice(1), 10);
      if (!parts[2]) return { route: { page: 'sb-sections', chapterId }, tab: 'bookshelf' };
      const sectionIndex = parseInt(parts[2], 10);
      return { route: { page: 'sb-read', chapterId, sectionIndex }, tab: 'bookshelf' };
    }
    const cantoId = parseInt(parts[1], 10);
    return { route: { page: 'sb-chapters', cantoId }, tab: 'bookshelf' };
  }

  return { route: { page: 'home' }, tab: 'bookshelf' };
}

// ─── Main App Component ──────────────────────────────────────────────────────

function VedabaseApp() {
  // Initialize state from current hash (supports page refresh)
  const getInitialState = () => {
    const hash = window.location.hash || '#/';
    return hashToState(hash);
  };

  const initial = getInitialState();
  const [activeTab, setActiveTab] = useState<TabType>(initial.tab);
  const [routeStack, setRouteStack] = useState<Route[]>([{ page: 'home' }, ...(initial.route.page !== 'home' ? [initial.route] : [])]);

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    selectedBook: 'bg',
    results: [],
    searched: false,
  });

  const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();
  const currentRoute = routeStack[routeStack.length - 1];

  // Apply dark theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-veda-theme', theme);
    if (theme === 'dark') {
      document.body.style.background = '#0f1923';
    } else {
      document.body.style.background = '';
    }
  }, [theme]);

  // Sync hash → state when user presses browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash || '#/';
      const { route, tab } = hashToState(hash);
      setActiveTab(tab);
      if (tab === 'bookshelf') {
        setRouteStack([{ page: 'home' }, ...(route.page !== 'home' ? [route] : [])]);
      } else {
        setRouteStack([{ page: 'home' }]);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Sync state → hash whenever route or tab changes
  useEffect(() => {
    const newHash = routeToHash(currentRoute, activeTab);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [currentRoute, activeTab]);

  // ─── Navigation helpers ──────────────────────────────────────────────────

  const push = useCallback((route: Route) => {
    setRouteStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setRouteStack(prev => {
      if (prev.length <= 1) return prev;
      const leaving = prev[prev.length - 1];
      if ((leaving.page === 'bg-read' || leaving.page === 'sb-read') && (leaving as any).fromSearch) {
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
    if (tab === 'bookshelf') {
      setRouteStack([{ page: 'home' }]);
    }
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
    setActiveTab('bookshelf');
    if (result.bookType === 'bg') {
      setRouteStack([{ page: 'home' }, { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true }]);
    } else if (result.bookType === 'sb') {
      setRouteStack([{ page: 'home' }, { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true }]);
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

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
