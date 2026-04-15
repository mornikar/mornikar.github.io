# Phase 4: 内容迁移指南

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
tags: [标签1, 标签2]
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
| tags | 标签数组 | `[AI, LLM, 训练]` |
| aliases | 别名（可选） | `[AI模型, 模型优化]` |
| wikiTags | 额外标签（追加到 tags） | `extra-tag` |
| wikiCategory | 覆盖分类（可选） | `LearningEssays` |
| summary | 文章摘要（可选） | `关于 AI 模型优化...` |

### 3. WikiLink 语法

```markdown
[[文章标题]]           # 精确链接
[[文章标题|显示文字]]  # 带别名显示
```

### 4. 自动同步

运行同步脚本：

```bash
node scripts/wiki-to-hexo.js
hexo generate
```

## 分类规则

| 类型 | 说明 | 映射到 |
|------|------|--------|
| concepts | 跨域概念、知识原理 | LearningNote |
| entities | 实体随笔、项目记录 | LearningEssays |
| comparisons | 对比分析 | LearningNote |
| queries | Q&A | LearningNote |

## 注意事项

1. **日期格式**：必须使用 `YYYY-MM-DD`，不能用 `YYYY/MM/DD`
2. **WikiLink 匹配**：按 精确→大小写→前缀 的顺序匹配
3. **冲突检测**：同名文件会产生警告
4. **单元测试**：`node scripts/wiki-to-hexo.js --test`
