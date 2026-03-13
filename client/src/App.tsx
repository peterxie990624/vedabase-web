import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useState, useCallback } from 'react';
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
import CalendarPage from './pages/CalendarPage';
import { useSettings } from './hooks/useSettings';
import type { TabType, Bookmark } from './types';

// Route types
type Route =
  | { page: 'home' }
  | { page: 'bg-chapters' }
  | { page: 'bg-sections'; chapterId: number }
  | { page: 'bg-read'; chapterId: number; sectionIndex: number }
  | { page: 'sb-cantos' }
  | { page: 'sb-chapters'; cantoId: number }
  | { page: 'sb-sections'; chapterId: number }
  | { page: 'sb-read'; chapterId: number; sectionIndex: number }
  | { page: 'akadasi' };

function VedabaseApp() {
  const [activeTab, setActiveTab] = useState<TabType>('bookshelf');
  const [routeStack, setRouteStack] = useState<Route[]>([{ page: 'home' }]);
  const { language } = useSettings();

  const currentRoute = routeStack[routeStack.length - 1];

  const push = useCallback((route: Route) => {
    setRouteStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setRouteStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);

  const goHome = useCallback(() => {
    setRouteStack([{ page: 'home' }]);
    setActiveTab('bookshelf');
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setRouteStack([{ page: 'home' }]);
  }, []);

  const handleSelectBook = useCallback((bookId: string) => {
    if (bookId === 'bg') push({ page: 'bg-chapters' });
    else if (bookId === 'sb') push({ page: 'sb-cantos' });
    else if (bookId === 'akadasi') push({ page: 'akadasi' });
  }, [push]);

  const handleOpenBookmark = useCallback((bookmark: Bookmark) => {
    setActiveTab('bookshelf');
    if (bookmark.bookType === 'bg') {
      setRouteStack([{ page: 'home' }, { page: 'bg-read', chapterId: bookmark.chapterId, sectionIndex: 0 }]);
    } else if (bookmark.bookType === 'sb') {
      setRouteStack([{ page: 'home' }, { page: 'sb-read', chapterId: bookmark.chapterId, sectionIndex: 0 }]);
    } else if (bookmark.bookType === 'akadasi') {
      setRouteStack([{ page: 'home' }, { page: 'akadasi' }]);
    }
  }, []);

  const handleSearchResult = useCallback((result: { bookType: 'bg' | 'sb'; chapterId: number; sectionIndex: number }) => {
    setActiveTab('bookshelf');
    if (result.bookType === 'bg') {
      setRouteStack([{ page: 'home' }, { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex }]);
    } else if (result.bookType === 'sb') {
      setRouteStack([{ page: 'home' }, { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex }]);
    }
  }, []);

  const renderContent = () => {
    if (activeTab === 'bookmarks') {
      return <BookmarksPage onOpenBookmark={handleOpenBookmark} />;
    }
    if (activeTab === 'search') {
      return <SearchPage onOpenResult={handleSearchResult} language={language} />;
    }
    if (activeTab === 'calendar') {
      return <CalendarPage />;
    }

    switch (currentRoute.page) {
      case 'home':
        return <BookshelfPage onSelectBook={handleSelectBook} />;

      case 'bg-chapters':
        return (
          <BGChaptersPage
            onBack={pop}
            onHome={goHome}
            onSelectChapter={chId => push({ page: 'bg-sections', chapterId: chId })}
            language={language}
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
                { page: 'bg-read', chapterId: chId, sectionIndex: secIdx },
              ]);
            }}
          />
        );

      case 'sb-cantos':
        return (
          <SBCantosPage
            onBack={pop}
            onHome={goHome}
            onSelectCanto={cantoId => push({ page: 'sb-chapters', cantoId })}
            language={language}
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
                { page: 'sb-read', chapterId: chId, sectionIndex: secIdx },
              ]);
            }}
          />
        );

      case 'akadasi':
        return <AkadasiPage onBack={pop} onHome={goHome} />;

      default:
        return <BookshelfPage onSelectBook={handleSelectBook} />;
    }
  };

  return (
    <>
      <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: 'var(--veda-bg)' }}>
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <VedabaseApp />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
