# 韦达书库 - SB 目录页面修复（2026-04-03）

**日期**：2026-04-03  
**版本**：v1.9  
**主要修复**：SB 目录页面篇名显示、章节标题、样式定位和折叠功能

---

## 问题描述

用户在 SB 10.29.45 页面打开 TOC 时发现多个问题：

1. **篇名缺失副标题**：目录中只显示"第十一篇"，应该显示"第十篇 至善"
2. **章节标题错误**：显示的是"第十一篇 牧牛姑娘寻找奎师那"（第三十章的标题），而应该是"第十篇 至善"和"第二十九章 为跳挼萨舞，奎师那与牧牛姑娘相会"
3. **样式定位问题**：sticky 块超出父级顶部
4. **缺乏交互**：篇和章不可点击，无法折叠/展开

---

## 根本原因分析

### 问题 1 & 2：篇名和章节标题
- **原因**：SBReadPage 的 TOC 中只使用了 `canto.zh_name` 和 `ch.zh_title`，没有组合篇副标题和章名
- **参考**：SBChaptersPage 已经正确实现了这个逻辑（第 27 行）：
  ```typescript
  const cantoTitle = cantoSubtitle ? `${cantoLabel} ${cantoSubtitle}` : cantoLabel;
  ```

### 问题 3：样式定位
- **原因**：sticky 块的 `top` 值设置不当
  - 篇块：`top: 60px`（应该是 `0px`）
  - 章块：`top: stickyCantoTitle ? '110px' : '60px'`（应该是 `60px` 或 `0px`）

### 问题 4：交互功能
- **原因**：没有实现篇的展开/折叠状态管理

---

## 实现方案

### Phase 1：修复篇名和章节标题显示

**改动文件**：`client/src/pages/SBReadPage.tsx`

#### 1. 组合篇名和副标题
```typescript
// 之前
const cantoTitle = isEn ? canto.en_name : canto.zh_name;

// 之后
const cantoLabel = isEn ? canto.en_name : canto.zh_name;
const cantoSubtitle = isEn ? (canto.en_subtitle || '') : (canto.zh_subtitle || '');
const cantoTitle = cantoSubtitle ? `${cantoLabel} ${cantoSubtitle}` : cantoLabel;
```

#### 2. 组合章名和章节标题
```typescript
// 之前
const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');

// 之后
const chapterName = isEn ? ch.en_name : ch.zh_name;
const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');
const fullChapterTitle = `${chapterName} ${chapterTitle}`;
```

#### 3. 更新 data-chapter-title 属性和渲染
```typescript
// 之前
data-chapter-title={chapterTitle}
{chapterTitle}

// 之后
data-chapter-title={fullChapterTitle}
{fullChapterTitle}
```

---

### Phase 2：修复样式定位

#### 1. 篇 sticky 块
```typescript
// 之前
top: '60px'

// 之后
top: '0px'
```

#### 2. 章 sticky 块
```typescript
// 之前
top: stickyCantoTitle ? '110px' : '60px'

// 之后
top: stickyCantoTitle ? '60px' : '0px'
```

#### 3. 调整 padding
- 篇块：保持 `12px 16px`
- 章块：改为 `10px 16px`（移除了不必要的 `10px 24px`）

---

### Phase 3：实现折叠功能

#### 1. 添加状态管理
```typescript
const [expandedCantos, setExpandedCantos] = useState<Set<number>>(new Set());
const [currentCantoId, setCurrentCantoId] = useState<number | null>(null);
```

#### 2. 添加展开/折叠逻辑
```typescript
// 当打开 TOC 时，展开当前篇
useEffect(() => {
  if (showToc && cantoId) {
    setCurrentCantoId(cantoId);
    setExpandedCantos(prev => new Set([...prev, cantoId]));
  }
}, [showToc, cantoId]);

// 切换篇的展开/折叠
const toggleCantoExpand = (id: number) => {
  setExpandedCantos(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};
```

#### 3. 修改篇的渲染逻辑
```typescript
// 添加展开状态检查
const isExpanded = expandedCantos.has(canto.id);

// 修改点击事件：切换展开/折叠而不是直接导航
onClick={(e) => {
  e.stopPropagation();
  toggleCantoExpand(canto.id);
}}

// 添加展开/折叠箭头
<div style={{ fontSize: '0.7rem', color: isCurrentCanto ? tocActiveColor : tocTextSecondary, marginLeft: '8px' }}>
  {isExpanded ? '▼' : '▶'}
</div>

// 条件渲染章节
{isExpanded && cantoChapters.map(ch => {
  // ...
})}
```

---

## 修复前后对比

### 修复前
```
目录
圣典博伽瓦谭

第十一篇
────────────────
牧牛姑娘寻找奎师那
────────────────
SB 10.29.3  主圣师那看到圆圈的满月放射着新...
SB 10.29.4  温达文女子听到奎师那的笛...
...
```

### 修复后
```
目录
圣典博伽瓦谭

▶ 第一篇 创造
▶ 第二篇 宇宙展示
...
▼ 第十篇 至善
  第一章 有关主奎师那的降临
  第二章 半神人向母腹中的奎师那祈祷
  ...
  第二十九章 为跳挼萨舞，奎师那与牧牛姑娘相会
    SB 10.29.45  圣奎师那与牧牛姑娘们一起去雅沐...
    SB 10.29.46  ...
  第三十章 牧牛姑娘寻找奎师那
    ...
▶ 第十一篇 通史
▶ 第十二篇 罪恶的年代
```

---

## 编译结果

✅ **编译成功**，无任何错误或警告

```
vite v7.1.9 building for production...
transforming...
✓ 1625 modules transformed.
rendering chunks...
computing gzip size...
../dist/public/index.html                 367.71 kB │ gzip: 105.56 kB
../dist/public/assets/index-DflE7iJB.css  117.55 kB │ gzip:  18.99 kB
../dist/public/assets/index-BIFfgXC0.js   619.29 kB │ gzip: 193.87 kB
✓ built in 4.32s
```

---

## 修复清单

- [x] 篇名显示副标题
- [x] 章节标题组合章名和标题
- [x] 修复 sticky 块定位
- [x] 实现篇的展开/折叠
- [x] 其他篇默认折叠
- [x] 当前篇默认展开
- [x] 添加展开/折叠箭头
- [x] 编译无错误
- [x] 代码推送到 GitHub

---

## 后续建议

1. **测试验证**：在 https://peterxie990624.github.io/vedabase-web 上验证修复效果
2. **性能优化**：考虑使用 useCallback 优化 toggleCantoExpand 函数
3. **功能扩展**：可考虑为章也添加展开/折叠功能（目前只有当前章展开）
4. **用户体验**：可考虑记住用户的展开/折叠偏好到 localStorage

---

## 版本信息

- **前一版本**：v1.8（2026-03-30）
- **当前版本**：v1.9（2026-04-03）
- **主要变更**：SB 目录页面篇名显示、章节标题、样式定位和折叠功能完整修复
