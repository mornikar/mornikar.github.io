---
title: 项目总览
---
# 🌐 LLM Wiki + Hexo 博客

> **基于 LLM Wiki 知识管理 + Hexo 静态生成 + GitHub Pages 部署的私人技术博客**

---

## 快速导航

| 文档 | 说明 |
|------|------|
| [🚀 安装部署](/docs/INSTALL/) | **新用户必读**：从零部署自己的博客到 GitHub Pages |
| [📐 系统架构](/docs/PROJECT/) | 目录结构、组件关系、部署流程 |
| [🔧 维护指南](/docs/MAINTENANCE/) | 日常使用、Wiki 编辑、Dify 同步 |
| [💬 Giscus 留言](/docs/GISCUS/) | 基于 GitHub Discussions 的评论系统 |
| [🔍 故障排查](/docs/TROUBLESHOOTING/) | 常见问题与解决方案 |
| [📋 迁移规范](/docs/MIGRATION/) | Wiki 格式、WikiLink、frontmatter |
| [🌲 分支说明](/docs/BRANCHES/) | source/main 分支关系、工作流程 |

---

## ⚙️ 系统要求

| 环境 | 版本要求 | 说明 |
|------|----------|------|
| **Node.js** | ≥ 18.x | 推荐 LTS 版本 |
| **Hexo** | ≥ 7.0 | 博客框架 |
| **Git** | ≥ 2.30 | 版本控制 |
| **Docker Desktop** | ≥ 4.28 | Dify 本地部署（可选） |
| **Tailscale** | 最新版 | 公网访问（可选） |

> 💡 推荐使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 管理 Node.js 版本

---

## 🚀 快速开始

### 方式一：本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/mornikar/mornikar.github.io.git
cd mornikar.github.io/Hexo

# 2. 安装依赖
npm install

# 3. 安装主题依赖
cd themes/arknights
npm install
cd ../..

# 4. 一键同步并预览
wiki-sync.bat

# 5. 访问 http://localhost:4000
```

### 方式二：仅 Wiki 编辑者

```bash
# 编辑 .wiki/ 目录下的 .md 文件后
wiki-sync.bat

# 推送前预览（不修改文件）
wiki-sync.bat --dry-run
```

### 方式三：仅文档贡献者

直接编辑 `.docs-src/` 目录下的 Markdown 文件，推送后 CI 自动将 Markdown 转换为 HTML 并部署到 `/docs/`。

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    本地开发环境                        │
│                                                     │
│  .wiki/*.md    ←──────  Wiki 编辑入口                │
│       │                                          │
│       ▼  wiki-to-hexo.js                        │
│  source/_posts/*.md   ←───  Hexo 文章源            │
│       │                                          │
│       ▼  hexo generate                          │
│  public/   ←───────────  静态输出                 │
│       │                                          │
│       ▼  Git push → CI                         │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                 GitHub Pages                          │
│                                                     │
│  source 分支  ──→  CI  ──→  gh-pages 分支（分支推送 Pages）│
│                              │                       │
│                              ▼                       │
│  mornikar.github.io  +  /docs/                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 核心组件一览

| 组件 | 版本 | 用途 |
|------|------|------|
| **Hexo** | 7.x | 静态博客生成 |
| **hexo-theme-arknights** | fork | 明日方舟风格主题 |
| **wiki-to-hexo.js** | v4.0 | Wiki → Hexo 格式转换 |
| **Dify** | 1.13.3 | 本地 RAG 知识库 + AI 对话 |
| **WikiChat** | — | 网站侧边栏 AI 对话悬浮按钮 |
| **Pagefind** | 1.5.x | 静态全文搜索 |
| **Tailscale** | — | 公网安全穿透 |

---

## 🌐 访问地址

| 服务 | 地址 |
|------|------|
| **博客主站** | https://mornikar.github.io |
| **Wiki 文档** | https://mornikar.github.io/docs/ |
| **Dify 本地** | http://localhost/v1 |
| **Tailscale 域名** | https://mornikar.tail7ee4f8.ts.net |
| **GitHub 仓库** | https://github.com/mornikar/mornikar.github.io |
| **CI 构建历史** | https://github.com/mornikar/mornikar.github.io/actions |
