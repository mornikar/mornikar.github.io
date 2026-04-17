---
title: 内容迁移指南
date: 2026-04-17 11:00:00
type: docs
---

# 内容迁移指南

## 概述

将现有的 LearningNote/LearningEssays 内容迁移到 LLM Wiki 格式。

## Wiki 目录结构

```
.wiki/
├── concepts/      # 跨域概念（如 AI模型、RAG原理）
├── entities/      # 实体随笔（如项目记录、工具评测）
├── comparisons/   # 对比分析（如 A vs B）
├── queries/       # 问题与解答
├── raw/          # 原始资料（不可变）
├── index.md      # 索引页面
├── log.md        # 变更日志
└── SCHEMA.md     # Wiki 模式规范
```

## 添加新文章

### 1. 创建 Wiki 文件

在对应的目录下创建 `.md` 文件：

```markdown
---
title: 文章标题
created: 2026-04-16
updated: 2026-04-16
tags: [标签1, 标签2]
aliases: [别名1, 别名2]
related: [相关页面1]
summary: 一句话描述
---

# 文章标题

正文内容...

## 参考资料

- [[相关概念]] - 相关链接
```

### 2. Frontmatter 字段

| 字段 | 说明 | 示例 |
|------|------|------|
| title | 文章标题 | `AI模型优化训练方向` |
| created | 创建日期（YYYY-MM-DD） | `2025-09-12` |
| updated | 更新日期（YYYY-MM-DD） | `2026-04-17` |
| tags | 标签数组 | `[AI, LLM, 训练]` |
| aliases | 别名（可选） | `[AI模型, 模型优化]` |
| related | 相关页面（可选） | `[相关页面1]` |
| summary | 文章摘要（可选） | `关于 AI 模型优化...` |

### 3. WikiLink 语法

```markdown
[[文章标题]]           # 精确链接
[[文章标题|显示文字]]  # 带别名显示
```

### 4. 运行同步

```bash
wiki-sync.bat
```

## 分类规则

| 类型 | 说明 | 映射到 |
|------|------|--------|
| concepts | 跨域概念、知识原理 | LearningNote |
| entities | 实体随笔、项目记录 | LearningEssays |
| comparisons | 对比分析 | LearningNote |
| queries | Q&A | LearningNote |

## 添加到 Dify 知识库

所有 `.wiki/concepts/`、`entities/`、`comparisons/`、`queries/` 下的 .md 文件会自动同步到 Dify 知识库，供 AI 对话使用。

## 注意事项

1. **日期格式**：必须使用 `YYYY-MM-DD`，不能用 `YYYY/MM/DD`
2. **WikiLink 匹配**：按 精确→大小写→前缀 的顺序匹配
3. **冲突检测**：同名文件会产生警告
4. **单元测试**：`node scripts/wiki-to-hexo.js --test`
5. **更新必填**：修改内容后必须更新 `updated` 字段

## 迁移后的 CI 自动部署

推送 `.wiki/` 文件到 GitHub `source` 分支后，CI 自动：
1. 同步到 Dify 知识库
2. 转换到 Hexo
3. 生成静态文件
4. 编译 CSS
5. 构建 Pagefind 搜索
6. 部署到 GitHub Pages
