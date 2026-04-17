# LLM Wiki Schema — Mornikar's Blog

> 基于 Karpathy's LLM Wiki 模式，v3.0

## 目录结构

```
.wiki/
├── SCHEMA.md          # 本文件 — 规范定义
├── index.md           # 索引 — 所有页面的总览
├── log.md             # 操作日志 — append-only
├── raw/               # Layer 1：不可变原始材料（不发布）
│   ├── articles/     #   网络文章
│   ├── papers/        #   学术论文
│   └── transcripts/  #   会议记录 / 访谈
├── concepts/          # Layer 2：技术概念 → LearningNote
├── entities/          # Layer 2：实体随笔 → LearningEssays
├── comparisons/       # Layer 2：对比分析 → LearningNote
└── queries/           # Layer 2：查询结果 → LearningNote
```

## 分类映射

| Wiki 目录 | Hexo 分类 | 说明 |
|-----------|-----------|------|
| `concepts/` | LearningNote | 技术概念、学习笔记 |
| `entities/` | LearningEssays | 项目随笔、个人思考 |
| `comparisons/` | LearningNote | 对比分析 |
| `queries/` | LearningNote | 查询结果 |
| `raw/` | （不发布） | 原始资料存档 |

## Frontmatter 规范（必须）

```yaml
---
title: 页面标题                    # 必填，Hexo 文章标题
type: concepts                     # 必填，固定为目录名
tags: [AI, LLM, 学习]              # 必填，来自下方标签体系
created: YYYY-MM-DD               # 必填，首次创建日期
updated: YYYY-MM-DD               # 必填，最后更新日期
aliases: [别名1, 别名2]            # 可选，别名列表
related: [相关页面1, 相关页面2]     # 可选，相关文章
summary: 一句话描述                 # 可选，用于 index 和 meta
---
```

## 标签体系

| 标签 | 说明 |
|------|------|
| AI | 人工智能总览 |
| LLM | 大语言模型 |
| RAG | 检索增强生成 |
| Prompt | Prompt 工程 |
| Agent | AI Agent |
| 机器学习 | ML/DL 相关 |
| 产品 | AI 产品经理相关 |
| 开发 | 编程技术 |
| 学习 | 学习方法和心得 |
| wiki | （自动添加）来自 LLM Wiki |

**注意：** 新增标签需先更新本文件，禁止自由添加未列在此处的标签。

## WikiLink 规范

使用 `[[双括号]]` 链接到同 Wiki 的其他页面：

```markdown
# 直接链接
[[RAG检索增强生成]]     →  自动转换为博客内链

# 带显示文字
[[RAG检索增强生成|更简洁的理解]]  →  显示为"更简洁的理解"

# 外部链接（不转换）
[普通 Markdown 链接](https://example.com)
```

脚本会自动将 `[[X]]` 转换为 Hexo 内链，指向对应的博客文章页面。

## 写作规范

1. **先 orient，再操作** — 每次会话先读 SCHEMA + index.md + log.md
2. **frontmatter 必填** — 每个 .md 文件必须有完整 frontmatter
3. **孤立页面禁止** — 每页必须至少链接 2 个其他页面
4. **内容简洁** — 单页控制在 200 行内，超过则拆分
5. **更新 updated** — 修改内容后同步更新 frontmatter 的 updated 字段
6. **raw/ 不可修改** — 原始资料保持不变，修正放 wiki 页面
7. **冲突处理** — 脚本检测到冲突时自动生成 `.conflict.backup.md`

## 同步流程

```
Wiki 编辑（.wiki/ 目录下的 .md 文件）
        ↓
  wiki-to-hexo.js（增量检测）
        ↓
  source/_posts/（Hexo Markdown）
        ↓
  hexo generate
        ↓
  hexo deploy → GitHub Pages
```

## 脚本用法

```bash
# 普通转换（增量，跳过未变更文件）
node scripts/wiki-to-hexo.js

# 强制全量转换
node scripts/wiki-to-hexo.js --force

# 预览模式（不写入文件）
node scripts/wiki-to-hexo.js --dry-run
```

## Dify 知识库同步

Wiki 内容同时同步到 Dify 知识库，支持 AI 对话功能：

```bash
# 同步 Wiki 到 Dify 知识库
node tools/sync-wiki-to-dify.js

# 仅预览（不实际修改）
node tools/sync-wiki-to-dify.js --dry-run
```

**配置**（`tools/sync-wiki-to-dify.js` 顶部）：

| 配置项 | 说明 |
|--------|------|
| `apiBase` | Dify API 地址，默认 `http://localhost/v1` |
| `datasetApiKey` | Dataset API Key（Settings → API Keys → Dataset API） |
| `datasetId` | 知识库 ID（从 Dify URL 获取） |
| `syncDirs` | 同步的子目录列表 |

同步策略：**全量替换** — 每次同步先删除远程所有文档，再上传本地全部文件。

## 一键同步脚本

```bash
wiki-sync.bat        # 完整流程：转换 → 构建 → 部署
wiki-sync.bat --dry-run   # 仅预览，不写入
wiki-sync.bat --force     # 强制全量
```
