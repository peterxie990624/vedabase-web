# 高亮参数数据流追踪分析

## 问题症状总结

### 问题一：英文模式下搜索结果进入不高亮
- 中文模式搜索结果进入 ✅ 能工作
- 英文模式搜索结果进入 ❌ 不工作

### 问题二：导航返回后高亮消失
- 中文模式搜索"devotee"，进入节页面后
- 切换左右节再回来，中文高亮消失 ❌
- 英文模式下从1.1切换到1.14再到1.15，能正常高亮 ✅

## 数据流追踪

### 第一步：SearchPage生成SearchResult

**关键函数：getMatchInfo() - 第495行**

这个函数返回：
```typescript
{
  matchLocation: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
  highlightKeyword: string;      // 向后兼容：优先使用中文
  highlightKeywordZh: string;    // 中文高亮关键词
  highlightKeywordEn: string;    // 英文高亮关键词
  isMissingChinese: boolean;
}
```

**问题分析：**

1. **第516-550行**：英文词义搜索时
   - 当搜索英文词时（如"devotee"）
   - 如果在 `words_en_fc` 中找到，会尝试从映射表获取中文
   - 返回：`highlightKeywordZh` = 映射的中文词，`highlightKeywordEn` = 原英文词

2. **第577-585行**：英文译文搜索时
   - 返回：`highlightKeywordZh` = 中文译文（或原关键词），`highlightKeywordEn` = 原关键词

3. **第600-613行**：英文要旨搜索时
   - 返回：`highlightKeywordZh` = 映射的中文词，`highlightKeywordEn` = 原关键词

**关键发现：**
- SearchPage 中的 getMatchInfo() 函数**正确生成了 highlightKeywordZh 和 highlightKeywordEn**
- 这两个字段被正确地添加到 SearchResult 对象中

### 第二步：SearchPage调用onOpenResult

**第994行：**
```typescript
onOpenResult({ ...result, resultIdx: idx, scrollTop });
```

**问题分析：**
- SearchResult 对象包含了 `highlightKeywordZh` 和 `highlightKeywordEn`
- 这些字段被正确传递给 onOpenResult 回调

### 第三步：App.tsx中的handleSearchResult

**第485-502行：**
```typescript
const handleSearchResult = useCallback((result: { 
  bookType: 'bg' | 'sb'; 
  chapterId: number; 
  sectionIndex: number; 
  searchKeyword?: string; 
  highlightKeyword?: string; 
  highlightKeywordZh?: string;    // ✅ 接收
  highlightKeywordEn?: string;    // ✅ 接收
  matchLocation?: ...;
  resultIdx?: number; 
  scrollTop?: number 
}) => {
  ...
  setOverlayRoute({
    route: { 
      page: 'bg-read', 
      chapterId: result.chapterId, 
      sectionIndex: result.sectionIndex, 
      searchKeyword: result.searchKeyword, 
      highlightKeyword: result.highlightKeyword, 
      highlightKeywordZh: result.highlightKeywordZh,    // ✅ 传递
      highlightKeywordEn: result.highlightKeywordEn,    // ✅ 传递
      matchLocation: result.matchLocation 
    },
    returnTab: 'search',
  });
})
```

**问题分析：**
- handleSearchResult 正确接收并传递了 highlightKeywordZh 和 highlightKeywordEn
- 这些参数被正确添加到 overlayRoute.route 中

### 第四步：BGReadPage接收参数

**第28-29行：**
```typescript
highlightKeywordZh?: string;  // 中文高亮关键词
highlightKeywordEn?: string;  // 英文高亮关键词
```

**第506-551行：renderReadPage中的传递**
```typescript
<BGReadPage
  ...
  highlightKeywordZh={(route as any).highlightKeywordZh}    // ✅ 传递
  highlightKeywordEn={(route as any).highlightKeywordEn}    // ✅ 传递
  ...
/>
```

**问题分析：**
- BGReadPage 正确接收了这两个参数

### 第五步：BGReadPage传递给SectionContent

**第需要检查：BGReadPage是否正确传递给SectionContent**

### 第六步：SectionContent中的currentKeyword逻辑

**第116-122行：**
```typescript
const currentKeyword = useMemo(() => {
  if (language === 'zh') {
    return highlightKeywordZh || highlightKeyword || searchKeyword;
  } else {
    return highlightKeywordEn || highlightKeyword || searchKeyword;
  }
}, [language, highlightKeywordZh, highlightKeywordEn, highlightKeyword, searchKeyword]);
```

**问题分析：**

这里的逻辑看起来正确，但有一个**潜在问题**：

当从搜索页进入时：
- 中文模式：应该使用 `highlightKeywordZh`
- 英文模式：应该使用 `highlightKeywordEn`

但是，**问题可能出在：**
1. highlightKeywordZh 或 highlightKeywordEn 可能为 undefined
2. 如果都为 undefined，会回退到 highlightKeyword 或 searchKeyword
3. 而 highlightKeyword 在英文模式下可能是中文词（因为SearchPage中的逻辑）

## 关键问题发现

### 问题1：highlightKeywordZh/En可能为undefined

在 SearchPage 的 getMatchInfo() 中，某些分支可能没有正确设置这两个字段。

**例如：第566-573行（中文译文命中）**
```typescript
if (section.yw_zh && textContainsKw(section.yw_zh)) {
  return {
    matchLocation: 'translation',
    highlightKeyword: keyword,
    highlightKeywordZh: keyword,      // ✅ 设置了
    highlightKeywordEn: keyword,      // ✅ 设置了
    isMissingChinese: false,
  };
}
```

看起来都设置了。

### 问题2：SectionContent中的useEffect依赖

**第126-143行：**
```typescript
useEffect(() => {
  if (!searchKeyword && !highlightKeyword) return;
  
  const timer = setTimeout(() => {
    requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;
      const mark = el.querySelector('mark.search-highlight') as HTMLElement | null;
      if (mark) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, 100);
  
  return () => clearTimeout(timer);
}, [searchKeyword, highlightKeyword, language, currentKeyword]);
```

**问题分析：**

这个 useEffect 的依赖数组中有 `searchKeyword` 和 `highlightKeyword`，但：
1. 当从搜索页进入时，可能 `searchKeyword` 为空
2. 此时 useEffect 会直接返回，不执行滚动逻辑
3. 应该改为依赖 `currentKeyword` 而不是 `searchKeyword` 和 `highlightKeyword`

### 问题3：highlightText函数使用currentKeyword

**第204-246行：**
```typescript
const highlightText = (html: string, location?: ...): string => {
  let keyword = currentKeyword;  // ✅ 使用currentKeyword
  if (!keyword) return html;
  ...
}
```

这里正确地使用了 `currentKeyword`。

## 问题二的根本原因

当导航到其他节再返回时：
1. onNavigate 被调用，更新路由
2. 在 App.tsx 的 renderReadPage 中，onNavigate 的处理：

**第514-529行：**
```typescript
onNavigate={(chId, secIdx) => {
  if (overlayRoute) {
    setOverlayRoute({
      route: { 
        page: 'bg-read', 
        chapterId: chId, 
        sectionIndex: secIdx, 
        searchKeyword: (route as any).searchKeyword,        // ✅ 保留
        highlightKeyword: (route as any).highlightKeyword,  // ✅ 保留
        highlightKeywordZh: (route as any).highlightKeywordZh,  // ✅ 保留
        highlightKeywordEn: (route as any).highlightKeywordEn,  // ✅ 保留
        matchLocation: (route as any).matchLocation         // ✅ 保留
      },
      returnTab: overlayRoute.returnTab,
    });
  } else {
    // 非overlay模式：不保留高亮参数
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
```

**问题分析：**

在非 overlay 模式下（从书架导航），高亮参数没有被保留！

这就是**问题二的根本原因**：
1. 用户从搜索页进入 → overlay 模式 → 高亮参数被保留
2. 用户切换左右节 → 仍在 overlay 模式 → 高亮参数被保留
3. 用户点击某个 tab 返回搜索页 → overlay 被清除
4. 用户再次进入阅读页 → 不再是 overlay 模式
5. 用户切换左右节 → 非 overlay 模式 → 高亮参数**丢失**

## 解决方案

### 修复1：useEffect依赖修复

在 SectionContent.tsx 中，修改 useEffect 的依赖：

```typescript
useEffect(() => {
  if (!currentKeyword) return;  // 改为检查 currentKeyword
  
  const timer = setTimeout(() => {
    requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) return;
      const mark = el.querySelector('mark.search-highlight') as HTMLElement | null;
      if (mark) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, 100);
  
  return () => clearTimeout(timer);
}, [currentKeyword, language]);  // 改为依赖 currentKeyword
```

### 修复2：在非overlay模式下也保留高亮参数

在 App.tsx 的 onNavigate 中：

```typescript
onNavigate={(chId, secIdx) => {
  if (overlayRoute) {
    setOverlayRoute({
      route: { 
        page: 'bg-read', 
        chapterId: chId, 
        sectionIndex: secIdx, 
        searchKeyword: (route as any).searchKeyword,
        highlightKeyword: (route as any).highlightKeyword,
        highlightKeywordZh: (route as any).highlightKeywordZh,
        highlightKeywordEn: (route as any).highlightKeywordEn,
        matchLocation: (route as any).matchLocation 
      },
      returnTab: overlayRoute.returnTab,
    });
  } else {
    // 修复：在非overlay模式下也保留高亮参数
    setRouteStack(prev => {
      const newStack = [
        ...prev.slice(0, -1),
        { 
          page: 'bg-read' as const, 
          chapterId: chId, 
          sectionIndex: secIdx,
          searchKeyword: (route as any).searchKeyword,        // 新增
          highlightKeyword: (route as any).highlightKeyword,  // 新增
          highlightKeywordZh: (route as any).highlightKeywordZh,  // 新增
          highlightKeywordEn: (route as any).highlightKeywordEn,  // 新增
          matchLocation: (route as any).matchLocation         // 新增
        },
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

### 修复3：检查BGReadPage是否正确传递参数给SectionContent

需要检查 BGReadPage 中是否正确地将 highlightKeywordZh/En 传递给 SectionContent。
