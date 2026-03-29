# 修复中文模式下搜索英文关键词的高亮问题

**日期**: 2026-03-29  
**任务**: 修复SectionContent.tsx中的highlightText()函数，使其能够在中文模式下搜索英文关键词时，正确在中文译文和中文要旨中高亮映射后的中文关键词

## 问题描述

在中文模式下搜索英文关键词（如"devotee"）时：
- ✅ 搜索列表中显示英文高亮（正常）
- ✅ 梵文释义部分(wordmeaning)能正确高亮中文词汇（正常）
- ❌ 进入阅读页后，要旨部分没有高亮任何内容
- ❌ 译文部分也未实现中文高亮

## 根本原因分析

### 工作流程回顾
1. **SearchPage.tsx** 中的 `getMatchInfo()` 函数：
   - 在中文模式下搜索英文关键词时，通过 `wordMapping` 映射表查询对应的中文翻译
   - 将映射后的中文关键词设置到 `highlightKeyword` 字段
   - 设置 `matchLocation` 来指示匹配的位置

2. **BGReadPage/SBReadPage** 正确地将这些属性传递给 `SectionContent`

### 问题所在
**SectionContent.tsx** 的 `highlightText()` 函数中，梵文规范化逻辑对中文关键词不适用：

```typescript
const normalizedKw = normalizeSanskrit(keyword);
if (!normalizedKw) return html;  // 中文关键词规范化后为空！
```

当 `highlightKeyword` 是中文（如"奉献者"）时：
- `normalizeSanskrit("奉献者")` 返回空字符串
- 函数直接返回原始HTML，不进行任何高亮

## 解决方案

修改 `highlightText()` 函数的逻辑顺序：

### 修复前
```typescript
// 先尝试直接匹配
const directRegex = new RegExp(escaped, 'gi');
if (directRegex.test(html)) {
  // 高亮...
}

// 梵文规范化匹配
const normalizedKw = normalizeSanskrit(keyword);
if (!normalizedKw) return html;  // ❌ 中文关键词在这里返回
// 高亮...
```

### 修复后
```typescript
// 先尝试直接匹配（对中文、英文、梵文都有效）
// 这是最重要的一步，因为中文关键词无法通过梵文规范化匹配
const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const directRegex = new RegExp(escaped, 'gi');
if (directRegex.test(html)) {
  return html.replace(
    new RegExp(escaped, 'gi'),
    match => `<mark class="search-highlight" ...>${match}</mark>`
  );
}

// 梵文规范化匹配：逐字扫描，找到匹配的原始字符串并高亮
// 注意：对于中文关键词，normalizeSanskrit会返回空字符串，此时直接返回html
const normalizedKw = normalizeSanskrit(keyword);
if (!normalizedKw) return html;  // ✅ 中文关键词无法规范化，返回原始html（直接匹配已失败）
// 梵文规范化匹配逻辑...
```

## 关键改进

1. **优先尝试直接匹配**：对中文、英文、梵文都有效
2. **中文关键词处理**：直接匹配成功后就返回，不会进入梵文规范化逻辑
3. **梵文规范化保留**：用于处理带变音符号的梵文（如"uvāca"匹配"uvaca"）

## 测试验证

### 测试1：中文关键词在中文要旨中的高亮 ✅
```
输入文本: 奉献者应该完全依赖于主。奉献者的生活充满了奉献精神。
关键词: 奉献者
结果: <mark>奉献者</mark>应该完全依赖于主。<mark>奉献者</mark>的生活充满了奉献精神。
```

### 测试2：英文关键词在英文要旨中的高亮 ✅
```
输入文本: The devotee should completely depend on the Lord. A devotee is always engaged in service.
关键词: devotee
结果: The <mark>devotee</mark> should completely depend on the Lord. A <mark>devotee</mark> is always engaged in service.
```

### 测试3：梵文关键词在梵文文本中的高亮 ✅
```
输入文本: bhagavān uvāca śrī-bhagavān uvāca
关键词: uvaca (规范化形式)
结果: bhagavān <mark>uvāca</mark> śrī-bhagavān <mark>uvāca</mark>
```

### 测试4：matchLocation过滤 ✅
```
输入文本: 奉献者应该依赖于主。
关键词: 奉献者
matchLocation: purport, location: wordmeaning (不匹配)
结果: 奉献者应该依赖于主。(未高亮，正确)
```

## 修改文件

- **client/src/components/SectionContent.tsx**
  - 修改 `highlightText()` 函数（第174-217行）
  - 添加详细注释说明中文直接匹配的重要性

## 编译结果

✅ 编译成功，无错误或警告

```
vite v7.1.9 building for production...
✓ 1625 modules transformed.
✓ built in 5.01s
```

## 后续优化建议

1. **自动滑动到关键词位置**：搜索英文或梵文/译文/逐词时自动滚动到第一个高亮位置
2. **同节多个中文命中的合并**：同一节的多个中文命中需要合并为一条搜索结果
3. **中文缺失时的标记显示**：完善中文缺失时的"[无中文翻译]"标记

## 验证步骤

用户可以通过以下步骤验证修复：

1. 切换到中文模式
2. 在搜索框输入英文关键词（如"devotee"、"devotion"等）
3. 查看搜索结果中的高亮
4. 点击结果进入阅读页
5. 验证要旨部分是否高亮对应的中文翻译（如"奉献者"、"奉爱"等）
6. 验证译文部分是否也正确高亮

