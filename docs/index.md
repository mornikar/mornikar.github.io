---
title: 项目总览
---
# LLM Wiki + Hexo 博客 — 项目总览

> 本博客基于 LLM Wiki 知识管理 + Hexo 静态生成 + GitHub Pages 部署

## 系统架构

```
Wiki 编辑 (.wiki/ *.md)
        ↓
  wiki-to-hexo.js（自动转换）
        ↓
Hexo 源文件 (source/_posts/)
        ↓
  hexo generate
        ↓
GitHub Pages (mornikar.github.io)
```

## 核心组件

| 组件 | 说明 |
|------|------|
| **LLM Wiki** | `.wiki/` 目录，MD 格式知识库，支持 WikiLink 语法 |
| **Hexo** | 静态博客生成器，Arknights 主题 |
| **Dify** | 本地 RAG 知识库 + AI 对话 |
| **WikiChat** | 网站侧边栏 AI 对话悬浮按钮 |
| **Pagefind** | 静态全文搜索 |

## 文档导航

- [系统架构详解](/docs/PROJECT/)
- [维护指南](/docs/MAINTENANCE/)
- [故障排查](/docs/TROUBLESHOOTING/)
- [迁移规范](/docs/MIGRATION/)
- [Wiki Schema 规范](/wiki/index.html)

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/mornikar/mornikar.github.io.git
cd mornikar.github.io/Hexo

# 本地预览
npm install
wiki-sync.bat

# 访问 http://localhost:4000
```
