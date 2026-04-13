---
title: Hexo博客升级记录
type: entities
tags: [Hexo, 博客, 开发]
created: 2025-09-12
updated: 2025-09-12
---

# Hexo博客升级记录

## 升级背景

将博客从传统存档方式改造为 LLM Wiki 模式管理。

## 主要改动

### 1. 添加 Wiki 管理
- 建立 `.wiki/` 目录
- 使用 `wiki-to-hexo.js` 脚本转换

### 2. 添加搜索功能
- 集成 Pagefind 静态搜索
- 支持中文分词

### 3. 自动化部署
- 配置 GitHub Actions
- push 到 main 分支自动构建

## 技术栈

- Hexo 7.3.0
- Arknights 主题
- Pagefind 搜索
- GitHub Actions

## 相关概念

- [[AI模型优化训练方向]] - AI 相关的笔记
- [[RAG检索增强生成]] - RAG 相关笔记
