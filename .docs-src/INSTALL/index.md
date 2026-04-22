---
title: 安装部署指南
description: 从零开始，将本博客系统部署到自己的 GitHub Pages，包含完整的环境配置、CI 部署与内容管理流程。
---

# 安装部署指南

> 本系统是一套基于 **Wiki 知识管理** + **Hexo 静态生成** + **GitHub Pages 托管** 的个人技术博客模板。支持 WikiLink 双向链接、AI 对话侧边栏（可选）、静态全文搜索（Pagefind）。所有内容编辑在本地完成后，推送到 GitHub，CI 自动构建并发布。

[[toc]]

---

## 系统概览

```
┌────────────────┐    push     ┌──────────────────────────┐    deploy     ┌─────────────────┐
│  .wiki/        │ ─────────→  │  GitHub Actions CI       │ ──────────→  │ GitHub Pages    │
│  (源文件)       │             │  wiki-to-hexo.js         │               │ (你的博客)       │
│                │             │  hexo generate            │               │                 │
└────────────────┘             │  Pagefind index           │               └─────────────────┘
                              │  deploy → main 分支       │
                              └────────────────────────────┘
```

**你的工作流**：编辑 `.wiki/` 下的 md 文件 → push → 等待 2~3 分钟 → 博客自动更新

---

## 前置要求

| 工具 | 版本要求 | 用途 |
|------|---------|------|
| Git | ≥ 2.30 | 代码版本管理 |
| Node.js | ≥ 18.x | Hexo 运行 + npm 依赖 |
| GitHub 账号 | — | 托管仓库 + GitHub Pages |

> **注意**：你不需要购买服务器或域名。GitHub Pages 提供免费的静态站点托管。

---

## 第一步：创建你自己的仓库

### 方式 A：Fork（推荐新手）

1. 点击本仓库右上角 **Fork**
2. 仓库名改为 `你的用户名.github.io`（例如 `johndoe.github.io`）
3. 等待 Fork 完成

### 方式 B：从模板创建

1. 点击本仓库右上角 **Use this template**
2. 选择 **Create a new repository**
3. 仓库名设为 `你的用户名.github.io`

### 方式 C：克隆到本地后改远程

```bash
# 克隆本仓库
git clone https://github.com/mornikar/mornikar.github.io.git
cd mornikar.github.io

# 查看当前远程
git remote -v

# 替换为你的仓库
git remote set-url origin https://github.com/你的用户名/你的用户名.github.io.git
```

---

## 第二步：修改博客配置

克隆到本地后，修改 `Hexo/_config.yml` 中的个人信息：

```yaml
# Site（站点基本信息）
title: 你的博客名称
subtitle: 你的博客副标题
description: 你的博客描述
author: 你的名字
language: zh-CN        # 中文博客用 zh-CN，英文用 en
timezone: Asia/Shanghai  # 你的时区

# URL（重要！改成你的地址）
url: https://你的用户名.github.io
```

### 其他可按需调整的配置

```yaml
# 永久链接格式（文章 URL 结构）
permalink: :year/:month/:day/:title/

# 每页文章数量
per_page: 10

# 开启多说/Gitalk 等评论（可选）
# comments:
#   service: gitalk
#   gitalk:
#     clientID: 你的ClientID
#     clientSecret: 你的ClientSecret
#     repo: 你的用户名.github.io
#     owner: 你的GitHub用户名
```

---

## 第三步：启用 GitHub Pages

1. 进入你的仓库 → **Settings** → **Pages**
2. **Source** 选择：`Deploy from a branch`
3. **Branch** 选择：`main` / `/ (root)`
4. 点击 **Save**

> 等待 2~3 分钟，访问 `https://你的用户名.github.io` 即可看到初始博客。

---

## 第四步：启用 CI 自动部署

CI（GitHub Actions）已经配置好，会在每次你 push 到 `source` 分支时自动：
1. 转换 `.wiki/` 内容为 Hexo 格式
2. 生成静态 HTML 文件
3. 部署到 GitHub Pages

**你需要做的**：把内容 push 到 `source` 分支（而非 `main`）：

```bash
cd Hexo

# 编辑内容后...
git add .
git commit -m "更新文章"
git push origin source
```

> `source` 是开发分支，`main` 是 GitHub Pages 的发布目标，两者自动同步。不要直接 push 到 `main`。

---

## 第五步：理解内容管理流程

### 目录结构

```
Hexo/
├── .wiki/              # ⭐ 编辑入口，所有文章放在这里
│   ├── concepts/       #   → 生成到博客「LearningNote」分类
│   ├── entities/       #   → 生成到博客「LearningEssays」分类
│   ├── comparisons/    #   → 生成到博客「LearningNote」分类
│   ├── queries/        #   → 生成到博客「LearningNote」分类
│   └── raw/           #   存档，不发布
│
├── source/             # Hexo 源文件（自动生成，无需手动编辑）
│   └── _posts/        #   wiki-to-hexo.js 的输出目录
│
├── scripts/            # 自动化脚本
│   └── wiki-to-hexo.js  # Wiki → Hexo 转换器
│
└── themes/             # 主题文件（可按需修改样式）
```

### 写文章

在 `.wiki/` 对应目录下新建 `.md` 文件，格式如下：

```markdown
---
title: 我的第一篇文章
type: concepts           # concepts | entities | comparisons | queries
tags: [学习, 笔记]
created: 2026-04-18
updated: 2026-04-18
summary: 文章简介，会显示在列表页
---

这是文章正文。使用 [[WikiLink]] 语法可以链接其他文章。

## 标题

内容...
```

### frontmatter 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `type` | ✅ | 内容类型，决定发布到哪个分类 |
| `tags` | ❌ | 标签数组 |
| `created` | ✅ | 创建日期，格式 `YYYY-MM-DD` |
| `updated` | ❌ | 更新日期 |
| `summary` | ❌ | 文章简介 |

### 分类映射规则

| `.wiki/` 目录 | 博客分类 |
|-------------|---------|
| `concepts/` | LearningNote |
| `comparisons/` | LearningNote |
| `queries/` | LearningNote |
| `entities/` | LearningEssays |
| `raw/` | 不发布 |

### 本地预览

```bash
cd Hexo
npm install          # 首次运行需要安装依赖
wiki-sync.bat        # 一键同步 wiki → hexo → 生成静态文件
```

然后访问 http://localhost:4000 预览，确认无误后再 push。

---

## 第六步：自定义主题样式（可选）

### 修改颜色主题

编辑 `themes/arknights/source/css/_core/color/` 下的样式文件：

```stylus
// 例子：修改主色调
$theme-color = #your-color
```

### 修改背景图片

替换以下文件：
- `themes/arknights/source/img/bg.jpg` — 首页大背景
- `themes/arknights/source/img/pc-bg.jpg` — 宽屏背景

### 修改侧边栏信息

编辑 `source/about/index.md` 可修改「关于」页面内容。

---

## 第七步：高级功能

### 开启 AI 对话侧边栏（可选）

本系统支持在博客右下角嵌入 AI 对话功能，需要配合 Dify 使用：

1. 部署 Dify（参考 [Dify 官方文档](https://docs.dify.ai/)）
2. 在 Dify 中创建知识库应用
3. 获取 API Key 并填入主题配置

> 这一步是可选的。没有配置 AI 对话的情况下，博客所有功能均正常工作。

### 开启 Pagefind 全文搜索

Pagefind 已在 CI 中自动配置，会在每次构建时自动生成搜索索引。博客上线后可访问 `/pagefind/` 使用全文搜索。

---

## 常见问题

### Q: push 后博客没有更新？
1. 进入仓库 → **Actions** → 检查 CI 运行状态
2. 查看 CI 日志是否有错误
3. 确认 push 的是 `source` 分支

### Q: 本地 `wiki-sync.bat` 报错？
1. 确认已运行 `npm install`
2. 确认 Node.js 版本 ≥ 18.x
3. 查看报错信息，对照 [故障排查文档](/docs/TROUBLESHOOTING/)

### Q: 如何修改博客域名？
1. 在 `_config.yml` 中修改 `url` 为你的域名
2. 在 GitHub Pages 设置中添加自定义域名
3. 在 `source/CNAME` 文件中添加你的域名（可选）

---

## 目录导航

- [项目总览](/docs/PROJECT/) — 系统架构与组件关系
- [维护指南](/docs/MAINTENANCE/) — 日常使用与运维
- [Wiki 格式规范](/docs/MIGRATION/) — frontmatter / WikiLink 语法
- [故障排查](/docs/TROUBLESHOOTING/) — 常见问题与解决
