import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  | { page: 'bg-read'; chapterId: number; sectionIndex: number; searchKeyword?: string }
  | { page: 'sb-cantos' }
  | { page: 'sb-chapters'; cantoId: number }
  | { page: 'sb-sections'; chapterId: number }
  | { page: 'sb-read'; chapterId: number; sectionIndex: number; searchKeyword?: string }
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
  const path = hash.replace(/^#\/?/, '') || '';
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
// Dev mode is activated by entering the password "vedadev" in the app
// (stored in localStorage as 'vedabase_devmode')
function isDevMode(): boolean {
  return localStorage.getItem('vedabase_devmode') === 'true' || import.meta.env.DEV;
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

  // ─── 书架路由栈：切换 tab 时保留阅读位置 ────────────────────────────────
  // 用于"从非书架tab切回书架"时恢复阅读位置
  const [bookshelfRouteStack, setBookshelfRouteStack] = useState<Route[]>(
    initial.tab === 'bookshelf' ? initial.stack : [{ page: 'home' }]
  );

  // ─── 覆盖路由：书签/搜索进入阅读页时，不切换 activeTab ─────────────────
  // 这样返回时能正确回到书签/搜索页
  type OverlayRoute = {
    route: Route;
    returnTab: TabType; // 返回时切回哪个 tab
  };
  const [overlayRoute, setOverlayRoute] = useState<OverlayRoute | null>(null);

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    selectedBook: 'bg',
    results: [],
    searched: false,
  });

  // 搜索页滚动位置记忆
  const [searchScrollTop, setSearchScrollTop] = useState(0);
  // 搜索页上次点击的结果索引（返回时高亮+滚动到该条目）
  const [searchLastClickedIdx, setSearchLastClickedIdx] = useState<number | null>(null);

  // 爱卡达西阅读位置：独立于路由栈，切换 tab 后能恢复
  const [akadasiSelectedId, setAkadasiSelectedId] = useState<number | null>(null);

  // 记录上一个 tab（用于判断是否需要恢复书架阅读位置）
  const prevTabRef = useRef<TabType>(initial.tab);

  const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();

  // 当有 overlayRoute 时，currentRoute 指向 overlay 中的路由
  const currentRoute = overlayRoute ? overlayRoute.route : routeStack[routeStack.length - 1];

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
      // 不通过 hashchange 来驱动路由，避免循环
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    // 更新 URL hash（仅用于显示，不驱动路由）
    if (overlayRoute) {
      // overlay 时 URL 显示阅读页地址，但不影响路由状态
      const hash = routeToHash(overlayRoute.route, 'bookshelf');
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash);
      }
    } else {
      const newHash = routeToHash(currentRoute, activeTab);
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    }
  }, [currentRoute, activeTab, overlayRoute]);

  // ─── Navigation helpers ──────────────────────────────────────────────────

  const push = useCallback((route: Route) => {
    setRouteStack(prev => {
      const next = [...prev, route];
      setBookshelfRouteStack(next);
      return next;
    });
  }, []);

  const pop = useCallback(() => {
    // 如果有 overlay（从书签/搜索进入的阅读页），返回时关闭 overlay 并切回原 tab
    if (overlayRoute) {
      const returnTab = overlayRoute.returnTab;
      setOverlayRoute(null);
      setActiveTab(returnTab);
      return;
    }

    setRouteStack(prev => {
      if (prev.length <= 1) return prev;
      const newStack = prev.slice(0, -1);
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }, [overlayRoute]);

  const goHome = useCallback(() => {
    setOverlayRoute(null);
    const newStack: Route[] = [{ page: 'home' }];
    setRouteStack(newStack);
    setBookshelfRouteStack(newStack);
    setActiveTab('bookshelf');
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    // 如果有 overlay，点击任何 tab 都先关闭 overlay
    if (overlayRoute) {
      setOverlayRoute(null);
      if (tab === overlayRoute.returnTab) {
        // 点击的就是来源 tab，直接切回
        setActiveTab(tab);
        prevTabRef.current = tab;
        return;
      }
    }

    if (tab === activeTab) {
      // 重复点击当前 tab：回到该 tab 的根页面
      if (tab === 'bookshelf') {
        const newStack: Route[] = [{ page: 'home' }];
        setRouteStack(newStack);
        setBookshelfRouteStack(newStack);
      } else if (tab === 'search') {
        // 重复点击搜索tab：回到搜索首页（清除搜索结果）
        setSearchState({ query: '', selectedBook: searchState.selectedBook, results: [], searched: false });
        setSearchScrollTop(0);
        setSearchLastClickedIdx(null);
      }
      return;
    }

    const prevTab = prevTabRef.current;
    prevTabRef.current = tab;
    setActiveTab(tab);

    if (tab === 'bookshelf') {
      // 从非书架 tab 切回书架：恢复上次阅读位置
      // 从书架 tab 内部（不可能，因为 tab === activeTab 已处理）
      // 判断：如果 prevTab 不是 bookshelf，则恢复
      if (prevTab !== 'bookshelf') {
        // 恢复书架路由栈（包含上次阅读位置）
        setRouteStack(bookshelfRouteStack);
      } else {
        // 直接点书架 tab（不可能到这里，已在上面 tab === activeTab 处理）
        const newStack: Route[] = [{ page: 'home' }];
        setRouteStack(newStack);
        setBookshelfRouteStack(newStack);
      }
    }
  }, [activeTab, overlayRoute, bookshelfRouteStack]);

  const handleSelectBook = useCallback((bookId: string) => {
    if (bookId === 'bg') {
      push({ page: 'bg-chapters' });
    } else if (bookId === 'sb') {
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

  // 从书签进入阅读页：切换到书架tab，返回时回到书签页
  // 用户要求：点书签进入节页时tab切到书架，返回时回书签页，再按"上一标签"回进入前的tab
  const handleOpenBookmark = useCallback((bookmark: Bookmark) => {
    const secIdx = bookmark.sectionIndex ?? 0;
    if (bookmark.bookType === 'bg') {
      // 切换到书架tab，但记录returnTab为bookmarks
      setActiveTab('bookshelf');
      prevTabRef.current = 'bookmarks'; // 上一个tab是书签页
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'bg-read', chapterId: bookmark.chapterId, sectionIndex: secIdx },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    } else if (bookmark.bookType === 'sb') {
      setActiveTab('bookshelf');
      prevTabRef.current = 'bookmarks';
      const newStack: Route[] = [
        { page: 'home' },
        { page: 'sb-read', chapterId: bookmark.chapterId, sectionIndex: secIdx },
      ];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    } else if (bookmark.bookType === 'akadasi') {
      // 爱卡达西书签：切换到书架 tab 并进入爱卡达西页
      setActiveTab('bookshelf');
      prevTabRef.current = 'bookmarks';
      const newStack: Route[] = [{ page: 'home' }, { page: 'akadasi' }];
      setRouteStack(newStack);
      setBookshelfRouteStack(newStack);
    }
  }, []);

  // 从搜索进入阅读页：使用 overlay，不切换 activeTab，返回时回到搜索页
  const handleSearchResult = useCallback((result: { bookType: 'bg' | 'sb'; chapterId: number; sectionIndex: number; searchKeyword?: string; resultIdx?: number; scrollTop?: number }) => {
    // 记录点击的结果索引和当前滚动位置（返回时恢复）
    if (result.resultIdx !== undefined) setSearchLastClickedIdx(result.resultIdx);
    if (result.scrollTop !== undefined) setSearchScrollTop(result.scrollTop);
    if (result.bookType === 'bg') {
      setOverlayRoute({
        route: { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, searchKeyword: result.searchKeyword },
        returnTab: 'search',
      });
    } else if (result.bookType === 'sb') {
      setOverlayRoute({
        route: { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, searchKeyword: result.searchKeyword },
        returnTab: 'search',
      });
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  const renderReadPage = (route: Route) => {
    if (route.page === 'bg-read') {
      return (
        <BGReadPage
          chapterId={route.chapterId}
          sectionIndex={route.sectionIndex}
          onBack={pop}
          onHome={goHome}
          onNavigate={(chId, secIdx) => {
            if (overlayRoute) {
              setOverlayRoute({
                route: { page: 'bg-read', chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword },
                returnTab: overlayRoute.returnTab,
              });
            } else {
              setRouteStack(prev => {
                const newStack = [
                  ...prev.slice(0, -1),
                  { page: 'bg-read' as const, chapterId: chId, sectionIndex: secIdx },
                ];
                setBookshelfRouteStack(newStack);
                return newStack;
              });
            }
          }}
          onGoToChapter={(chId) => {
            setOverlayRoute(null);
            const newStack: Route[] = [
              { page: 'home' },
              { page: 'bg-chapters' },
              { page: 'bg-sections', chapterId: chId },
            ];
            setActiveTab('bookshelf');
            setRouteStack(newStack);
            setBookshelfRouteStack(newStack);
          }}
          language={language}
          setLanguage={setLanguage}
          fontSize={fontSize}
          setFontSize={setFontSize}
          theme={theme}
          devMode={devMode}
          searchKeyword={(route as any).searchKeyword}
        />
      );
    }
    if (route.page === 'sb-read') {
      return (
        <SBReadPage
          chapterId={route.chapterId}
          sectionIndex={route.sectionIndex}
          onBack={pop}
          onHome={goHome}
          onNavigate={(chId, secIdx) => {
            if (overlayRoute) {
              setOverlayRoute({
                route: { page: 'sb-read', chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword },
                returnTab: overlayRoute.returnTab,
              });
            } else {
              setRouteStack(prev => {
                const newStack = [
                  ...prev.slice(0, -1),
                  { page: 'sb-read' as const, chapterId: chId, sectionIndex: secIdx },
                ];
                setBookshelfRouteStack(newStack);
                return newStack;
              });
            }
          }}
          onGoToCanto={(cantoId) => {
            setOverlayRoute(null);
            const newStack: Route[] = [
              { page: 'home' },
              { page: 'sb-cantos' },
              { page: 'sb-chapters', cantoId },
            ];
            setActiveTab('bookshelf');
            setRouteStack(newStack);
            setBookshelfRouteStack(newStack);
          }}
          language={language}
          setLanguage={setLanguage}
          fontSize={fontSize}
          setFontSize={setFontSize}
          theme={theme}
          devMode={devMode}
          searchKeyword={(route as any).searchKeyword}
        />
      );
    }
    return null;
  };

  const renderContent = () => {
    // 如果有 overlay（从书签/搜索进入的阅读页），渲染 overlay 内容
    if (overlayRoute) {
      return renderReadPage(overlayRoute.route);
    }

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
          savedScrollTop={searchScrollTop}
          onScrollTopChange={setSearchScrollTop}
          lastClickedIdx={searchLastClickedIdx}
          onClearLastClicked={() => setSearchLastClickedIdx(null)}
        />
      );
    }
    if (activeTab === 'calendar') {
      return <CalendarPage theme={theme} />;
    }

    const route = routeStack[routeStack.length - 1];

    switch (route.page) {
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
            chapterId={route.chapterId}
            onBack={pop}
            onHome={goHome}
            onSelectSection={(chId, secIdx) => push({ page: 'bg-read', chapterId: chId, sectionIndex: secIdx })}
            language={language}
            theme={theme}
          />
        );

      case 'bg-read':
        return renderReadPage(route);

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
            cantoId={route.cantoId}
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
            chapterId={route.chapterId}
            onBack={pop}
            onHome={goHome}
            onSelectSection={(chId, secIdx) => push({ page: 'sb-read', chapterId: chId, sectionIndex: secIdx })}
            language={language}
            theme={theme}
          />
        );

      case 'sb-read':
        return renderReadPage(route);

      case 'akadasi':
        return (
          <AkadasiPage
            onBack={pop}
            onHome={goHome}
            theme={theme}
            initialSelectedId={akadasiSelectedId ?? undefined}
            onSelectedIdChange={(id: number | null) => {
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
