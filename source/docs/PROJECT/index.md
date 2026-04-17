---
title: 项目总览
date: 2026-04-17 11:00:00
type: docs
---

# LLM Wiki + Hexo 项目总览

> **Mornikar's Blog** — AI + 开发者知识库 + Arknights 主题博客
> GitHub: [mornikar.github.io](https://github.com/mornikar/mornikar.github.io)

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                       本地开发环境                               │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐ │
│  │  .wiki/    │────▶│ wiki-to-    │────▶│ source/_posts/   │ │
│  │  (源文件)   │     │ hexo.js     │     │ LearningNote/     │ │
│  │  concepts/ │     │             │     │ LearningEssays/  │ │
│  │  entities/ │     │ v4.0        │     │                  │ │
│  │  queries/  │     │ 增量检测     │     │ (Hexo Markdown)  │ │
│  └─────────────┘     └─────────────┘     └────────┬─────────┘ │
│         │                                          │           │
│         │                                          ▼           │
│  ┌─────────────┐                          ┌──────────────┐    │
│  │ sync-wiki-  │                          │ hexo         │    │
│  │ to-dify.js  │─────────────────────────▶ │ generate     │    │
│  │ (Phase 6)   │                          └──────┬───────┘    │
│  └─────────────┘                                 │            │
│         │                                        ▼            │
│         ▼                              ┌──────────────────┐    │
│  ┌─────────────┐                       │   public/        │    │
│  │ Dify        │◀─────────────────────│   CSS (stylus)  │    │
│  │ 知识库       │                       │   Pagefind       │    │
│  │ (本地 Docker)│                       └────────┬─────────┘    │
│  └─────────────┘                                │            │
│         │                                        ▼            │
│         ▼                               ┌──────────────────┐    │
│  ┌─────────────┐                       │ GitHub Pages     │    │
│  │ wiki-chat   │◀──── Tailscale ──────│ (mornikar.       │    │
│  │ .js (AI对话)│                       │  github.io)      │    │
│  └─────────────┘                       └──────────────────┘    │
│                                                                 │
│  ┌─────────────┐                                               │
│  │ LM Studio   │◀── Dify 推理调用                              │
│  │ qwen3.5-9B  │                                               │
│  └─────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心组件

| 组件 | 路径 | 说明 |
|------|------|------|
| **Wiki 源文件** | `.wiki/` | 所有内容的单一数据源 |
| **wiki-to-hexo.js** | `scripts/` | Wiki → Hexo Markdown 转换脚本 |
| **sync-wiki-to-dify.js** | `tools/` | Wiki → Dify 知识库同步脚本 |
| **wiki-sync.bat** | `./` | 本地一键同步脚本 |
| **wiki-chat.js** | `themes/arknights/source/js/` | AI 对话侧边栏 |
| **deploy.yml** | `.github/workflows/` | CI/CD 自动部署 |

---

## 数据流向

```
.wiki/ 源文件 (concepts/ entities/ comparisons/ queries/)
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
  wiki-to-hexo.js               sync-wiki-to-dify.js
        │                              │
        ▼                              ▼
source/_posts/ (Hexo)           Dify 知识库 (本地 Docker)
        │                              │
        ▼                              │
  hexo generate ──────────────▶  wiki-chat.js (AI 对话)
        │
        ├──▶ stylus CSS 编译
        │
        ├──▶ Pagefind 搜索索引
        │
        ▼
   public/ 目录
        │
        ▼
   GitHub Pages (gh-pages 分支)
```

---

## 分支策略

| 分支 | 用途 |
|------|------|
| `source` | Hexo 源文件（.wiki/、scripts/、themes/） |
| `gh-pages` | 静态输出（由 CI 自动推送） |

GitHub Pages 读取 `gh-pages` 分支作为站点内容。

---

## 快速启动

### 本地开发

```powershell
cd D:\Auxiliary_means\Git\mornikar.github.io\Hexo

# 完整同步（Wiki → Dify → Hexo → 构建 → 部署）
wiki-sync.bat

# 仅预览，不写入
wiki-sync.bat --dry-run

# 强制全量转换
wiki-sync.bat --force
```

### CI 自动部署

推送 `.wiki/` 下的任何文件到 `source` 分支，CI 自动：
1. 转换 Wiki → Hexo
2. 生成静态文件
3. 编译 CSS
4. 构建 Pagefind 索引
5. 部署到 GitHub Pages

---

## 检索架构

```
用户输入查询
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
Pagefind                              wiki-chat.js
(关键词检索)                            (语义检索 + AI 对话)
                                        │
                                        ├── Dify (localhost:80)
                                        │       │
                                        │       ├──▶ Weaviate (向量库)
                                        │       │
                                        │       └──▶ LM Studio (qwen3.5-9B)
                                        │               (localhost:1234)
                                        │
                                        └── 手机端: Tailscale 公网访问
```

---

## 相关文档

- [Wiki 格式规范](https://github.com/mornikar/mornikar.github.io/tree/source/.wiki/SCHEMA.md) — GitHub 查看
- [内容迁移指南](/docs/MIGRATION/) — Wiki 格式规范、CI 部署说明
- [长期维护指南](/docs/MAINTENANCE/) — 日常使用流程、Dify 管理

---

## 环境要求

- **Node.js** 16+ (npm)
- **Docker Desktop** (Dify 本地部署)
- **LM Studio** (本地 LLM 推理)
- **Tailscale** (手机公网访问)
