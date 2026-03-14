# 韦达书库网页版 (Vedabase Web)

> 基于韦达书库安卓 APP 内容构建的网页版阅读平台，收录博伽梵歌、圣典博伽瓦谭、爱卡达西故事及韦达日历。

---

## 📖 项目简介

**韦达书库网页版**是一个专为阅读韦达经典而设计的 Progressive Web App（PWA），内容来源于韦达书库安卓 APP，所有译文均采用原版人工翻译（非机器翻译）。

本项目旨在让用户无需安装 APP 即可在任何设备的浏览器中流畅阅读韦达经典，支持深色/浅色双主题、中英双语切换、书签收藏、全文搜索等功能。

---

## 📚 内容收录

| 经典 | 规模 | 说明 |
|------|------|------|
| 博伽梵歌（Bhagavad-gita As It Is） | 18 章，657 节 | 含梵文原文、逐词释义、中英译文、要旨 |
| 圣典博伽瓦谭（Srimad-Bhagavatam） | 12 篇，336 章，13,002 节 | 含梵文原文、逐词释义、中英译文、要旨 |
| 爱卡达西故事（Ekadasi） | 101 章 | 含破戒时间、节日背景、完整故事 |
| 韦达日历（Vaishnava Calendar） | 2025–2026 年 | 爱卡达西、圣人纪念日等节日 |

---

## ✨ 功能特性

**阅读体验**

- 梵文原文、逐词释义、中英双语译文、要旨完整呈现
- 左右滑动翻页（移动端手势支持）
- 字体大小调节（三档可选）
- 深色主题（夜间深蓝/金色）与浅色主题（日间米白/蓝色）切换

**导航与搜索**

- 全文搜索（支持中文、英文、梵文关键词），搜索历史自动保存
- 书签收藏，精确跳转到收藏节（非章节开头）
- 章节目录快速导航

**韦达日历**

- 月历视图，节日高亮显示
- 点击日期查看当日节日详情（爱卡达西、圣人纪念日等）

**多语言**

- 中文 / 英文译文即时切换

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| UI 组件 | shadcn/ui + Tailwind CSS |
| 状态管理 | React Context + localStorage |
| 路由 | 自定义状态路由（无 React Router） |
| 后端 | Node.js + Express（静态文件服务） |
| 数据格式 | JSON（静态数据文件） |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/peterxie990624/vedabase-web.git
cd vedabase-web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

浏览器访问 `http://localhost:5173` 即可。

### 构建生产版本

```bash
pnpm build
```

---

## 📁 项目结构

```
vedabase-web/
├── client/                  # 前端源代码
│   ├── src/
│   │   ├── components/      # 公共组件（导航栏、阅读器等）
│   │   ├── pages/           # 页面组件（书架、阅读、搜索等）
│   │   ├── hooks/           # 自定义 Hooks（设置、书签等）
│   │   ├── types.ts         # TypeScript 类型定义
│   │   ├── constants.ts     # 常量（主题、字体等）
│   │   └── App.tsx          # 应用入口
│   └── public/
│       └── data/            # 经典内容 JSON 数据文件
│           ├── bg/          # 博伽梵歌数据
│           ├── sb/          # 圣典博伽瓦谭数据
│           ├── ekadasi/     # 爱卡达西数据
│           └── calendar/    # 韦达日历数据
├── server/                  # 后端服务
├── shared/                  # 前后端共用代码
├── patches/                 # 依赖补丁
├── package.json
├── vite.config.ts
└── CHANGELOG.md
```

---

## 📱 安卓 APP

原版安卓 APP（`base.apk`）已附于本仓库 [Releases](https://github.com/peterxie990624/vedabase-web/releases) 页面，可直接下载安装到安卓设备。

---

## 📄 内容来源与版权

本项目内容来源于**韦达书库安卓 APP**，经典译文版权归原译者所有。网页版仅供个人学习和阅读使用，参考资源：[vedabase.io](https://vedabase.io)。

---

## 🙏 致谢

感谢圣帕布帕德（A.C. Bhaktivedanta Swami Prabhupada）对韦达经典的翻译与注释，使这些古老智慧得以广泛传播。
