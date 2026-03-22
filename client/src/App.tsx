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
  | { page: 'bg-read'; chapterId: number; sectionIndex: number; fromSearch?: boolean; fromBookmark?: boolean; searchKeyword?: string }
  | { page: 'sb-cantos' }
  | { page: 'sb-chapters'; cantoId: number }
  | { page: 'sb-sections'; chapterId: number }
  | { page: 'sb-read'; chapterId: number; sectionIndex: number; fromSearch?: boolean; fromBookmark?: boolean; searchKeyword?: string }
  | { page: 'akadasi'; selectedId?: number };

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
    case 'akadasi':     return route.selectedId ? `#/akadasi/${route.selectedId}` : '#/akadasi';
    default:            return '#/';
  }
}

function hashToState(hash: string): { stack: Route[]; tab: TabType } {
  // Strip #dev suffix before parsing
  const cleanHash = hash.replace(/#dev$/, '').replace(/#dev\//, '#/');
  const path = cleanHash.replace(/^#\/?/, '') || '';
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'bookmarks') return { stack: [{ page: 'home' }], tab: 'bookmarks' };
  if (parts[0] === 'search')    return { stack: [{ page: 'home' }], tab: 'search' };
  if (parts[0] === 'calendar')  return { stack: [{ page: 'home' }], tab: 'calendar' };
  if (parts[0] === 'akadasi') {
    const selectedId = parts[1] ? parseInt(parts[1], 10) : undefined;
    return { stack: [{ page: 'home' }, { page: 'akadasi', selectedId }], tab: 'bookshelf' };
  }

  if (parts[0] === 'bg') {
    if (!parts[1]) {
      return { stack: [{ page: 'home' }, { page: 'bg-chapters' }], tab: 'bookshelf' };
    }
    const chapterId = parseInt(parts[1], 10);
    if (!parts[2]) {
      return {
        stack: [{ page: 'home' }, { page: 'bg-chapters' }, { page: 'bg-sections', chapterId }],
        tab: 'bookshelf',
      };
    }
    const sectionIndex = parseInt(parts[2], 10);
    return {
      stack: [
        { page: 'home' },
        { page: 'bg-chapters' },
        { page: 'bg-sections', chapterId },
        { page: 'bg-read', chapterId, sectionIndex },
      ],
      tab: 'bookshelf',
    };
  }

  if (parts[0] === 'sb') {
    if (!parts[1]) {
      return { stack: [{ page: 'home' }, { page: 'sb-cantos' }], tab: 'bookshelf' };
    }

    if (!parts[1].startsWith('c')) {
      const cantoId = parseInt(parts[1], 10);
      if (!parts[2]) {
        return {
          stack: [{ page: 'home' }, { page: 'sb-cantos' }, { page: 'sb-chapters', cantoId }],
          tab: 'bookshelf',
        };
      }
      if (parts[2].startsWith('c')) {
        const chapterId = parseInt(parts[2].slice(1), 10);
        if (!parts[3]) {
          return {
            stack: [
              { page: 'home' },
              { page: 'sb-cantos' },
              { page: 'sb-chapters', cantoId },
              { page: 'sb-sections', chapterId },
            ],
            tab: 'bookshelf',
          };
        }
        const sectionIndex = parseInt(parts[3], 10);
        return {
          stack: [
            { page: 'home' },
            { page: 'sb-cantos' },
            { page: 'sb-chapters', cantoId },
            { page: 'sb-sections', chapterId },
            { page: 'sb-read', chapterId, sectionIndex },
          ],
          tab: 'bookshelf',
        };
      }
      return {
        stack: [{ page: 'home' }, { page: 'sb-cantos' }, { page: 'sb-chapters', cantoId }],
        tab: 'bookshelf',
      };
    }

    const chapterId = parseInt(parts[1].slice(1), 10);
    if (!parts[2]) {
      return {
        stack: [
          { page: 'home' },
          { page: 'sb-cantos' },
          { page: 'sb-sections', chapterId },
        ],
        tab: 'bookshelf',
      };
    }
    const sectionIndex = parseInt(parts[2], 10);
    return {
      stack: [
        { page: 'home' },
        { page: 'sb-cantos' },
        { page: 'sb-sections', chapterId },
        { page: 'sb-read', chapterId, sectionIndex },
      ],
      tab: 'bookshelf',
    };
  }

  return { stack: [{ page: 'home' }], tab: 'bookshelf' };
}

// ─── Dev mode detection ──────────────────────────────────────────────────────
function isDevMode(): boolean {
  return window.location.hash.includes('#dev') || import.meta.env.DEV;
}

// ─── Main App Component ──────────────────────────────────────────────────────

function VedabaseApp() {
  const getInitialState = () => {
    const hash = window.location.hash || '#/';
    return hashToState(hash);
  };

  const initial = getInitialState();
  const [activeTab, setActiveTab] = useState<TabType>(initial.tab);
  const [routeStack, setRouteStack] = useState<Route[]>(initial.stack);
  const [devMode, setDevMode] = useState(isDevMode);

  // 保存书架页的路由栈（切换tab时保留阅读位置）
  const [bookshelfRouteStack, setBookshelfRouteStack] = useState<Route[]>(
    initial.tab === 'bookshelf' ? initial.stack : [{ page: 'home' }]
  );

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    selectedBook: 'bg',
    results: [],
    searched: false,
  });

  // 爱卡达西阅读位置：独立于路由栈，切换 tab 后能恢复
  const [akadasiSelectedId, setAkadasiSelectedId] = useState<number | null>(null);

  const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();
  const currentRoute = routeStack[routeStack.length - 1];

  useEffect(() => {
    document.documentElement.setAttribute('data-veda-theme', theme);
    if (theme === 'dark') {
      document.body.style.background = '#0f1923';
    } else {
      document.body.style.background = '';
    }
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => {
      setDevMode(isDevMode());
      const hash = window.location.hash || '#/';
      const { stack, tab } = hashToState(hash);
      setActiveTab(tab);
      setRouteStack(stack);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const newHash = routeToHash(currentRoute, activeTab);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [currentRoute, activeTab]);

  // ─── Navigation helpers ──────────────────────────────────────────────────

  const push = useCallback((route: Route) => {
    setRouteStack(prev => {
      const next = [...prev, route];
      setBookshelfRouteStack(next);
      return next;
    });
  }, []);

  const pop = useCallback(() => {
    setRouteStack(prev => {
      if (prev.length <= 1) return prev;
      const leaving = prev[prev.length - 1];

      // 从搜索结果进入阅读页，返回时回到搜索页
      if ((leaving.page === 'bg-read' || leaving.page === 'sb-read') && (leaving as any).fromSearch) {
        setActiveTab('search');
        const newStack: Route[] = [{ page: 'home' }];
        setBookshelfRouteStack(newStack);
        return newStack;
      }

      // 从书签进入阅读页，返回时回到书签页
      if ((leaving.page === 'bg-read' || leaving.page === 'sb-read') && (leaving as any).fromBookmark) {
        setActiveTab('bookmarks');
        const newStack: Route[] = [{ page: 'home' }];
        setBookshelfRouteStack(newStack);
        return newStack;
      }

      const newStack = prev.slice(0, -1);
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }, []);

  const goHome = useCallback(() => {
    const newStack: Route[] = [{ page: 'home' }];
    setRouteStack(newStack);
    setBookshelfRouteStack(newStack);
    setActiveTab('bookshelf');
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === activeTab) {
      // 重复点击当前 tab：回到该 tab 的根页面
      if (tab === 'bookshelf') {
        const newStack: Route[] = [{ page: 'home' }];
        setRouteStack(newStack);
        setBookshelfRouteStack(newStack);
      } else if (tab === 'search') {
        // 重置搜索页到初始状态
        setSearchState({ query: '', selectedBook: 'bg', results: [], searched: false });
      }
      // bookmarks 和 calendar 重复点击不需要特殊处理（只有一个页面）
      return;
    }
    setActiveTab(tab);
    if (tab === 'bookshelf') {
      // 切回书架 tab 时，始终回到书架首页
      // （爱卡达西的阅读位置通过 initialSelectedId + onSelectedIdChange 单独维护）
      const newStack: Route[] = [{ page: 'home' }];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    }
  }, [activeTab]);

  const handleSelectBook = useCallback((bookId: string) => {
    if (bookId === 'bg') {
      // 直接进入章节列表，不恢复进度（进度只用于"继续阅读"按钮）
      push({ page: 'bg-chapters' });
    } else if (bookId === 'sb') {
      // 直接进入篇列表，不恢复进度
      push({ page: 'sb-cantos' });
    } else if (bookId === 'akadasi') {
      push({ page: 'akadasi' });
    }
  }, [push]);

  // 继续阅读：从 localStorage 恢复上次阅读位置
  const handleContinueReading = useCallback((bookId: string) => {
    if (bookId === 'bg') {
      try {
        const saved = localStorage.getItem('vedabase_progress_bg');
        if (saved) {
          const { chapterId, sectionIndex } = JSON.parse(saved);
          if (chapterId && sectionIndex !== undefined) {
            push({ page: 'bg-read', chapterId, sectionIndex });
            return;
          }
        }
      } catch {}
      push({ page: 'bg-chapters' });
    } else if (bookId === 'sb') {
      try {
        const saved = localStorage.getItem('vedabase_progress_sb');
        if (saved) {
          const { chapterId, sectionIndex } = JSON.parse(saved);
          if (chapterId && sectionIndex !== undefined) {
            push({ page: 'sb-read', chapterId, sectionIndex });
            return;
          }
        }
      } catch {}
      push({ page: 'sb-cantos' });
    }
  }, [push]);

  const handleOpenBookmark = useCallback((bookmark: Bookmark) => {
    // 先切换到书架 tab，然后设置路由栈（带 fromBookmark 标记）
    setActiveTab('bookshelf');
    const secIdx = bookmark.sectionIndex ?? 0;
    if (bookmark.bookType === 'bg') {
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'bg-chapters' },
        { page: 'bg-sections', chapterId: bookmark.chapterId },
        { page: 'bg-read', chapterId: bookmark.chapterId, sectionIndex: secIdx, fromBookmark: true },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    } else if (bookmark.bookType === 'sb') {
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'sb-cantos' },
        { page: 'sb-sections', chapterId: bookmark.chapterId },
        { page: 'sb-read', chapterId: bookmark.chapterId, sectionIndex: secIdx, fromBookmark: true },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    } else if (bookmark.bookType === 'akadasi') {
      const newStack: Route[] = [{ page: 'home' }, { page: 'akadasi' }];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    }
  }, []);

  const handleSearchResult = useCallback((result: { bookType: 'bg' | 'sb'; chapterId: number; sectionIndex: number; searchKeyword?: string }) => {
    // 切换到书架 tab 显示阅读页，通过 fromSearch 标记返回时回到搜索页
    setActiveTab('bookshelf');
    if (result.bookType === 'bg') {
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true, searchKeyword: result.searchKeyword },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    } else if (result.bookType === 'sb') {
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, fromSearch: true, searchKeyword: result.searchKeyword },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
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
          devMode={devMode}
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
            onContinueReading={handleContinueReading}
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
              setRouteStack(prev => {
                const newStack = [
                  ...prev.slice(0, -1),
                  { page: 'bg-read' as const, chapterId: chId, sectionIndex: secIdx, fromSearch: (currentRoute as any).fromSearch, fromBookmark: (currentRoute as any).fromBookmark },
                ];
                setBookshelfRouteStack(newStack);
                return newStack;
              });
            }}
            onGoToChapter={(chId) => {
              // 目录点击章标题 → 跳转到该章的节列表页
              const newStack: Route[] = [
                { page: 'home' },
                { page: 'bg-chapters' },
                { page: 'bg-sections', chapterId: chId },
              ];
              setRouteStack(newStack);
              setBookshelfRouteStack(newStack);
            }}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            devMode={devMode}
            searchKeyword={(currentRoute as any).searchKeyword}
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
              setRouteStack(prev => {
                const newStack = [
                  ...prev.slice(0, -1),
                  { page: 'sb-read' as const, chapterId: chId, sectionIndex: secIdx, fromSearch: (currentRoute as any).fromSearch, fromBookmark: (currentRoute as any).fromBookmark },
                ];
                setBookshelfRouteStack(newStack);
                return newStack;
              });
            }}
            onGoToCanto={(cantoId) => {
              // 目录点击篇标题 → 跳转到该篇的章列表页
              const newStack: Route[] = [
                { page: 'home' },
                { page: 'sb-cantos' },
                { page: 'sb-chapters', cantoId },
              ];
              setRouteStack(newStack);
              setBookshelfRouteStack(newStack);
            }}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            devMode={devMode}
            searchKeyword={(currentRoute as any).searchKeyword}
          />
        );

      case 'akadasi':
        return (
          <AkadasiPage
            onBack={pop}
            onHome={goHome}
            theme={theme}
            initialSelectedId={akadasiSelectedId ?? undefined}
            onSelectedIdChange={(id: number | null) => {
              // 用独立状态维护爱卡达西阅读位置，不依赖路由栈
              setAkadasiSelectedId(id);
            }}
          />
        );

      default:
        return (
          <BookshelfPage
            onSelectBook={handleSelectBook}
            onContinueReading={handleContinueReading}
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
