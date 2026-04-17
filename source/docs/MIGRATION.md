---
title: 迁移规范
---
# 迁移规范

## Wiki 格式规范

### frontmatter 必须字段

```yaml
---
title: 页面标题
type: concepts          # 固定为所在目录名
tags: [AI, LLM, 学习]
created: YYYY-MM-DD    # 首次创建日期
updated: YYYY-MM-DD    # 最后更新日期
summary: 一句话描述     # 可选
aliases: [别名]         # 可选
related: [相关页面]     # 可选
---
```

### WikiLink 语法

```markdown
# 直接链接
[[RAG检索增强生成]]  →  /2025/09/12/RAG检索增强生成/

# 带显示文字
[[RAG检索增强生成|更简洁]]  →  显示为"更简洁"

# 外部链接（不转换）
[普通 Markdown 链接](https://example.com)
```

WikiLink 精确匹配失败后，脚本自动尝试：
1. 大小写不敏感匹配
2. 前缀模糊匹配
3. 降级为路径搜索

### 目录分类映射

| Wiki 目录 | Hexo 分类 | 说明 |
|-----------|-----------|------|
| `concepts/` | LearningNote | 技术概念 |
| `entities/` | LearningEssays | 实体随笔 |
| `comparisons/` | LearningNote | 对比分析 |
| `queries/` | LearningNote | 查询结果 |
| `raw/` | （不发布） | 原始存档 |

### 写作规则

1. **frontmatter 必填**：每个 `.md` 必须有完整 frontmatter
2. **孤立页面禁止**：每页至少链接 2 个其他页面
3. **内容简洁**：单页控制在 200 行内，超过则拆分
4. **先 orient**：每次编辑先读 SCHEMA + index.md + log.md
5. **更新 updated**：修改内容后同步更新 frontmatter

## 新建 Wiki 文章流程

1. 在 `.wiki/` 对应目录下创建 `.md` 文件
2. 填写完整 frontmatter
3. 使用 WikiLink 链接相关内容
4. 运行 `wiki-sync.bat` 部署

## Wiki → Hexo 转换逻辑

`scripts/wiki-to-hexo.js` 会：
- 读取 `.wiki/*.md` 和 `.wiki/*/*.md`
- 转换 frontmatter 为 Hexo 格式（添加 date、layout 等）
- 将 WikiLink `[[X]]` 替换为 Hexo 内链
- 写入 `source/_posts/<分类>/<文件名>.md`
- 生成 `.wiki/index/log` 的 Hexo 版本
