# LLM Wiki Schema for Dr.GT_Mornikar Blog

## 目录结构

```
wiki/
├── SCHEMA.md          # 本文件 - 规范定义
├── index.md           # 索引 - 所有页面的总览
├── log.md             # 操作日志
├── raw/               # Layer 1: 原始资料
│   ├── articles/     # 网络文章
│   ├── papers/       # 学术论文
│   └── transcripts/  # 会议记录/访谈
├── concepts/          # Layer 2: 概念笔记 → LearningNote
├── entities/          # Layer 2: 实体随笔 → LearningEssays
├── comparisons/       # Layer 2: 对比分析
└── queries/          # Layer 2: 查询结果
```

## 分类映射

| Wiki 目录 | Hexo 分类 | 说明 |
|-----------|-----------|------|
| concepts/ | LearningNote | 技术概念、学习笔记 |
| entities/ | LearningEssays | 项目随笔、个人思考 |
| raw/ | (不发布) | 原始资料存档 |

## Frontmatter 规范

每个 Wiki 页面必须包含：

```yaml
---
title: 页面标题
type: concepts|entities|comparisons|queries
tags: [标签1, 标签2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

内容...
```

## 标签体系

- AI: 人工智能相关
- LLM: 大语言模型
- RAG: 检索增强生成
- Prompt: Prompt工程
- 机器学习: ML/DL相关
- 产品: AI产品经理相关
- 开发: 编程技术
- 学习: 学习方法和心得

## 命名规范

- 文件名：`中文标题.md`
- 转换脚本会自动添加日期前缀
- 标题使用中文，简洁明了

## 写作指南

1. 每个页面应该有清晰的标题和简介
2. 使用 [[双括号]] 链接到其他 Wiki 页面
3. 重要概念添加相关标签
4. 保持内容简洁，每页聚焦一个主题
