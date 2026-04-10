# 韦达书库项目交接文档

> 本文档用于在新的 Manus 对话任务中快速恢复开发上下文。
> 每次开启新任务时，将本文档内容发给 Manus 即可。

---

## 零、Manus 工作原则

> **Manus 须知**：当用户让Manus读取这个文档的时候，特别要读取**【零、Manus工作原则】**，而且要**注意【零】里面的每一个字，**特别要注意**加粗的部分**。每次对话结尾，将提交号（如果修改了项目文件的话）和相对应的时间[年月日时分]、你所提交的所有文件位置还有遵从【Manus工作原则】做了哪些事情、项目里有多少个日志文件、发给用户。

### 原则一：开启新任务时确认工作原则
你要记得，只要用户发出了**请读取handover或者https://github.com/peterxie990624/vedabase-web/edit/main/HANDOVER.md**，无论用户与你进行了再简单的怎样的对话，也要严格按照本文件中的工作原则中的每一个字执行。
每次**开启新的 Manus 对话任务时**以及**继续之前的对话任务时**，读取本文档后，去读取`logs_human_to_manus`下的日志，在足够了解项目历史对话的情况下，与用户有更加默契的配合，要保证**每次执行是在了解了历史对话的前提下进行的**，如果某次用户发出消息时你没有确保你知道本项目到底有多少个日志文件时，说明你忘记读取历史对话了，这时候去读取`logs_human_to_manus`下的所有日志。

### 原则二：自动化日志记录与交接文档维护
#### 原则：
每次在【用户发出内容】和【完成对话或等待用户回答】时，分别记录【当前时间月日年时分】
并且，在Manus 发给用户内容的结尾时，开始提交对话日志：
在文件夹 `logs_human_to_manus` 下自动按照这个时间创建/更新其中的文件，分别将用户的话****原封不动、完整****地加入（包括用户发的图片，用户上传的文件仅用名字替代），还有对Manus执行任务期间所做的每一步都要能够获取到并从中摘取**必要的内容**，包括在**每段最后做了【哪些改动】，进行了哪些【必要和关键尝试】**，原则是**摘取的内容也要原封不动、完整**。**图片上传到**`./docs/chat_logs/logs_human_to_manus/images` ，先保留之前的命名，并在日志中引用这些图片。
在提交了对话日志后，将**Manus 须知**里面要汇报给用户的内容，写在结尾处
#### 实施方式：
- 按日期创建文件（如 `2026-04-04.md`）
- 同一日期的多个会话用**二级标题**分隔（如 `## 会话 1 (11:00 - 11:30)`）
- 在二级标题中标注会话的**开始和结束时间**，便于识别会话间隔
- 如果两次对话时间间隔超过了一个小时，则视为另一个会话
- 用户消息：完整保留，包括图片引用和文件名
- Manus 消息：摘取关键内容、操作步骤、改动说明
- 定期更新本交接文档，记录最新进展
#### 文件结构示例：
```
├── logs_human_to_manus/
│   ├── 2026-04-04.md (第一天的所有会话，用二级标题分隔)
│   ├── 2026-04-05.md (第二天的所有会话)
│   └── 2026-04-06.md (第三天的所有会话)
├── handover.md (本文件，定期更新)
└── ...
```
#### 会话分隔示例：
```markdown
# 2026-04-04 对话记录
## 会话 1 (11:00 - 11:30)
### 第一阶段：DNS 和服务器配置
...
## 会话 2 (14:45 - 15:20)
### 第四阶段：HTTPS 配置与麦克风权限解决
```

### 原则三：及时更新项目现状
在与用户交流过程中，根据项目进程，在有必要时更新本文档中的"项目现状"和"目录结构"内容。当发现新增功能、修复重要 Bug、或项目结构有变化时，应主动提议更新这两个部分，并在用户确认后修改并推送到 GitHub。

### 原则四：遇到不确定或有建议时先沟通
遇到以下情况时，不直接动手，先与用户多轮交流直到明确意图，再开始工作：
- 用户需求表述不清楚
- 有多种实现方案值得用户选择
- 发现某个样式、交互或功能参考主流网站后值得改进
- 某项改动是否需要同步更新"设置 - 关于 App"页面
遇到用户在描述一个布局需要调整或者提到了某个页面这类自然语言时，主动询问用户让他与你配合，对这些前端元素起名字，比如‘头部块’‘节页面’‘红色框’‘顶部章标题块’等等，你应该主动给这些实际的代码元素起不同的名字，以便方便用户描述
-可以用如下的图描述：
```markdown
┌─────────────────────────┐
│  目录（红色块）          │
│  圣典博伽瓦谭            │
├─────────────────────────┤
│  篇/章块（新位置）       │  ← 放在这里
│  第十篇 至尊            │
├─────────────────────────┤
│  目录内容（可滚动）      │
│  第二章 半神人向母腹...  │
│  ...                    │
└─────────────────────────┘
```

### 原则五：工作原则本身的维护
在与用户交流过程中，如果发现有值得新增到工作原则的内容，或现有原则不够全面、需要改善，先与用户确认措辞，经用户同意后再更新本节内容并推送到 GitHub。另外如果发现项目结构不合理、重复性代码，冗杂代码，或handover.md文件内容值得新增和修改，也与用户确认措辞，经用户同意后再更新本节内容并推送到 GitHub。

### 原则六：代码原则
你现在的角色是资深的小程序项目架构师
当你看到项目里面有可复用的组件时，比如有相似的页面，或两处相似的功能，你要与用户主动交流，优化代码，让用户不去重复描述相同需求的功能
你必须对整个项目实时有着充分的了解，应该去查看提交历史记录，比如github的，并且对项目的流程推进有着充分的了解，应该去查看`logs_human_to_manus`中的对话日志

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

## 二、项目现状（截至 2026-04-04）

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
| 屏幕导航 | ✅ | 触摸滑动、键盘导航（点击屏幕左右已禁用） |
| GitHub Pages 部署 | ✅ | 自动 CI/CD，推送即部署 |
| jsDelivr CDN 加速 | ✅ | 国内无需翻墙，自动检测并切换 |
| 搜索进度条 | ✅ | 显示正在加载哪篇、来源、耗时 |
| 开发模式调试面板 | ✅ | 仅 pnpm dev 时显示，含错误诊断 |
| 多位置高亮 | ✅ | 支持梵文、逐词、译文、要旨四个位置的高亮 |
| 中英文词汇映射 | ✅ | 英文搜索时自动映射到中文，中文模式下高亮中文翻译 |
| 高亮颜色 | ✅ | 查坦尼亚金色（#d4a017），深色模式下为 #b8860b |
| 搜索历史记忆 | ✅ | 2 小时内记忆搜索历史，超时后清除 |

### 最近修复的 Bug（2026-04-04）

| Bug | 提交 | 说明 |
|-----|------|------|
| 目录激活标记逻辑错误 | 3b250e8 | 小节激活判断改为 `(ch.id === chapterId && idx === sectionIndex)` |
| 顶部章块点击导航 | 37e82b0 | 改为滑动目录而不导航，使用 `scrollIntoView()` |

### 之前修复的 Bug（2026-03-30）

| Bug | 提交 | 说明 |
|-----|------|------|
| 英文模式下搜索结果不高亮 | 2df791c | SearchPage 中 highlightKeywordZh/En 未传递到 SearchResult |
| 导航返回后高亮消失 | 395fa4f | 非overlay模式下高亮参数丢失 |
| useEffect 依赖不对 | 395fa4f | 依赖了 searchKeyword 而非 currentKeyword |
| 点击屏幕左右翻页 | 5a5fc40 | 已注释掉，保留触摸滑动和键盘导航 |
| vedabooks.net 网址 | 36727fb | 已从关于页面移除 |

### 已修复的历史 Bug

| Bug | 状态 | 版本 |
|-----|------|------|
| 书签精确跳转（之前跳到章节开头） | ✅ 已修复 | v1.0 |
| 深色主题下导航栏白色背景 | ✅ 已修复 | v1.0 |
| 列表页面硬编码白色背景 | ✅ 已修复 | v1.0 |
| GitHub Pages 数据路径（404） | ✅ 已修复 | v1.0 |
| 搜索返回逻辑（从阅读页返回搜索结果） | ✅ 已修复 | v1.6 |
| 中文模式下搜索英文关键词的高亮 | ✅ 已修复 | v1.7 |
| 搜索高亮颜色 | ✅ 已修复 | v1.6 |
| 搜索结果预览截取 | ✅ 已修复 | v1.6 |
| 封面图加载闪烁 | ✅ 已修复 | v1.6 |
| 开发模式激活 | ✅ 已修复 | v1.6 |
| Tab 切换记忆 | ✅ 已修复 | v1.6 |

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
│       ├── 2026-03-22_session.md
│       ├── 2026-03-23_v1.6_fixes.md
│       ├── 2026-03-29_v1.7_multi_highlight.md
│       ├── 2026-03-30_highlight_fix/
│       │   ├── CODE_CHANGES_DETAILED.md
│       │   ├── HIGHLIGHT_FLOW_ANALYSIS.md
│       │   └── PROBLEM_DIAGNOSIS_COMPLETE.md
│       └── ...
├── .github/workflows/
│   └── deploy.yml                 # GitHub Actions 自动部署配置
├── vite.config.ts                 # Vite 配置（base: /vedabase-web/）
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 项目依赖
├── pnpm-lock.yaml                 # pnpm 锁定文件
├── HANDOVER.md                    # 本文档
├── CHANGELOG.md                   # 版本更新日志
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
- `docs/chat_logs/2026-03-30_highlight_fix/CODE_CHANGES_DETAILED.md` - 详细的代码对比
- `docs/chat_logs/2026-03-30_highlight_fix/PROBLEM_DIAGNOSIS_COMPLETE.md` - 完整的诊断过程
- `docs/chat_logs/2026-03-30_highlight_fix/HIGHLIGHT_FLOW_ANALYSIS.md` - 高亮功能数据流分析

---

> 详细对话记录请查看 `docs/chat_logs/` 目录下的 session 文件。

*文档更新时间：2026-04-04*  
*项目版本：v1.9（目录激活标记修复、顶部块点击行为优化）*
