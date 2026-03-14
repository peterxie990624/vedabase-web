# 韦达书库项目交接文档

> 本文档用于在新的 Manus 对话任务中快速恢复开发上下文。
> 每次开启新任务时，将本文档内容发给 Manus 即可。

---

## 零、Manus 工作原则

> **Manus 须知**：每次开启新对话任务时，读取本文档后，应主动询问用户是否按照以下工作原则进行本次开发，确认后再开始工作。

**原则一：开启新任务时确认工作原则**
每次开启新的 Manus 对话任务时，读取本文档后，主动询问用户是否按照本节工作原则来进行本次开发，确认后再开始工作。

**原则二：对话结束后保存记录**
每次对话结束前，将本次完整对话记录保存到 `docs/chat_logs/` 目录下（以日期命名，如 `2026-03-14_session.md`），并推送到 GitHub，方便用户回顾学习。

**原则三：遇到不确定或有建议时先沟通**
遇到以下情况时，不直接动手，先与用户多轮交流直到明确意图，再开始工作：
- 用户需求表述不清楚
- 有多种实现方案值得用户选择
- 发现某个样式、交互或功能参考主流网站后值得改进
- 某项改动是否需要同步更新"设置 - 关于 App"页面

**原则四：工作原则本身的维护**
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

## 二、项目现状（截至 2026-03-14）

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
| 全文搜索 | ✅ | 含历史记录、关键词高亮、截取预览 |
| 左右滑动翻页 | ✅ | 手势+键盘导航 |
| GitHub Pages 部署 | ✅ | 自动 CI/CD，推送即部署 |
| jsDelivr CDN 加速 | ✅ | 国内无需翻墙，自动检测并切换 |
| 搜索进度条 | ✅ | 显示正在加载哪篇、来源、耗时 |
| 开发模式调试面板 | ✅ | 仅 pnpm dev 时显示，含错误诊断 |

### 已修复的 Bug

| Bug | 状态 |
|-----|------|
| 书签精确跳转（之前跳到章节开头） | ✅ 已修复 |
| 深色主题下导航栏白色背景 | ✅ 已修复 |
| 列表页面硬编码白色背景 | ✅ 已修复 |
| GitHub Pages 数据路径（404） | ✅ 已修复 |
| 搜索返回逻辑（从阅读页返回搜索结果） | ✅ 已修复 |

---

## 三、待完成事项（todo.md）

### 高优先级

- [ ] **SB 中文逐词释义**：数据库有 `words_zh_fc` 字段但代码中未使用；中文模式下应显示"英文词 + 中文释义"标签对
- [ ] **底部导航书签 bug（bug01）**：从阅读页直接点底部书签标签 → 书签页布局错乱

### 中优先级

- [ ] **爱卡达西深色主题**：AkadasiPage 部分样式未完全适配深色主题
- [ ] **书架页真实封面图**：BG 封面用 `e4.png`，SB 封面用 `ux.png`（CDN 已有资源）
- [ ] **应用 Logo**：替换顶部 OM 图标，CDN 已有资源

### 低优先级

- [ ] **爱卡达西封面图生成**：莲花/梵文风格图片
- [ ] **设置菜单优化**：左上角齿轮图标下拉菜单（语言、字号、风格切换）

---

## 四、技术架构

### 目录结构

```
vedabase_web/
├── client/
│   ├── public/
│   │   └── data/              # 所有 JSON 数据文件
│   │       ├── bg_data.json   # 博伽梵歌（2.8MB）
│   │       ├── sb_index.json  # SB目录（77KB）
│   │       ├── sb/            # SB分篇数据（共40MB）
│   │       │   ├── canto_1.json ~ canto_12.json
│   │       ├── akadasi_data.json  # 爱卡达西（326KB）
│   │       └── calendar_data.json # 日历（26KB）
│   └── src/
│       ├── App.tsx            # 路由、状态管理
│       ├── pages/             # 页面组件
│       ├── components/        # 通用组件
│       │   ├── TopNav.tsx     # 顶部导航（CSS变量主题）
│       │   ├── BottomNav.tsx  # 底部标签栏
│       │   ├── DevPanel.tsx   # 开发模式调试面板
│       │   └── LoadingProgress.tsx  # 加载进度条
│       ├── hooks/
│       │   ├── useData.ts     # 数据加载（jsDelivr CDN优先）
│       │   └── useSettings.ts # 主题/语言/字体设置
│       └── index.css          # 全局样式 + CSS变量主题
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions 自动部署
├── vite.config.ts             # base: /vedabase-web/（GitHub Pages）
├── todo.md                    # 待办事项
└── CHANGELOG.md               # 版本更新日志
```

### 关键技术决策

| 决策 | 说明 |
|------|------|
| 主题系统 | `data-veda-theme` 属性挂在 `<html>` 上，CSS变量覆盖，无需 JS 传 prop |
| 数据加载 | jsDelivr CDN 优先（国内友好），自动回退到 GitHub Pages |
| 路由 | 自定义 routeStack 数组，无需 React Router |
| 持久化 | localStorage（书签、设置），无后端 |
| 部署 | GitHub Actions → GitHub Pages，推送即部署 |

### CDN 地址

```
jsDelivr: https://cdn.jsdelivr.net/gh/peterxie990624/vedabase-web@main/client/public
GitHub Pages: https://peterxie990624.github.io/vedabase-web
```

---

## 五、自动推送配置说明

**当前配置：每次修改代码后，运行以下命令即可自动部署：**

```bash
cd /home/ubuntu/vedabase_web
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

> 详细对话记录请查看 `docs/chat_logs/` 目录下的 session 文件。

*文档生成时间：2026-03-14*
*项目版本：v1.3（自定义搜索下拉 + 全部搜索 + 箭头溢出修复）*
