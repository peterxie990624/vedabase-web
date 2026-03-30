# 韦达书库项目交接文档

> 本文档用于在新的 Manus 对话任务中快速恢复开发上下文。
> 每次开启新任务时，将本文档内容发给 Manus 即可。

---

## 零、Manus 工作原则

> **Manus 须知**：每次开启新对话任务时，读取本文档后，应主动询问用户是否按照以下工作原则进行本次开发，确认后再开始工作。

**原则一：开启新任务时确认工作原则**
每次开启新的 Manus 对话任务时，读取本文档后，主动询问用户是否按照本节工作原则来进行本次开发，确认后再开始工作。

**原则二：每次与人类对话一来一回后，保存并更新记录**
参考 `docs/chat_logs/` 目录下的 session 文件格式来保存下一次的对话记录。每次对话结束前，将本次完整对话记录保存到 `docs/chat_logs/` 目录下（以日期命名，如 `2026-03-30_session.md`），并推送到 GitHub，方便用户回顾。
如果遇到复杂或并不是你轻易得出解决方案的，或十分关键，或值得作为样例来学习的修复问题，主动与人类(用户)进行询问并同意后，则可以学习`docs/chat_logs/2026-03-30_highlight_fix` 文件夹和其中的内容来整理一份到`docs/chat_logs/` 目录下

**原则三：及时更新项目现状**
在与用户交流过程中，根据项目进程，在有必要时更新本文档中的"项目现状"和"目录结构"内容。当发现新增功能、修复重要 Bug、或项目结构有变化时，应主动提议更新这两个部分，并在用户确认后修改并推送到 GitHub。

**原则四：遇到不确定或有建议时先沟通**
遇到以下情况时，不直接动手，先与用户多轮交流直到明确意图，再开始工作：
- 用户需求表述不清楚
- 有多种实现方案值得用户选择
- 发现某个样式、交互或功能参考主流网站后值得改进
- 某项改动是否需要同步更新"设置 - 关于 App"页面

**原则五：工作原则本身的维护**
在与用户交流过程中，如果发现有值得新增到工作原则的内容，或现有原则不够全面、需要改善，先与用户确认措辞，经用户同意后再更新本节内容并推送到 GitHub。

---

## 一、如何开启新的 Manus 对话（复制以下内容发给 Manus）

```
我有一个韦达书库项目，请帮我继续开发：

GitHub 仓库：https://github.com/peterxie990624/vedabase-web
克隆到：/home/ubuntu/vedabase_web

项目说明：
- 纯静态前端，React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- 数据以 JSON 文件存储在 client/public/data/（无数据库）
- 永久网站：https://peterxie990624.github.io/vedabase-web/
- 每次推送到 main 分支，GitHub Actions 自动构建部署（约 1-2 分钟）

开发流程：
1. 克隆仓库：git clone https://github.com/peterxie990624/vedabase-web /home/ubuntu/vedabase_web
2. 安装依赖：cd /home/ubuntu/vedabase_web && pnpm install
3. 启动预览：pnpm dev（端口 3000）
4. 修改完成后：git add -A && git commit -m "描述" && git push origin main
5. GitHub Actions 自动部署到 https://peterxie990624.github.io/vedabase-web/

GitHub 账号：3431503934@qq.com / Peterxie1

请先克隆仓库后阅读根目录的 HANDOVER.md 文件，并按照其中的 Manus 工作原则进行本次开发。

本次我想要：[在这里描述你想做的事情]
```

---

## 二、项目现状（截至 2026-03-30）

### 项目架构概览

**技术栈**：React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui  
**数据存储**：纯 JSON 文件（无数据库），存储在 `client/public/data/`  
**部署方式**：GitHub Pages + GitHub Actions（推送即部署）  
**国内加速**：jsDelivr CDN（自动检测并切换）

### 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 博伽梵歌（BG） | ✅ | 18章657节，梵文+逐词+中英译文+要旨 |
| 圣典博伽瓦谭（SB） | ✅ | 12篇336章13002节，完整内容 |
| 爱卡达西 | ✅ | 101章故事，含破戒时间 |
| 韦达日历 | ✅ | 2025-2026年，月历视图+节日详情 |
| 双主题 | ✅ | 深色（夜间）/ 浅色（日间），CSS变量驱动 |
| 中英双语 | ✅ | 即时切换，设置持久化 |
| 字体大小 | ✅ | 4档（sm/md/lg/xl），设置持久化 |
| 书签收藏 | ✅ | 精确跳转到具体节，localStorage持久化 |
| 全文搜索 | ✅ | 含历史记录、关键词高亮、截取预览、中英文映射 |
| 左右滑动翻页 | ✅ | 手势+键盘导航 |
| GitHub Pages 部署 | ✅ | 自动 CI/CD，推送即部署 |
| jsDelivr CDN 加速 | ✅ | 国内无需翻墙，自动检测并切换 |
| 搜索进度条 | ✅ | 显示正在加载哪篇、来源、耗时 |
| 开发模式调试面板 | ✅ | 仅 pnpm dev 时显示，含错误诊断 |
| 多位置高亮 | ✅ | 支持梵文、逐词、译文、要旨四个位置的高亮 |
| 中英文词汇映射 | ✅ | 英文搜索时自动映射到中文，中文模式下高亮中文翻译 |

### 最近修复的 Bug（2026-03-30）

| Bug | 提交 | 说明 |
|-----|------|------|
| 英文模式下搜索结果不高亮 | 2df791c | SearchPage 中 highlightKeywordZh/En 未传递到 SearchResult |
| 导航返回后高亮消失 | 395fa4f | 非overlay模式下高亮参数丢失 |
| useEffect 依赖不对 | 395fa4f | 依赖了 searchKeyword 而非 currentKeyword |

### 已修复的历史 Bug

| Bug | 状态 |
|-----|------|
| 书签精确跳转（之前跳到章节开头） | ✅ 已修复 |
| 深色主题下导航栏白色背景 | ✅ 已修复 |
| 列表页面硬编码白色背景 | ✅ 已修复 |
| GitHub Pages 数据路径（404） | ✅ 已修复 |
| 搜索返回逻辑（从阅读页返回搜索结果） | ✅ 已修复 |
| 中文模式下搜索英文关键词的高亮 | ✅ 已修复 |

---

## 三、技术架构

### 目录结构

```
vedabase-web/
├── client/                        # 前端应用
│   ├── public/
│   │   ├── data/                  # 所有 JSON 数据文件
│   │   │   ├── bg_data.json       # 博伽梵歌（2.8MB）
│   │   │   ├── sb_index.json      # SB 目录索引（77KB）
│   │   │   ├── sb/                # SB 分篇数据（共40MB）
│   │   │   │   ├── canto_1.json ~ canto_12.json
│   │   │   ├── akadasi_data.json  # 爱卡达西（326KB）
│   │   │   └── calendar_data.json # 韦达日历（26KB）
│   │   └── __manus__/             # Manus 调试工具
│   └── src/
│       ├── App.tsx                # 主应用、路由、状态管理
│       ├── main.tsx               # 入口文件
│       ├── index.css              # 全局样式 + CSS变量主题
│       ├── const.ts               # 常量定义
│       ├── types.ts               # TypeScript 类型定义
│       ├── pages/                 # 页面组件
│       │   ├── BGReadPage.tsx      # 博伽梵歌阅读页
│       │   ├── SBReadPage.tsx      # 圣典博伽瓦谭阅读页
│       │   ├── SearchPage.tsx      # 全文搜索页
│       │   ├── BookshelfPage.tsx   # 书架页
│       │   ├── BookmarkPage.tsx    # 书签页
│       │   ├── AkadasiPage.tsx     # 爱卡达西页
│       │   └── CalendarPage.tsx    # 韦达日历页
│       ├── components/            # 通用组件
│       │   ├── TopNav.tsx         # 顶部导航（CSS变量主题）
│       │   ├── BottomNav.tsx      # 底部标签栏
│       │   ├── SectionContent.tsx # 节内容显示（含高亮逻辑）
│       │   ├── DevPanel.tsx       # 开发模式调试面板
│       │   ├── LoadingProgress.tsx # 加载进度条
│       │   └── ...
│       ├── contexts/              # React Context
│       │   └── SettingsContext.tsx # 全局设置（主题、语言、字号）
│       ├── hooks/                 # 自定义 Hook
│       │   ├── useData.ts         # 数据加载（jsDelivr CDN优先）
│       │   ├── useSettings.ts     # 主题/语言/字体设置
│       │   └── ...
│       └── lib/                   # 工具函数库
│           ├── wordMapping.ts     # 英文-中文词汇映射表
│           ├── normalizeSanskrit.ts # 梵文规范化函数
│           └── ...
├── server/                        # 后端服务（可选）
│   └── index.ts
├── docs/
│   └── chat_logs/                 # 对话记录存档
│       ├── 2026-03-14_session.md
│       ├── 2026-03-29_v1.7_multi_highlight.md
│       ├── fix_chinese_highlight_2026-03-29.md
│       └── ...
├── .github/workflows/
│   └── deploy.yml                 # GitHub Actions 自动部署配置
├── vite.config.ts                 # Vite 配置（base: /vedabase-web/）
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 项目依赖
├── pnpm-lock.yaml                 # pnpm 锁定文件
├── HANDOVER.md                    # 本文档
├── CHANGELOG.md                   # 版本更新日志
├── CODE_CHANGES_DETAILED.md       # 最近修复的代码对比
├── PROBLEM_DIAGNOSIS_COMPLETE.md  # 最近修复的问题诊断
├── HIGHLIGHT_FLOW_ANALYSIS.md     # 高亮功能数据流分析
└── todo.md                        # 待办事项
```

### 关键技术决策

| 决策 | 说明 |
|------|------|
| 主题系统 | `data-veda-theme` 属性挂在 `<html>` 上，CSS变量覆盖，无需 JS 传 prop |
| 数据加载 | jsDelivr CDN 优先（国内友好），自动回退到 GitHub Pages |
| 路由 | 自定义 routeStack 数组，无需 React Router |
| 持久化 | localStorage（书签、设置），无后端 |
| 部署 | GitHub Actions → GitHub Pages，推送即部署 |
| 高亮系统 | 支持四个位置（梵文/逐词/译文/要旨）、中英文映射、自动滚动 |

### CDN 地址

```
jsDelivr: https://cdn.jsdelivr.net/gh/peterxie990624/vedabase-web@main/client/public
GitHub Pages: https://peterxie990624.github.io/vedabase-web
```

---

## 四、自动推送配置说明

**当前配置：每次修改代码后，运行以下命令即可自动部署：**

```bash
cd /home/ubuntu/vedabase-web
git add -A
git commit -m "你的修改说明"
git push origin main
# 约 1-2 分钟后 https://peterxie990624.github.io/vedabase-web/ 自动更新
```

**GitHub Actions 工作流（`.github/workflows/deploy.yml`）已配置：**
- 触发条件：推送到 `main` 分支
- 构建命令：`VITE_BASE_PATH=/vedabase-web/ pnpm build`
- 部署目标：GitHub Pages

**注意**：Manus 的 gh CLI token 默认没有 `workflow` 权限，如果需要修改 `.github/workflows/` 目录下的文件，需要通过浏览器登录 GitHub 网页操作，或者让 Manus 通过浏览器完成。

---

## 五、最近修复的问题详解

### 搜索高亮问题（2026-03-30）

**问题**：在英文模式搜索"devotee"时，进入节页面后看不到高亮

**根本原因**：SearchPage 中构造 SearchResult 时，虽然 `getMatchInfo()` 生成了 `highlightKeywordZh` 和 `highlightKeywordEn`，但没有传递到 SearchResult 对象

**修复**：在 SearchPage.tsx 的 BG 和 SB 搜索中，添加这两个字段的传递

**相关文档**：
- `CODE_CHANGES_DETAILED.md` - 详细的代码对比
- `PROBLEM_DIAGNOSIS_COMPLETE.md` - 完整的诊断过程
- `HIGHLIGHT_FLOW_ANALYSIS.md` - 高亮功能数据流分析

---

> 详细对话记录请查看 `docs/chat_logs/` 目录下的 session 文件。

*文档更新时间：2026-03-30*  
*项目版本：v1.8（搜索高亮完全修复）*
