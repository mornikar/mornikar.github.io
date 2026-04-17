---
title: 维护指南
---
# 维护指南

## 日常使用流程

### 1. 编辑 Wiki 文章

在 `.wiki/` 目录下编辑或新建 `.md` 文件：

```markdown
---
title: 我的新笔记
type: concepts
tags: [AI, 学习]
created: 2026-04-17
updated: 2026-04-17
summary: 简短描述
---

正文内容，使用 [[WikiLink]] 语法链接其他页面。
```

### 2. 一键同步部署

```powershell
wiki-sync.bat
```

自动执行：清理 → Wiki 转换 → Hexo 生成 → Pagefind → Git 提交 → 推送

### 3. 仅预览不部署

```powershell
wiki-sync.bat --dry-run
```

## Dify 知识库管理

### 同步 Wiki 到 Dify

```bash
node tools/sync-wiki-to-dify.js
```

### 手动同步到 Dify

1. 打开 Dify（http://localhost/v1）
2. 进入知识库 `mmo的知识库`
3. 手动上传或重新同步

## Pagefind 搜索索引

CI 中自动构建，无需手动操作。本地构建：

```bash
npm install --save-dev pagefind
npx pagefind --site public --output-path public/pagefind
```

## GitHub Pages 部署状态

- CI 触发条件：push 到 `source` 分支
- 部署目标：`gh-pages` 分支
- 网站地址：https://mornikar.github.io

手动触发 CI：在 GitHub Actions 页面点击 "Wiki-Hexo 自动部署" → Run workflow
