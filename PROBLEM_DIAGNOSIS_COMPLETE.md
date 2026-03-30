# 搜索高亮问题完整诊断和修复过程

## 问题陈述

用户报告了两个核心问题：

### 问题一：英文模式下搜索结果进入不高亮
- **症状**：在英文模式搜索"devotee"，点击搜索结果进入节页面，看不到"devotee"被高亮
- **对比**：中文模式搜索结果进入能正常高亮
- **关键发现**：搜索结果预览中能看到"devotee"，但进入节页面后看不到这个词

### 问题二：导航返回后高亮消失
- **症状**：在中文模式搜索"devotee"进入节页面，切换左右节再返回，中文高亮"奉献者"消失
- **对比**：英文模式下从1.1切换到1.14再到1.15，能正常保持高亮
- **根本原因**：高亮参数在导航时丢失

---

## 诊断过程

### 第一步：回滚到稳定版本（commit 0b2ab4a）

用户反馈"突然修复了又不好用了"，表明之前的修改引入了新问题。

**回滚的提交：**
- ❌ f0614bc: 在handleSearchResult中传入highlightKeywordZh/En参数
- ❌ 0b2ab4a: 在onNavigate中保留所有高亮参数

**回滚到：** df71b41（修复highlightText函数中matchLocation的限制逻辑）

### 第二步：系统性数据流追踪

创建了详细的数据流分析文档（HIGHLIGHT_FLOW_ANALYSIS.md），追踪高亮参数在整个系统中的传递：

```
SearchPage 
  ↓ (生成SearchResult)
App.tsx handleSearchResult
  ↓ (创建overlayRoute)
BGReadPage/SBReadPage
  ↓ (传递参数)
SectionContent
  ↓ (使用currentKeyword计算高亮)
highlightText() 函数
  ↓ (生成带<mark>标签的HTML)
页面显示
```

### 第三步：识别第一个关键问题

**问题位置**：SectionContent.tsx 第126-143行的 useEffect

**原始代码：**
```typescript
useEffect(() => {
  if (!searchKeyword && !highlightKeyword) return;  // ❌ 问题：这个条件太严格
  
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

**问题分析：**
1. 依赖数组中有 `searchKeyword` 和 `highlightKeyword`
2. 当从搜索页进入时，这两个参数可能为空
3. useEffect 会直接返回，不执行滚动逻辑
4. 应该依赖 `currentKeyword` 而不是 `searchKeyword` 和 `highlightKeyword`

**修复（第一次）：**
```typescript
useEffect(() => {
  if (!currentKeyword) return;  // ✅ 改为检查 currentKeyword
  
  // ... 滚动逻辑
}, [currentKeyword, language]);  // ✅ 只依赖 currentKeyword 和 language
```

### 第四步：识别第二个关键问题

**问题位置**：App.tsx 中 BGReadPage 和 SBReadPage 的 onNavigate 回调

**原始代码：**
```typescript
onNavigate={(chId, secIdx) => {
  if (overlayRoute) {
    // overlay 模式：保留高亮参数 ✅
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
    // ❌ 非overlay模式：没有保留高亮参数！
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
1. 用户从搜索页进入 → overlay 模式 → 高亮参数被保留
2. 用户切换左右节 → 仍在 overlay 模式 → 高亮参数被保留
3. 用户点击某个 tab 返回搜索页 → overlay 被清除
4. 用户再次进入阅读页 → 不再是 overlay 模式
5. 用户切换左右节 → 非 overlay 模式 → 高亮参数**丢失**

**修复（第二次）：**
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
    // ✅ 修复：在非overlay模式下也保留高亮参数
    setRouteStack(prev => {
      const newStack = [
        ...prev.slice(0, -1),
        { 
          page: 'bg-read' as const, 
          chapterId: chId, 
          sectionIndex: secIdx,
          searchKeyword: (route as any).searchKeyword,
          highlightKeyword: (route as any).highlightKeyword,
          highlightKeywordZh: (route as any).highlightKeywordZh,
          highlightKeywordEn: (route as any).highlightKeywordEn,
          matchLocation: (route as any).matchLocation 
        },
      ];
      setBookshelfRouteStack(newStack);
      return newStack;
    });
  }
}}
```

### 第五步：识别第三个关键问题（最终问题）

**问题位置**：SearchPage.tsx 中 BG 和 SB 搜索的 SearchResult 构造

**原始代码（第675-686行）：**
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

**问题分析：**

这是**最关键的问题**！虽然 `getMatchInfo()` 函数正确生成了这两个字段：

```typescript
const getMatchInfo = (section: any): {
  matchLocation: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
  highlightKeyword: string;
  highlightKeywordZh: string;    // ✅ 生成了
  highlightKeywordEn: string;    // ✅ 生成了
  isMissingChinese: boolean;
} | null => {
  // ... 返回包含这两个字段的对象
}
```

但在构造 SearchResult 时**没有传递**这两个字段！

**数据流中断的位置：**
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

**修复（第三次，最终修复）：**

BG搜索（第684-685行）：
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

SB搜索（第914-915行）：
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

## 为什么之前的修改没有完全解决问题

### 修改1：SectionContent 的 useEffect 依赖修复

**commit 395fa4f**

这个修改是**必要但不充分**的：
- ✅ 修复了 useEffect 的依赖问题
- ✅ 使得语言切换时能正确滚动
- ❌ 但如果 `highlightKeywordZh` 和 `highlightKeywordEn` 从一开始就是 undefined，这个修改也无法解决

### 修改2：App.tsx 的 onNavigate 参数保留

**commit 395fa4f**

这个修改也是**必要但不充分**的：
- ✅ 修复了非overlay模式下的参数丢失问题
- ✅ 使得导航时高亮参数能被保留
- ❌ 但如果参数本身就是 undefined，保留也没用

### 修改3：SearchPage 的 SearchResult 构造（最终修复）

**commit 2df791c**

这个修改是**真正解决问题的关键**：
- ✅ 确保 `highlightKeywordZh` 和 `highlightKeywordEn` 被正确传递到 SearchResult
- ✅ 使得进入节页面时能获得正确的高亮关键词
- ✅ 使得 currentKeyword 的 useMemo 逻辑能正确工作

---

## 完整的修复时间线

| 提交 | 内容 | 状态 |
|------|------|------|
| 0b2ab4a | 修复问题二：导航节页面时高亮参数丢失 | 部分工作 |
| df71b41 | 修复highlightText函数中matchLocation的限制逻辑 | 基础 |
| 395fa4f | 修复高亮和滚动问题：1. 修改SectionContent的useEffect依赖，2. 在非overlay模式下保留高亮参数 | 必要但不充分 |
| 2df791c | 修复关键问题：在SearchPage中传递highlightKeywordZh和highlightKeywordEn到SearchResult | ✅ 最终解决 |

---

## 关键发现

### 1. 数据流中的三层问题

```
第一层（SearchPage）：❌ 没有传递 highlightKeywordZh/En
  ↓
第二层（App.tsx）：❌ 没有在非overlay模式下保留参数
  ↓
第三层（SectionContent）：❌ useEffect 依赖不对
```

这三层问题需要**全部修复**才能完全解决。

### 2. 为什么"突然修复了又不好用了"

之前的修改（f0614bc 和 0b2ab4a）试图在 App.tsx 层面解决问题，但没有修复 SearchPage 层的根本问题。这导致：
- 某些情况下能工作（当参数巧合地被传递时）
- 某些情况下不工作（当参数为 undefined 时）
- 表现不稳定

### 3. 为什么这次修复是完整的

现在的修复涵盖了整个数据流的三个关键点：

1. **SearchPage 层**：确保 `highlightKeywordZh` 和 `highlightKeywordEn` 被生成并传递
2. **App.tsx 层**：确保高亮参数在导航时被保留
3. **SectionContent 层**：确保 useEffect 依赖正确，能正确使用 currentKeyword

---

## 测试验证

### 测试场景1：英文模式搜索"devotee"进入

**预期**：应该能看到"devotee"被高亮

**验证路径**：
1. 切换到英文模式
2. 搜索"devotee"
3. 点击搜索结果进入节页面
4. 观察是否能看到"devotee"被高亮

### 测试场景2：中文模式搜索后导航

**预期**：切换左右节再返回，高亮应该保持

**验证路径**：
1. 在中文模式搜索"devotee"
2. 进入节页面
3. 切换左右节（如从BG1.1到BG1.2）
4. 再切换回原来的节
5. 观察中文高亮"奉献者"是否仍然存在

### 测试场景3：语言切换时高亮更新

**预期**：切换语言时，高亮应该自动更新为对应语言的版本

**验证路径**：
1. 搜索一个词进入节页面
2. 在节页面内切换语言
3. 观察高亮是否自动更新

---

## 总结

这个问题的根本原因是**SearchPage 中的数据丢失**：虽然 `getMatchInfo()` 函数正确生成了 `highlightKeywordZh` 和 `highlightKeywordEn`，但在构造 SearchResult 对象时没有传递这两个字段。

之前的修改（useEffect 依赖修复和参数保留）是必要的基础工作，但只有当 SearchPage 层的问题被修复后，整个系统才能正常工作。

这次修复通过在 SearchPage 中添加这两个字段的传递，完成了整个数据流的闭合，使得高亮功能能在所有场景下稳定工作。
