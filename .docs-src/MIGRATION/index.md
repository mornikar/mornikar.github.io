---
title: 迁移规范
---
# 📋 迁移规范

> 本文档定义 Wiki 格式标准、WikiLink 语法和 frontmatter 规范，是 Wiki 贡献者的核心参考手册。

> 旧 Hexo 已迁移到 `/Mornikar/` 子路径；相关部署、CMS、Pagefind 和资产路径说明见 [Hexo 迁移到 /Mornikar/ 路径说明](/Mornikar/docs/MIGRATION/HEXO_MORNIKAR_PATH.html)。

---

## 一、frontmatter 完整参考

### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `title` | string | 页面标题（显示在文章顶部） | `title: RAG检索增强生成` |
| `type` | string | 固定为所在目录名 | `type: concepts` |
| `tags` | array | 标签列表，至少 1 个 | `tags: [AI, LLM, RAG]` |
| `created` | string | 首次创建日期（ISO 格式） | `created: 2025-09-12` |
| `updated` | string | 最后更新日期（ISO 格式） | `updated: 2025-09-12` |

### 可选字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `summary` | string | 一句话摘要（用于列表展示） | `summary: RAG 结合检索与生成` |
| `aliases` | array | 别名列表（搜索引擎优化） | `aliases: [Retrieval-Augmented]` |
| `related` | array | 关联页面（会在文末显示） | `related: [[Embedding模型]]` |
| `pin` | boolean | 是否置顶（部分主题支持） | `pin: true` |

### 完整 frontmatter 示例

```yaml
---
title: RAG检索增强生成
type: concepts
tags: [AI, LLM, RAG, 向量检索]
created: 2025-09-12
updated: 2026-04-17
summary: RAG 结合信息检索与大语言模型，提升回答准确性
aliases: [Retrieval-Augmented Generation, 检索增强生成]
related: [[向量数据库], [Embedding模型], [大语言模型]]
pin: false
---
```

> ⚠️ **日期格式必须是 `YYYY-MM-DD`**（ISO 8601），不能写成 `YYYY/MM/DD`。斜杠格式会导致 Hexo generate 生成 0 篇文章！

---

## 二、WikiLink 语法

### 基础语法

| 语法 | 示例 | 说明 |
|------|------|------|
| 直接链接 | `[[RAG检索增强生成]]` | 链接到同名页面 |
| 带显示文字 | `[[RAG检索增强生成\|点击这里]]` | 显示自定义文本 |
| 带锚点 | `[[Embedding模型#模型选择]]` | 链接到页面内特定章节 |
| 外部链接 | `[百度](https://baidu.com)` | 普通 Markdown 链接（不转换） |

### WikiLink 匹配优先级

当链接目标不存在时，脚本按以下顺序尝试匹配：

| 优先级 | 策略 | 示例 |
|--------|------|------|
| 1 | 精确匹配 | `[[RAG]]` → `RAG.md` |
| 2 | 大小写不敏感 | `[[rag]]` → `RAG.md` |
| 3 | 前缀模糊匹配 | `[[向量数据]]` → `向量数据库.md` |
| 4 | 路径降级 | `[[AI/RAG]]` → 搜索 `RAG.md` |

### WikiLink → Hexo URL 转换规则

```
输入：[[RAG检索增强生成]]
输出：/2025/09/12/RAG检索增强生成/

输入：[[大语言模型|LLM]]
输出：/2025/10/01/大语言模型/
```

---

## 三、目录分类映射

| Wiki 目录 | Hexo 分类 | 发布状态 | 典型内容 |
|-----------|-----------|----------|----------|
| `concepts/` | LearningNote | ✅ 发布 | 技术概念、术语解释、原理分析 |
| `entities/` | LearningEssays | ✅ 发布 | 实体随笔、项目记录、读书笔记 |
| `comparisons/` | LearningNote | ✅ 发布 | 技术对比、产品评测、方案选型 |
| `queries/` | LearningNote | ✅ 发布 | 查询结果、数据报告、实验记录 |
| `raw/` | （不发布） | ❌ 私有 | 原始材料、剪藏内容、内部笔记 |

> 📌 **选择目录建议**：不确定放哪个目录时，优先选择 `concepts/`（技术概念）。

---

## 四、写作规则

### 必须遵守

| 规则 | 说明 | 违反后果 |
|------|------|----------|
| frontmatter 必填 | 每个 `.md` 必须有完整必填字段 | 文章无法生成 |
| 日期格式正确 | `YYYY-MM-DD`，不能用斜杠 | 文章无法生成 |
| 至少 2 个外链 | 每篇文章至少链接其他 2 个页面 | 被标记为孤立页面 |
| 更新 updated | 修改内容后同步更新 | 版本记录不准确 |

### 推荐做法

| 做法 | 说明 |
|------|------|
| 内容简洁 | 单页控制在 200 行内，超过则拆分 |
| 先 orient | 每次编辑先读 `SCHEMA.md + index.md + log.md` |
| 使用摘要 | 超过 3 段的内容添加 `summary` 字段 |
| 标签规范 | 标签尽量复用已有标签（可在 index.md 查看） |

### 标签命名规范

| ✅ 推荐 | ❌ 避免 |
|--------|--------|
| `AI` `LLM` `RAG` | `人工智能`（混用） |
| `Linux` `Docker` | `linux` `docker`（大小写混乱） |
| `笔记` `教程` `踩坑` | `我的笔记` `教程1`（过于具体） |

---

## 五、新建 Wiki 文章流程

### Step 1：确定目录和文件名

根据内容类型选择目录：

```
concepts/   → 技术概念
entities/   → 实体随笔
comparisons/ → 对比分析
queries/    → 查询结果
raw/        → 私有存档
```

文件名应简洁、描述性强，使用中文：
- ✅ `向量数据库.md`
- ✅ `RAG检索增强生成.md`
- ❌ `Note_001.md`
- ❌ `Untitled.md`

### Step 2：创建文件并填写 frontmatter

```markdown
---
title: 向量数据库
type: concepts
tags: [数据库, AI, 向量检索]
created: 2026-04-17
updated: 2026-04-17
summary: 用于存储和检索向量 embedding 的专用数据库
---
```

### Step 3：编写正文

```markdown
## 简介

向量数据库是专为存储和检索 [[向量嵌入]]（Vector Embedding）设计的数据库...

## 主流产品

| 产品 | 特点 | 适用场景 |
|------|------|----------|
| [[Weaviate]] | 开源、GraphQL API | RAG、知识图谱 |
| [[Milvus]] | 国产、高性能 | 大规模检索 |
| [[Pinecone]] | 云原生、易用 | 快速上线 |

## 相关技术

- [[Embedding模型]]
- [[向量检索算法]]
- [[RAG检索增强生成]]
```

### Step 4：部署

```powershell
wiki-sync.bat
# 推送到 GitHub
git add .
git commit -m "feat: 新增向量数据库笔记"
git push origin source
```

---

## 六、Wiki → Hexo 转换逻辑

### 脚本功能（wiki-to-hexo.js v4.2）

| 功能 | 说明 |
|------|------|
| WikiLink 转换 | `[[X]]` → 读取 wiki-index.json 的 url 字段 |
| frontmatter 转换 | Wiki 格式 → Hexo 格式（添加 `date`、`layout` 等） |
| 分类映射 | Wiki 目录 → Hexo categories |
| 标签保留 | `tags` 字段原样保留 |
| 摘要提取 | `summary` → Hexo `excerpt` |
| 增量同步 | 仅处理 changed/new 文件 |
| 冲突检测 | 检测同名文件并提示 |
| 日志维护 | 更新 `log.md` 和 `index.md` |
| URL 卫生 | parseFrontmatter 去引号 + slugify 全自动清洗 |
| Force 清理 | `--force` 自动删除含双横线的旧文件 |
| 数据质量 | `--test` 检查 URL 异常和重复 |

### URL 生成规范（v4.2）

**核心原则**：URL 只由 `wiki-to-hexo.js` 的 `slugify()` 生成，所有其他组件（wiki-chat.js、CMS 等）都读取 `wiki-index.json` 的 `url` 字段。

#### slugify 清洗规则

按顺序执行：

1. **去 YAML 值引号**：`"标题"` → `标题`（parseFrontmatter 阶段）
2. **特殊字符替换**：`_` → `-`、`+` → `-`、`#` → 删除
3. **非安全字符删除**：只保留字母、数字、中文、`-`
4. **合并连续横线**：`A--B---C` → `A-B-C`
5. **去首尾横线**：`-标题-` → `标题`

#### URL 格式

```
/ :year / :month / :day / :category / :hexoDate-:safeTitle /

示例：
  源文件：.wiki/concepts/LLMWiki_VS_RAG调研.md（created: 2026-04-18）
  Hexo文件：source/_posts/LearningNote/2026-04-18-LLMWiki-VS-RAG调研.md
  最终 URL：/2026/04/18/LearningNote/2026-04-18-LLMWiki-VS-RAG调研/

错误 URL（v4.2 已修复）：
  /2026/04/18/LearningNote/2026-04-18--LLMWiki\_VS\_RAG调研-/  ← 双横线 + \_转义 + 尾横线
```

#### WikiLink URL 来源

| 版本 | 来源 | 问题 |
|------|------|------|
| v4.0-v4.1 | wiki-chat.js 客户端 slugify(title) | 和服务端 slugify 不一致 |
| **v4.2** | **wiki-index.json 的 url 字段** | **单一数据源，一致性保证** |

### 输出文件格式

```markdown
---
title: RAG检索增强生成
date: 2025-09-12 12:00:00          # ← 自动添加
layout: post                       # ← 自动添加
tags: [AI, LLM, RAG]
categories: LearningNote            # ← 由目录映射
---

正文内容（WikiLink 已转换为 URL）
```

---

## 七、常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 文章无法生成 | `date: 2025/09/12` 格式错误 | 改为 `date: 2025-09-12` |
| frontmatter 报错 | 缺少必填字段 | 检查 title/type/tags/created/updated |
| WikiLink 404 | 目标页面不存在 | 确认目标文件名完全匹配 |
| 分类不对 | `type` 与目录名不一致 | `type` 必须等于所在目录名 |
| 文章重复 | 手动创建了同名文件 | 删除 `source/_posts/` 中的文件，由脚本管理 |
| URL 含双横线 | slugify 旧版本未清洗 | 运行 `node scripts/wiki-to-hexo.js --force` 自动清理 |
| URL 含 `\_` 转义 | title 中有下划线 | v4.2 的 slugify 自动将 `_` 转 `-`，重新 generate 即可 |
| WikiLink 跳转 404 | 客户端 slugify 和服务端不一致 | v4.2 已改用 wiki-index.json 的 url 字段，清浏览器缓存 |

---

## 八、CMS 管理面板（v4.2 新增）

### 访问

`https://mornikar.github.io/Mornikar/admin/`（GitHub OAuth 登录）

### 集合分类

**Posts 集合**（自动包装 Hexo frontmatter）：
- AIGC 笔记随笔、学习随笔、学习笔记、机器学习、云环境、所有文章

**Wiki 集合**（原样保存，不包装 frontmatter）：
- 📚 Wiki 概念、✍️ Wiki 随笔、📥 素材（文章/ML/PM）、🔍 审计反馈

### 新建文件规则

| 类型 | 文件名格式 | frontmatter |
|------|-----------|-------------|
| Posts | `YYYY-MM-DD-标题.md` | 自动生成 Hexo 格式 |
| Wiki | `标题.md`（无日期前缀） | 需手动填写 wiki 格式 |

### 保存行为

- **Posts 文件**：保存时自动包装 `title/date/category/tags` frontmatter
- **Wiki 文件**：原样保存内容，不额外包装 frontmatter（wiki 文件已有自己的 `title/tags/created/updated` 格式）
