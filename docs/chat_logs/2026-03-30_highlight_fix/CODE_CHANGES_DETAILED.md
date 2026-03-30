# 代码修改详细对比

## 修改1：SectionContent.tsx - useEffect 依赖修复

**文件**：`client/src/components/SectionContent.tsx`  
**提交**：`395fa4f`  
**行号**：124-143

### 修改前

```typescript
// Auto-scroll to first highlighted match when searchKeyword is provided
// 当语言切换时，滚动到对应语言的高亮位置
useEffect(() => {
  if (!searchKeyword && !highlightKeyword) return;  // ❌ 条件太严格
  
  // 使用多层延迟确保 DOM 已更新
  // 当语言切换时，React 需要时间重新渲染内容
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
}, [searchKeyword, highlightKeyword, language, currentKeyword]);  // ❌ 依赖不对
```

### 修改后

```typescript
// Auto-scroll to first highlighted match when currentKeyword is provided
// 当语言切换或关键词变化时，滚动到对应语言的高亮位置
useEffect(() => {
  if (!currentKeyword) return;  // ✅ 改为检查 currentKeyword
  
  // 使用多层延迟确保 DOM 已更新
  // 当语言切换时，React 需要时间重新渲染内容
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
}, [currentKeyword, language]);  // ✅ 只依赖 currentKeyword 和 language
```

### 为什么这个修改很重要

1. **原始问题**：
   - 依赖了 `searchKeyword` 和 `highlightKeyword`
   - 当从搜索页进入时，这两个参数可能为空
   - useEffect 会直接返回，不执行滚动逻辑

2. **修复方案**：
   - 改为依赖 `currentKeyword`，这是根据当前语言动态选择的高亮关键词
   - 这样无论是语言切换还是参数更新，都能正确触发滚动逻辑

3. **currentKeyword 的逻辑**（第116-122行）：
   ```typescript
   const currentKeyword = useMemo(() => {
     if (language === 'zh') {
       return highlightKeywordZh || highlightKeyword || searchKeyword;
     } else {
       return highlightKeywordEn || highlightKeyword || searchKeyword;
     }
   }, [language, highlightKeywordZh, highlightKeywordEn, highlightKeyword, searchKeyword]);
   ```
   - 根据当前语言选择对应的高亮关键词
   - 当语言改变时，currentKeyword 会自动更新

---

## 修改2：App.tsx - onNavigate 参数保留（BGReadPage）

**文件**：`client/src/App.tsx`  
**提交**：`395fa4f`  
**行号**：514-530

### 修改前

```typescript
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
        { page: 'bg-read' as const, chapterId: chId, sectionIndex: secIdx },  // ❌ 没有保留高亮参数
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

### 修改后

```typescript
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
        { page: 'bg-read' as const, chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword, highlightKeyword: (route as any).highlightKeyword, highlightKeywordZh: (route as any).highlightKeywordZh, highlightKeywordEn: (route as any).highlightKeywordEn, matchLocation: (route as any).matchLocation },  // ✅ 保留高亮参数
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

### 为什么这个修改很重要

1. **原始问题**：
   - 非overlay模式下，导航时没有保留高亮参数
   - 用户从搜索页进入后，切换左右节时，高亮参数丢失

2. **场景分析**：
   - 用户从搜索页进入 → overlay 模式 → 高亮参数被保留 ✅
   - 用户切换左右节 → 仍在 overlay 模式 → 高亮参数被保留 ✅
   - 用户点击某个 tab 返回搜索页 → overlay 被清除
   - 用户再次进入阅读页 → 不再是 overlay 模式
   - 用户切换左右节 → 非 overlay 模式 → 高亮参数**丢失** ❌

3. **修复方案**：
   - 在非overlay模式下也保留所有高亮参数
   - 确保无论在哪种模式下，导航时都能保留高亮状态

---

## 修改3：App.tsx - onNavigate 参数保留（SBReadPage）

**文件**：`client/src/App.tsx`  
**提交**：`395fa4f`  
**行号**：563-579

### 修改前

```typescript
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
        { page: 'sb-read' as const, chapterId: chId, sectionIndex: secIdx },  // ❌ 没有保留高亮参数
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

### 修改后

```typescript
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
        { page: 'sb-read' as const, chapterId: chId, sectionIndex: secIdx, searchKeyword: (route as any).searchKeyword, highlightKeyword: (route as any).highlightKeyword, highlightKeywordZh: (route as any).highlightKeywordZh, highlightKeywordEn: (route as any).highlightKeywordEn, matchLocation: (route as any).matchLocation },  // ✅ 保留高亮参数
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

---

## 修改4：SearchPage.tsx - BG搜索 SearchResult 构造

**文件**：`client/src/pages/SearchPage.tsx`  
**提交**：`2df791c`  
**行号**：675-688

### 修改前

```typescript
found.push({
  bookType: 'bg',
  chapterId: chId,
  sectionIndex: idx,
  sectionId: String(section.section_id),
  label: formatSectionLabel('bg', section.section_id, language),
  preview,
  searchKeyword: q.trim(),
  highlightKeyword: matchInfo.highlightKeyword,
  matchLocation: matchInfo.matchLocation,
  isMissingChinese: matchInfo.isMissingChinese,
  // ❌ 缺少：highlightKeywordZh 和 highlightKeywordEn
});
```

### 修改后

```typescript
found.push({
  bookType: 'bg',
  chapterId: chId,
  sectionIndex: idx,
  sectionId: String(section.section_id),
  label: formatSectionLabel('bg', section.section_id, language),
  preview,
  searchKeyword: q.trim(),
  highlightKeyword: matchInfo.highlightKeyword,
  highlightKeywordZh: matchInfo.highlightKeywordZh,      // ✅ 新增
  highlightKeywordEn: matchInfo.highlightKeywordEn,      // ✅ 新增
  matchLocation: matchInfo.matchLocation,
  isMissingChinese: matchInfo.isMissingChinese,
});
```

### 为什么这个修改是最关键的

1. **原始问题**：
   - `getMatchInfo()` 函数正确生成了 `highlightKeywordZh` 和 `highlightKeywordEn`
   - 但在构造 SearchResult 对象时**没有传递**这两个字段
   - 导致进入节页面时，这两个字段为 undefined

2. **getMatchInfo() 的返回值**（第495-617行）：
   ```typescript
   const getMatchInfo = (section: any): {
     matchLocation: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
     highlightKeyword: string;
     highlightKeywordZh: string;    // ✅ 生成了
     highlightKeywordEn: string;    // ✅ 生成了
     isMissingChinese: boolean;
   } | null => {
     // 各种情况下都返回这两个字段
     // 例如：英文词义搜索时
     if (section.words_en_fc && textContainsKw(section.words_en_fc)) {
       let highlightKeywordZh = keyword;
       let highlightKeywordEn = keyword;
       
       if (isEnKeyword) {
         const mappedZhWord = (wordMapping as Record<string, string>)[kwLower];
         if (mappedZhWord) {
           highlightKeywordZh = mappedZhWord;  // ✅ 映射到中文
         }
       }
       
       return {
         matchLocation: 'wordmeaning',
         highlightKeyword: highlightKeywordZh,
         highlightKeywordZh: highlightKeywordZh,
         highlightKeywordEn: highlightKeywordEn,
         isMissingChinese: isEnKeyword && !((wordMapping as Record<string, string>)[kwLower]),
       };
     }
   }
   ```

3. **数据流中断的位置**：
   ```
   getMatchInfo() 返回 {
     highlightKeywordZh: "devotee" 或映射的中文词
     highlightKeywordEn: "devotee"
   }
     ↓
   SearchResult 构造时 ❌ 没有传递这两个字段
     ↓
   进入节页面时，highlightKeywordZh 和 highlightKeywordEn 为 undefined
     ↓
   currentKeyword 的 useMemo 逻辑：
     if (language === 'zh') {
       return highlightKeywordZh || highlightKeyword || searchKeyword;
       // highlightKeywordZh 为 undefined，回退到 highlightKeyword 或 searchKeyword
     }
     ↓
   可能使用了错误的高亮关键词
     ↓
   highlightText() 函数找不到匹配的词
     ↓
   没有高亮显示
   ```

4. **修复方案**：
   - 在构造 SearchResult 时，传递 `matchInfo.highlightKeywordZh` 和 `matchInfo.highlightKeywordEn`
   - 确保进入节页面时能获得正确的高亮关键词

---

## 修改5：SearchPage.tsx - SB搜索 SearchResult 构造

**文件**：`client/src/pages/SearchPage.tsx`  
**提交**：`2df791c`  
**行号**：905-918

### 修改前

```typescript
found.push({
  bookType: 'sb',
  chapterId: chapter.id,
  sectionIndex: idx,
  sectionId: section.section_id,
  label: formatSectionLabel('sb', section.section_id, language),
  searchKeyword: q.trim(),
  preview,
  highlightKeyword: matchInfo.highlightKeyword,
  matchLocation: matchInfo.matchLocation,
  isMissingChinese: matchInfo.isMissingChinese,
  // ❌ 缺少：highlightKeywordZh 和 highlightKeywordEn
});
```

### 修改后

```typescript
found.push({
  bookType: 'sb',
  chapterId: chapter.id,
  sectionIndex: idx,
  sectionId: section.section_id,
  label: formatSectionLabel('sb', section.section_id, language),
  searchKeyword: q.trim(),
  preview,
  highlightKeyword: matchInfo.highlightKeyword,
  highlightKeywordZh: matchInfo.highlightKeywordZh,      // ✅ 新增
  highlightKeywordEn: matchInfo.highlightKeywordEn,      // ✅ 新增
  matchLocation: matchInfo.matchLocation,
  isMissingChinese: matchInfo.isMissingChinese,
});
```

---

## 总结

| 修改 | 文件 | 提交 | 重要性 | 说明 |
|------|------|------|--------|------|
| 1 | SectionContent.tsx | 395fa4f | ⭐⭐⭐ | useEffect 依赖修复 - 必要但不充分 |
| 2 | App.tsx (BG) | 395fa4f | ⭐⭐⭐ | 参数保留修复 - 必要但不充分 |
| 3 | App.tsx (SB) | 395fa4f | ⭐⭐⭐ | 参数保留修复 - 必要但不充分 |
| 4 | SearchPage.tsx (BG) | 2df791c | ⭐⭐⭐⭐⭐ | 数据传递修复 - **最关键** |
| 5 | SearchPage.tsx (SB) | 2df791c | ⭐⭐⭐⭐⭐ | 数据传递修复 - **最关键** |

**关键发现**：
- 修改1-3 是必要的基础工作，但只有修改4-5 才能真正解决问题
- 修改4-5 是最关键的，因为它修复了数据流的源头
- 这三层修改必须**全部应用**才能完全解决问题
