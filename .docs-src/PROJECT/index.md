---
title: 系统架构
---
# 📐 系统架构

## 一、目录结构

```
mornikar.github.io/
│
├── .wiki/                          # ⭐ LLM Wiki 源文件（编辑入口）
│   ├── SCHEMA.md                   #   Wiki 规范定义
│   ├── index.md                   #   索引总览
│   ├── log.md                     #   操作日志
│   ├── concepts/                  #   技术概念笔记 → LearningNote
│   ├── entities/                  #   实体随笔 → LearningEssays
│   ├── comparisons/               #   对比分析 → LearningNote
│   ├── queries/                   #   查询结果 → LearningNote
│   └── raw/                       #   原始材料（不发布）
│
├── .docs-src/                      # 📄 项目文档（CI 用 build_docs_html.js 转 HTML 到 /docs/）
│   ├── index.md                   #   文档首页 → /docs/
│   ├── PROJECT/index.md           #   系统架构 → /docs/PROJECT/
│   ├── MAINTENANCE/index.md       #   维护指南 → /docs/MAINTENANCE/
│   ├── TROUBLESHOOTING/index.md  #   故障排查 → /docs/TROUBLESHOOTING/
│   └── MIGRATION/index.md        #   迁移规范 → /docs/MIGRATION/
│
├── source/                         # Hexo 源文件
│   └── _posts/                    #   博客文章（由 wiki-to-hexo.js 生成）
│       ├── LearningNote/
│       └── LearningEssays/
│
├── themes/arknights/               # 明日方舟风格主题（fork）
│   ├── layout/                    #   Pug 模板
│   │   ├── post.pug              #   文章页
│   │   ├── page.pug              #   页面页
│   │   └── index.pug             #   主页
│   ├── scripts/                   #   主题脚本（含 hexo7-pug-fix）
│   └── source/
│       ├── css/                  #   样式文件
│       │   ├── arknights.styl    #   主样式
│       │   ├── wikilink.styl     #   WikiLink 高亮
│       │   ├── wiki-badge.styl   #   Wiki 徽章
│       │   └── wiki-source.styl  #   Wiki 来源标注
│       └── js/
│           ├── wiki-chat.js      #   AI 对话侧边栏
│           └── wikilink.js       #   WikiLink 交互
│
├── scripts/                        # 自动化脚本
│   ├── wiki-to-hexo.js           #   v4.0 Wiki → Hexo 转换
│   ├── build_docs_html.js         #   CI 中将 .docs-src/ markdown 转 HTML
│   ├── compile_css.js             #   CI 中手动编译 Stylus
│   ├── sync-wiki-to-dify.js       #   Wiki → Dify 知识库同步
│   └── wiki-to-hexo.test.js       #   单元测试
│
├── .github/workflows/
│   └── deploy.yml                 #   CI 部署工作流
│
├── Hexo 配置文件
│   ├── _config.yml                #   Hexo 主配置
│   ├── .gitignore
│   ├── package.json
│   └── BRANCHES.md                #   分支架构说明（源码）
│
└── README.md                      #   GitHub 仓库说明（CI 复制到根目录）
```

---

## 二、Git 分支策略

| 分支 | 用途 | 保护状态 | 日常操作 |
|------|------|----------|----------|
| **`source`** | 🔧 **开发分支** | 否 | 所有开发在此完成 |
| **`main`** | 🏠 **GitHub Pages 部署源**（Actions 原生，build_type=workflow） | 否 | CI 自动同步；不手动推送 |

> ⚠️ **重要规则**：所有开发在 `source` 分支进行。**不要**直接推送内容到 `main`，CI 会自动同步最新构建产物。

---

## 三、部署流程详解

```
push to source
       │
       ▼
┌─────────────────────────────────┐
│    GitHub Actions CI            │
│                                │
│  ① Checkout source             │
│  ② npm install                 │
│  ③ node wiki-to-hexo.js        │
│  ④ hexo generate               │
│  ⑤ node compile_css.js         │  ← 处理多级 @import
│  ⑥ npx pagefind                │
│  ⑦ node build_docs_html.js      │  ← .docs-src/*.md → HTML
│  ⑧ cp README.md public/        │
│  ⑨ upload-pages-artifact         │
│  ⑩ deploy-pages                 │  ← Actions 原生 Pages 部署 |
└─────────────────────────────────┘
       │
       ▼
GitHub Pages（build_type=workflow）
直接从 artifact 部署，无需 Jekyll
       │
       ▼
https://mornikar.github.io
```

### CI 触发条件（deploy.yml paths 配置）

| 路径 | 说明 |
|------|------|
| `.wiki/**` | Wiki 源文档变更 |
| `scripts/wiki-to-hexo.js` | 转换脚本更新 |
| `scripts/build_docs_html.js` | 文档构建脚本 |
| `scripts/sync-wiki-to-dify.js` | Dify 同步脚本 |
| `_config.yml` | Hexo 配置 |
| `themes/**` | 主题代码 |
| `.github/workflows/**` | CI 工作流 |
| `*.md` | 项目文档（根目录） |
| `.docs-src/**` | 项目文档源文件 |

---

## 四、核心组件详解

### 4.1 Wiki → Hexo 转换（wiki-to-hexo.js v4.0）

**功能**：将 `.wiki/` 目录下的 Markdown 文件转换为 Hexo 可发布的格式。

| 功能 | 说明 |
|------|------|
| WikiLink 转换 | `[[X]]` → `/YYYY/MM/DD/X/` |
| 大小写容错 | 精确匹配 → 大小写不敏感 → 前缀模糊 → 路径降级 |
| frontmatter 转换 | Wiki frontmatter → Hexo frontmatter |
| 分类映射 | concepts/entities/comparisons/queries → Hexo categories |
| 增量同步 | 仅处理 changed/new 文件 |
| 冲突检测 | 检测文件名冲突并提示 |

**输出**：`source/_posts/<分类>/<文件名>.md`

### 4.2 Dify RAG 集成

| 配置项 | 值 |
|--------|-----|
| Dify 地址 | http://localhost:80（Docker Desktop） |
| Dify 版本 | 1.13.3 |
| 向量数据库 | Weaviate |
| 知识库 ID | `29362489-8750-4915-8cf6-05198f234721` |
| Dataset API Key | `dataset-qfr0cZc2dnjftg5tVTraWRWf` |
| 聊天应用 ID | `mornikar` |
| App API Key | `app-JznEvGv3JlWWISRmNdjRO7yE` |

**同步方式**：`node tools/sync-wiki-to-dify.js`

### 4.3 WikiChat 侧边栏

- **外观**：🔵 蓝色悬浮按钮，位于页面右下角
- **功能**：点击展开 AI 对话界面，调用 Dify API
- **触发**：Footer 区域的 `<span>...</span>` 标记（需 hexo-renderer-pug 支持）
- **公网访问**：通过 Tailscale 穿透，手机可访问

### 4.4 Pagefind 静态搜索

| 项目 | 值 |
|------|-----|
| 版本 | 1.5.x |
| 索引范围 | `public/` 目录 |
| 索引时机 | CI 中自动构建 |
| 访问地址 | `https://mornikar.github.io/pagefind/` |

---

## 五、主题定制

### 5.1 WikiLink 高亮样式

| 文件 | 功能 |
|------|------|
| `themes/arknights/source/css/wikilink.styl` | WikiLink 链接样式 |
| `themes/arknights/source/css/wiki-badge.styl` | `[Wiki]` 徽章样式 |
| `themes/arknights/source/css/wiki-source.styl` | 来源标注样式 |
| `themes/arknights/source/js/wikilink.js` | 点击行为处理 |

### 5.2 Hexo Pug 模板修复

Hexo 7 的 `_buildLocals` 将 frontmatter 扁平化，导致 pug-runtime 的 `compile()` 无法找到 `page` 对象。

| 文件 | 修复方式 |
|------|----------|
| `scripts/hexo7-pug-fix.js` | patch `node_modules/hexo-renderer-pug/lib/pug.js` |
| `layout.pug` | 使用 `page` 局部变量而非裸函数调用 |

### 5.3 Stylus 多级 @import 编译

hexo-renderer-stylus 无法处理多级 `@import`，CI 中改用 Node.js stylus 直接编译：

```bash
node scripts/compile_css.js
```

本地如有同样问题，运行同目录命令。

---

## 六、相关资源

| 资源 | 链接 |
|------|------|
| Hexo 官方文档 | https://hexo.io/zh-cn/docs/ |
| Pug 模板引擎 | https://pugjs.org/ |
| Stylus CSS | https://stylus-lang.com/ |
| Pagefind 文档 | https://pagefind.app/ |
| Dify 官方 | https://dify.ai/ |
| Tailscale | https://tailscale.com/ |
