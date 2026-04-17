---
title: 系统架构
---
# 系统架构

## 目录结构

```
mornikar.github.io/
├── .wiki/                      # LLM Wiki 源文件（编辑入口）
│   ├── SCHEMA.md               # Wiki 规范定义
│   ├── index.md                # 索引总览
│   ├── log.md                  # 操作日志
│   ├── concepts/               # 技术概念笔记 → LearningNote
│   ├── entities/               # 实体随笔 → LearningEssays
│   ├── comparisons/            # 对比分析 → LearningNote
│   ├── queries/                # 查询结果 → LearningNote
│   └── raw/                    # 原始材料（不发布）
│
├── source/                     # Hexo 源文件
│   ├── _posts/                 # 博客文章（由 wiki-to-hexo.js 生成）
│   │   ├── LearningNote/
│   │   └── LearningEssays/
│   └── docs/                   # 项目文档（直接部署）
│
├── themes/arknights/           # Arknights 主题
│   ├── layout/                 # Pug 模板
│   └── source/                 # 静态资源
│
└── scripts/
    └── wiki-to-hexo.js         # Wiki → Hexo 转换脚本
```

## Git 分支策略

| 分支 | 用途 |
|------|------|
| `source` | Hexo 源文件，CI 部署源 |
| `gh-pages` | CI 自动生成，GitHub Pages 实际托管 |

## 部署流程

```
push to source
       ↓
GitHub Actions
       ↓
wiki-to-hexo.js 转换 Wiki → Hexo posts
       ↓
hexo generate 生成静态文件
       ↓
actions-gh-pages 推送到 gh-pages
       ↓
GitHub Pages 自动发布
```

## Dify RAG 集成

- Dify 运行在 Docker Desktop（localhost:80）
- 知识库 ID：`29362489-8750-4915-8cf6-05198f234721`
- API Key：`dataset-qfr0cZc2dnjftg5tVTraWRWf`
- Wiki 内容通过 `tools/sync-wiki-to-dify.js` 同步到 Dify

## WikiChat 侧边栏

- AI 对话悬浮按钮（🔵），右下角固定
- 调用 Dify API（聊天机器人应用 `mornikar`）
- Tailscale 公网穿透，手机可访问
