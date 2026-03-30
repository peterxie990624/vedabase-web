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
import { Info, X } from 'lucide-react';

// Route types
type Route =
  | { page: 'home' }
  | { page: 'bg-chapters' }
  | { page: 'bg-sections'; chapterId: number }
  | { page: 'bg-read'; chapterId: number; sectionIndex: number; searchKeyword?: string; highlightKeyword?: string; highlightKeywordZh?: string; highlightKeywordEn?: string; matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport' }
  | { page: 'sb-cantos' }
  | { page: 'sb-chapters'; cantoId: number }
  | { page: 'sb-sections'; chapterId: number }
  | { page: 'sb-read'; chapterId: number; sectionIndex: number; searchKeyword?: string; highlightKeyword?: string; highlightKeywordZh?: string; highlightKeywordEn?: string; matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport' }
  | { page: 'akadasi'; selectedId?: number };

// ─── Hash 解析与序列化 ───────────────────────────────────────────────────────

function routeToHash(route: Route, tab: TabType, searchQuery?: string): string {
  if (tab === 'bookmarks') return '#/bookmarks';
  if (tab === 'search') return searchQuery ? `#/search?q=${encodeURIComponent(searchQuery)}` : '#/search';
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

// ─── Session restore key ─────────────────────────────────────────────────────
const SESSION_KEY = 'vedabase_session';

interface SessionData {
  tab: TabType;
  hash: string;
  timestamp: number;
}

function saveSession(tab: TabType, hash: string) {
  const data: SessionData = { tab, hash, timestamp: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch { return null; }
}

// ─── Dev mode detection ──────────────────────────────────────────────────────
function isDevMode(): boolean {
  return localStorage.getItem('vedabase_devmode') === 'true' || import.meta.env.DEV;
}

// 开发模式功能说明
const DEV_MODE_FEATURES = `开发模式功能说明（开发/测试模式合并）

【开发模式专有功能】
• 全局浮动 DEV 圆钮（右下角，始终显示）
• 搜索页：详细加载进度、数据来源标记
• 搜索页：无结果时显示加载进度详情
• 阅读页：错误时显示 DevPanel（资源状态、环境信息）
• 激活方式：书架页"设置"菜单中长按"关于"按钮3秒
• 关闭方式：再次长按"关于"按钮3秒

【测试工具（点击 DEV 圆钮展开）】
• 清除上次打开时间戳（测试2小时限时记忆）
• 查看时间戳状态（距今分钟数）
• 模拟超时（将时间戳设为2小时前）
• 清除会话记录（测试关闭重开恢复功能）
• 查看当前会话状态

【会话恢复功能（生产模式也有）】
• 关闭网页前自动保存当前位置（tab + 节页路径）
• 重新打开时恢复到上次位置
• 书架页显示"回到上次阅读"快捷按钮

【生产模式（默认）】
• 仅显示用户界面，无调试信息
• 会话恢复功能正常工作`;

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
  const [showDevPanel, setShowDevPanel] = useState(false);

  // ─── 书架路由栈：切换 tab 时保留阅读位置 ────────────────────────────────
  const [bookshelfRouteStack, setBookshelfRouteStack] = useState<Route[]>(
    initial.tab === 'bookshelf' ? initial.stack : [{ page: 'home' }]
  );

  // ─── 覆盖路由：书签/搜索进入阅读页时，不切换 activeTab ─────────────────
  type OverlayRoute = {
    route: Route;
    returnTab: TabType;
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

  // ─── 会话持久化：每次状态变化时保存当前位置 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const searchQuery = (activeTab === 'search' && searchState.searched) ? searchState.query : undefined;
    const hash = overlayRoute
      ? routeToHash(overlayRoute.route, 'bookshelf')
      : routeToHash(currentRoute, activeTab, searchQuery);
    saveSession(activeTab, hash);
  }, [currentRoute, activeTab, overlayRoute, searchState.searched, searchState.query]);

  // ─── 会话恢复：页面加载时检查上次位置 ──────────────────────────────────────────────
  // （仅在初始 hash 为根路径时才恢复，避免覆盖直接链接跳转）
  useEffect(() => {
    const currentHash = window.location.hash || '#/';
    if (currentHash === '#/' || currentHash === '') {
      const session = loadSession();
      if (session && session.hash && session.hash !== '#/') {
        // 恢复上次位置
        const restored = hashToState(session.hash);
        setActiveTab(restored.tab);
        setRouteStack(restored.stack);
        if (restored.tab === 'bookshelf') {
          setBookshelfRouteStack(restored.stack);
        }
      }
    }
  }, []); // 只在挂载时运行一次

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
    // 如果有 overlay（从搜索进入的阅读页），返回时关闭 overlay 并切回搜索页
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

      // 如果是从非书架 tab（书签/日历）进入节页，返回到书架首页时切回来源 tab
      if (newStack.length === 1 && newStack[0].page === 'home' && nonBookshelfSourceTabRef.current) {
        const returnTab = nonBookshelfSourceTabRef.current;
        nonBookshelfSourceTabRef.current = null;
        // 延迟切换，确保路由更新完成后再切 tab
        setTimeout(() => setActiveTab(returnTab), 0);
      }

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
    // 如果有 overlay（从书签/搜索进入的阅读页），点击任何 tab 都先关闭 overlay
    if (overlayRoute) {
      setOverlayRoute(null);
      // 从 overlay 返回时：不重置搜索状态，保留上次搜索结果
      setActiveTab(tab);
      prevTabRef.current = tab;
      if (tab === 'bookshelf') {
        // 如果点的是书架，恢复上次书架位置
        setRouteStack(bookshelfRouteStack);
      }
      return;
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

    // 切换到搜索 tab：保留上次搜索结果（不重置），只有重复点击搜索 tab 才回首页

    const prevTab = prevTabRef.current;
    prevTabRef.current = tab;
    setActiveTab(tab);

    if (tab === 'bookshelf') {
      // 从非书架 tab 切回书架：恢复上次阅读位置
      if (prevTab !== 'bookshelf') {
        setRouteStack(bookshelfRouteStack);
      } else {
        const newStack: Route[] = [{ page: 'home' }];
        setRouteStack(newStack);
        setBookshelfRouteStack(newStack);
      }
    }
  }, [activeTab, overlayRoute, bookshelfRouteStack, searchState.selectedBook]);

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
  }, [push]);  // 记录从非书架 tab 进入节页的来源 tab（返回时用）
  const nonBookshelfSourceTabRef = useRef<TabType | null>(null);

  // ─── 从非书架 tab 进入节页：切换到书架tab，返回时回原 tab ————————————————————
  // 适用于：书签页、日历页 进入节页
  const openSectionFromNonBookshelf = useCallback((
    route: Route,
    sourceTab: TabType
  ) => {
    setActiveTab('bookshelf');
    prevTabRef.current = sourceTab; // 记录来源tab
    nonBookshelfSourceTabRef.current = sourceTab; // 返回时切回该 tab
    const newStack: Route[] = [{ page: 'home' }, route];
    setRouteStack(newStack);
    setBookshelfRouteStack(newStack);
  }, []); // 从书签进入阅读页
  const handleOpenBookmark = useCallback((bookmark: Bookmark) => {
    const secIdx = bookmark.sectionIndex ?? 0;
    if (bookmark.bookType === 'bg') {
      openSectionFromNonBookshelf(
        { page: 'bg-read', chapterId: bookmark.chapterId, sectionIndex: secIdx },
        'bookmarks'
      );
    } else if (bookmark.bookType === 'sb') {
      openSectionFromNonBookshelf(
        { page: 'sb-read', chapterId: bookmark.chapterId, sectionIndex: secIdx },
        'bookmarks'
      );
    } else if (bookmark.bookType === 'akadasi') {
      openSectionFromNonBookshelf({ page: 'akadasi' }, 'bookmarks');
    }
  }, [openSectionFromNonBookshelf]);

  // 从搜索进入阅读页：使用 overlay，切换 activeTab 到书架（显示书架tab激活），返回时回到搜索页
  const handleSearchResult = useCallback((result: { bookType: 'bg' | 'sb'; chapterId: number; sectionIndex: number; searchKeyword?: string; highlightKeyword?: string; matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport'; resultIdx?: number; scrollTop?: number }) => {
    // 记录点击的结果索引和当前滚动位置（返回时恢复）
    if (result.resultIdx !== undefined) setSearchLastClickedIdx(result.resultIdx);
    if (result.scrollTop !== undefined) setSearchScrollTop(result.scrollTop);
    // 切换到书架 tab（显示书架激活），overlay 记录 returnTab 为 search（返回时切回搜索页）
    setActiveTab('bookshelf');
    if (result.bookType === 'bg') {
      setOverlayRoute({
        route: { page: 'bg-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, searchKeyword: result.searchKeyword, highlightKeyword: result.highlightKeyword, highlightKeywordZh: result.highlightKeywordZh, highlightKeywordEn: result.highlightKeywordEn, matchLocation: result.matchLocation },
        returnTab: 'search',
      });
    } else if (result.bookType === 'sb') {
      setOverlayRoute({
        route: { page: 'sb-read', chapterId: result.chapterId, sectionIndex: result.sectionIndex, searchKeyword: result.searchKeyword, highlightKeyword: result.highlightKeyword, highlightKeywordZh: result.highlightKeywordZh, highlightKeywordEn: result.highlightKeywordEn, matchLocation: result.matchLocation },
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
                route: { page: 'bg-read', chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword, highlightKeyword: (route as any).highlightKeyword, highlightKeywordZh: (route as any).highlightKeywordZh, highlightKeywordEn: (route as any).highlightKeywordEn, matchLocation: (route as any).matchLocation },
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
          highlightKeyword={(route as any).highlightKeyword}
          highlightKeywordZh={(route as any).highlightKeywordZh}
          highlightKeywordEn={(route as any).highlightKeywordEn}
          matchLocation={(route as any).matchLocation}
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
                route: { page: 'sb-read', chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword, highlightKeyword: (route as any).highlightKeyword, highlightKeywordZh: (route as any).highlightKeywordZh, highlightKeywordEn: (route as any).highlightKeywordEn, matchLocation: (route as any).matchLocation },
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
          highlightKeyword={(route as any).highlightKeyword}
          highlightKeywordZh={(route as any).highlightKeywordZh}
          highlightKeywordEn={(route as any).highlightKeywordEn}
          matchLocation={(route as any).matchLocation}
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
      return <BookmarksPage onOpenBookmark={handleOpenBookmark} theme={theme} language={language} />;
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

  const isDark = theme === 'dark';
  const SEARCH_TIME_KEY = 'vedabase_last_search_time';

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

      {/* ─── 全局浮动 DEV 圆钮 ─────────────────────────────────────────── */}
      {devMode && (
        <>
          {/* DEV 圆钮 */}
          <button
            onClick={() => setShowDevPanel(v => !v)}
            title="开发模式工具"
            style={{
              position: 'fixed',
              bottom: '76px', // 在底部导航栏上方
              right: 'calc(50% - 320px + 12px)', // 在 640px 容器右侧内
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isDark ? 'rgba(90,216,138,0.15)' : 'rgba(42,138,74,0.1)',
              border: `2px solid ${isDark ? '#5ad88a' : '#2a8a4a'}`,
              color: isDark ? '#5ad88a' : '#2a8a4a',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.02em',
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            DEV
          </button>

          {/* DEV 面板 */}
          {showDevPanel && (
            <div
              style={{
                position: 'fixed',
                bottom: '120px',
                right: 'calc(50% - 320px + 12px)',
                width: '280px',
                background: isDark ? '#1a2535' : '#ffffff',
                border: `1px solid ${isDark ? '#2a3a50' : '#e0eaf2'}`,
                borderRadius: '12px',
                padding: '16px',
                zIndex: 9998,
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: isDark ? '#5ad88a' : '#2a8a4a', fontSize: '13px' }}>
                  🛠 开发模式工具
                </span>
                <button
                  onClick={() => setShowDevPanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#8aa0b4' : '#6a8aa0', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* 功能说明按钮 */}
              <details style={{ marginBottom: '12px' }}>
                <summary style={{
                  cursor: 'pointer', fontSize: '12px', color: isDark ? '#8aa0b4' : '#6a8aa0',
                  display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none',
                  listStyle: 'none',
                }}>
                  <Info size={12} /> 查看开发模式功能说明
                </summary>
                <pre style={{
                  marginTop: '8px', fontSize: '11px', color: isDark ? '#c0d0e0' : '#444',
                  whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'monospace',
                  background: isDark ? '#0f1923' : '#f5f7fa',
                  borderRadius: '6px', padding: '8px',
                }}>
                  {DEV_MODE_FEATURES}
                </pre>
              </details>

              {/* 测试工具 */}
              <div style={{ fontSize: '11px', color: isDark ? '#8aa0b4' : '#6a8aa0', marginBottom: '8px', fontWeight: 600 }}>
                测试工具
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => {
                    localStorage.removeItem(SEARCH_TIME_KEY);
                    alert('已清除上次打开时间戳！\n切换到其他tab再切回搜索，将不会恢复上次搜索状态。');
                  }}
                  style={devBtnStyle(isDark)}
                >
                  🕐 清除搜索时间戳（测试2h限时记忆）
                </button>
                <button
                  onClick={() => {
                    const ts = localStorage.getItem(SEARCH_TIME_KEY);
                    if (ts) {
                      const diff = Math.round((Date.now() - parseInt(ts)) / 1000 / 60);
                      alert(`上次搜索时间：${new Date(parseInt(ts)).toLocaleString()}\n距今：${diff} 分钟\n${diff >= 120 ? '（已超过2小时，下次切回会重置）' : '（未超过2小时，切回会恢复）'}`);
                    } else {
                      alert('无时间戳记录（从未搜索或已清除）');
                    }
                  }}
                  style={devBtnStyle(isDark)}
                >
                  📊 查看搜索时间戳状态
                </button>
                <button
                  onClick={() => {
                    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000 - 1000;
                    localStorage.setItem(SEARCH_TIME_KEY, String(twoHoursAgo));
                    alert('已设置"2小时前"时间戳！\n切换tab再切回搜索，将重置到搜索首页。');
                  }}
                  style={devBtnStyle(isDark)}
                >
                  ⏩ 模拟搜索超时（设为2h前）
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(SESSION_KEY);
                    alert('已清除会话记录！\n刷新页面后将不会恢复上次位置。');
                  }}
                  style={devBtnStyle(isDark)}
                >
                  🗑 清除会话记录（测试重开恢复）
                </button>
                <button
                  onClick={() => {
                    const session = loadSession();
                    if (session) {
                      const diff = Math.round((Date.now() - session.timestamp) / 1000 / 60);
                      alert(`当前会话：\nTab: ${session.tab}\nHash: ${session.hash}\n距今：${diff} 分钟`);
                    } else {
                      alert('无会话记录');
                    }
                  }}
                  style={devBtnStyle(isDark)}
                >
                  📍 查看当前会话状态
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// DEV 面板按钮样式
function devBtnStyle(isDark: boolean): React.CSSProperties {
  return {
    padding: '7px 10px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? '#2a3a50' : '#e0eaf2'}`,
    background: isDark ? '#0f1923' : '#f5f7fa',
    color: isDark ? '#c0d0e0' : '#444',
    cursor: 'pointer',
    fontSize: '11px',
    textAlign: 'left',
    width: '100%',
  };
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
