# LLM Wiki Schema — Mornikar's Blog

> 基于 Karpathy's LLM Wiki 模式，v3.0

## 目录结构

```
.wiki/
├── SCHEMA.md          # 本文件 — 规范定义
├── index.md           # 索引 — 所有页面的总览
├── log.md             # 操作日志 — append-only
├── audit/             # 审计反馈 — 知识库健康检查结果（v3 新增）
├── raw/               # Layer 1：不可变原始材料（不发布）
│   ├── articles/     #   主题文章（AI行业分析、AI产品方案、AI部署、多模态、随笔）
│   ├── ML/           #   机器学习笔记
│   ├── PM/           #   产品经理资料
│   ├── OS/           #   操作系统 / 云环境
│   ├── skills/       #   技能笔记（flask/git/mysql/python/ubuntu/web）
│   ├── configs/       #   配置文件
│   └── assets/       #   图片等资源
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

## assets/ 目录（PDF 等二进制资源）

```
.wiki/raw/assets/          # 放 PDF、图片等资源（不参与 wiki 层发布）
  └── *.pdf, *.png, ...
```

- **PDF 文件**：放 `raw/assets/`，通过 wiki-to-hexo 自动拷贝到 Hexo `source/assets/`
- **嵌入方式**：复制 `snippets/PDF嵌入Snippet.md` 中的 HTML 模板到文章
- **PDF.js**：已内置到 `themes/arknights/source/lib/pdfjs/`（v4.4.168），无需额外安装
- **文件大小建议**：单个 PDF < 20MB（GitHub 单文件限制 100MB）

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
7. **raw/ frontmatter 必填** — raw/ 目录所有 .md 文件同样需要 title/type/tags/frontmatter
8. **冲突处理** — 脚本检测到冲突时自动生成 `.conflict.backup.md`

## 同步流程

```
Wiki 编辑（.wiki/ 目录下的 .md 文件）
        ↓
  wiki-compile.js（AI 编译 raw/ → concepts/entities/）  ← Phase 1 新增
        ↓
  wiki-to-hexo.js（增量检测）
        ↓
  source/_posts/（Hexo Markdown）
        ↓
  hexo generate
        ↓
  hexo deploy → GitHub Pages
```

## AI 编译流程（Phase 1 新增）

```
raw/ 中的原始素材
        ↓
  AI 读取 + 编译
        ↓
  concepts/ 或 entities/ 中的结构化 wiki 页面
        ↓
  自动生成 frontmatter（title, type, tags, summary）
  自动插入 [[WikiLink]] 交叉引用
        ↓
  wiki-to-hexo.js 正常转换
```

### 编译配置

在 `.wiki/compile-config.json` 中配置 AI 接口：

```json
{
  "apiKey": "your-api-key",
  "endpoint": "https://open.bigmodel.cn/api/paas/v4",
  "model": "glm-4-flash"
}
```

或设置环境变量：`WIKI_COMPILE_API_KEY` / `WIKI_COMPILE_ENDPOINT` / `WIKI_COMPILE_MODEL`

### 编译命令

```bash
# 增量编译（只处理新增/变更的 raw 文件）
node scripts/wiki-compile.js

# 强制全量编译
node scripts/wiki-compile.js --force

# 预览模式
node scripts/wiki-compile.js --dry-run

# 编译指定文件
node scripts/wiki-compile.js --file .wiki/raw/AI_Agent/AI稳定上线工程化.md

# 运行测试
node scripts/wiki-compile.js --test
```

### raw 子目录到 layer 的映射

| raw 子目录 | 编译目标 | 说明 |
|-----------|---------|------|
| `AI_Agent/` | concepts | AI Agent 相关概念 |
| `articles/AI产品方案/` | entities | 产品方案随笔 |
| `articles/AI行业分析/` | concepts | 行业分析概念 |
| `articles/AI部署/` | concepts | 部署技术概念 |
| `articles/多模态/` | concepts | 多模态概念 |
| `articles/随笔/` | entities | 个人随笔 |
| `ML/` | concepts | 机器学习概念 |
| `PM/` | entities | 产品经理随笔 |
| `OS/` | entities | 操作系统随笔 |
| `skills/` | entities | 技能笔记 |
| `snippets/` | entities | 代码片段 |

## Wiki 知识库检索（Phase 2 新增）

### 数据流

```
wiki-compile.js → .wiki/wiki-index.json（开发用）
wiki-to-hexo.js → source/wiki-index.json（前端用，hexo generate 后到 public/）
wiki-chat.js    → fetch('/wiki-index.json') → 本地知识库检索
```

### 索引内容

`wiki-index.json` 包含每个 wiki 页面的：

| 字段 | 说明 |
|------|------|
| `title` | 页面标题 |
| `layer` | 层级（concepts/entities） |
| `tags` | 标签列表 |
| `summary` | 一句话摘要 |
| `created` | 创建日期 |
| `url` | Hexo 文章 URL（仅前端版本） |
| `snippet` | 前 300 字纯文本片段 |

### WikiLink 渲染

AI 回复中的 `[[页面名]]` 会自动渲染为可点击跳转链接：

- `[[RAG检索增强生成]]` → 🔗 `RAG检索增强生成`（带📚图标，链接到对应 Hexo 文章）
- `[[RAG检索增强生成|更简洁的理解]]` → 🔗 `更简洁的理解`（自定义显示文字）

### RAG 检索优先级

1. **Wiki 知识库索引**（wiki-index.json）— 结构化知识，优先匹配
2. **博客全文检索**（search.xml）— 降级兜底
3. **页面上下文**（当前阅读的文章内容）— 辅助补充

## 反向链接 + 知识图谱（Phase 3 新增）

### 数据流

```
wiki-to-hexo.js 扫描 [[WikiLink]] → buildBacklinks() → 反向链接索引
                                                    ↓
                              wiki-index.json (backlinks/outlinks 字段)
                                                    ↓
                              文章底部 ← generateBacklinksHtml()
                              知识图谱 ← wiki-chat.js showGraphView()
```

### 反向链接

每篇 Hexo 文章底部自动注入「反向链接」区块：

```html
<div class="wiki-backlinks">
  <h4 class="wiki-backlinks-title">🔗 反向链接</h4>
  <p class="wiki-backlinks-desc">以下页面引用了本文：</p>
  <ul class="wiki-backlinks-list">
    <li><a href="/2025/09/12/2025-09-12-RAG检索增强生成/">RAG检索增强生成</a></li>
  </ul>
</div>
```

### URL 格式说明

Hexo permalink 配置为 `:year/:month/:day/:title/`，其中 `:title` 来自**文件名**（含日期前缀），
而非 frontmatter 中的 title 字段。因此 Wiki 页面的 Hexo URL 格式为：

```
/:year/:month/:day/:hexoDate-:safeTitle/
```

示例：
- Wiki 文件：`.wiki/concepts/RAG检索增强生成.md`（frontmatter `created: 2025-09-12`）
- Hexo 文件：`source/_posts/LearningNote/2025-09-12-RAG检索增强生成.md`
- **正确 URL**：`/2025/09/12/2025-09-12-RAG检索增强生成/`
- ~~错误 URL~~：~~`/2025/09/12/RAG检索增强生成/`~~（会 404！）

### 知识图谱

wiki-chat 面板中的交互式力导向图：

- **节点** = Wiki 页面（颜色按层级区分，大小按链接数量）
- **边** = WikiLink 连接关系
- **交互** = 拖拽节点 / 悬浮查看详情 / 点击跳转文章
- **图例** = concepts(红) / entities(青) / ML(蓝) / skills(蓝) / PM(橙)

### wiki-index.json 增量字段（Phase 3）

| 字段 | 说明 |
|------|------|
| `backlinks` | 引用当前页面的其他页面列表 |
| `outlinks` | 当前页面引用的其他页面列表 |

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

## 审计系统（v3 新增）

### 审计目录

```
.wiki/audit/
├── README.md              # 审计格式说明
├── AUDIT-2026-001.md      # 审计反馈文件
├── AUDIT-2026-002.md
└── ...
```

### 审计文件格式

文件名：`AUDIT-YYYY-NNN.md`

```yaml
---
id: AUDIT-2026-001
target: "[[页面标题]]"
type: quality              # quality | accuracy | completeness | outdated | duplicate | structure | dead_link
severity: major            # critical | major | minor | suggestion
status: open               # open | in_progress | resolved | dismissed
comment: "问题描述"
suggested_action: recompile # add_content | update | merge | split | delete | fix_link | recompile
created: 2026-04-24
resolved:
resolved_by:
---
```

### 审计来源

| 来源 | 触发 | 生成的审计类型 |
|------|------|---------------|
| wiki-lint.js | 编译后 / CI | dead_link, structure |
| AI Review | 编译后自动评估 | quality, completeness, duplicate |
| CMS 审阅评论 | 用户提交 | accuracy, outdated |
| wiki-chat.js | 用户反馈 | quality, completeness |

### 审计生命周期

```
open → in_progress → resolved
                    → dismissed
```

### AI 可自动处理的审计

| suggested_action | AI 自动处理 | 说明 |
|-----------------|------------|------|
| `recompile` | ✅ | AI 重编译页面 |
| `add_content` | ✅ | AI 补充缺失内容 |
| `update` | ✅ | AI 更新过时内容 |
| `merge` | ✅ | AI 合并重复页面 |
| `split` | ✅ | AI 拆分过长页面 |
| `fix_link` | ✅ | 自动修复死链 |
| `delete` | ⚠️ 需人工确认 | 删除页面风险较高 |

### Lint 检查（7 轮）

| Pass | 检查项 | 自动修复 | 对应审计类型 |
|------|--------|---------|-------------|
| 1 | 死链检测 | 生成审计 | dead_link |
| 2 | 孤儿页 | 生成审计 | structure |
| 3 | 缺失索引 | ✅ 自动补全 | — |
| 4 | 高频未建页 | 生成审计 | completeness |
| 5 | 日志格式 | ✅ 自动修复 | — |
| 6 | 审计文件格式 | ✅ 自动修复 | — |
| 7 | 审计目标存在性 | ✅ 清理无效 | — |
