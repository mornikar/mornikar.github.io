---
title: 分支架构说明
---

# 🌲 分支架构说明

> 本文件说明 mornikar.github.io 仓库的分支结构与工作流程。
> **最后更新**：2026-05-14

---

## 一、分支一览

| 分支 | 用途 | 保护 | 日常操作 |
:|------|------|------|----------|
| **`source`** | 🔧 **开发分支** | 否 | 所有开发在此完成 |
| **`gh-pages`** | 🏠 **GitHub Pages 部署源**（静态文件） | 否 | CI 自动推送；不手动操作 |
| **`main`** | 📄 **项目文档展示** | 否 | 从 source 同步文档 |

> ⚠️ **核心原则**：永远在 `source` 开发。**不要**直接推送内容到 `gh-pages`。

---

## 二、各分支详解

### source（开发分支）

| 属性 | 值 |
:|------|-----|
| **职责** | 存放所有源码，是日常开发的唯一分支 |
| **推送** | 完成开发后 push 到 source，CI 自动触发 |
| **合并** | 不合并到其他分支；CI 负责内容同步 |

**主要内容**：

```
source 分支（当前仓库）
├── .wiki/               ← Wiki 源文档（编辑入口）
├── .docs-src/           ← 项目文档（CI 用 build_docs_html.js 转 HTML）
├── source/_posts/       ← Hexo 文章（由 wiki-to-hexo.js 自动生成）
├── themes/arknights/   ← 主题代码
├── scripts/             ← 自动化脚本
│   ├── wiki-to-hexo.js
│   ├── build_docs_html.js
│   └── compile_css.js
├── tools/               ← 辅助工具
│   └── sync-wiki-to-dify.js  ← Wiki → Dify 知识库同步
└── .github/workflows/   ← CI 工作流
```

### gh-pages（Pages 部署源）

| 属性 | 值 |
:|------|-----|
| **职责** | GitHub Pages 托管的静态文件来源 |
| **读取方式** | Settings → Pages → Source = `Deploy from a branch` → `gh-pages` |
| **访问地址** | https://mornikar.github.io/Mornikar/ |
| **更新方式** | CI 通过 `peaceiris/actions-gh-pages@v4` 自动推送 |
| **禁止** | 不手动推送；不在此分支开发 |

> 💡 `gh-pages` 分支由 CI 通过 `peaceiris/actions-gh-pages@v4` 自动推送（`force_orphan: true`）。**不使用** `deploy-pages@v4` 的 artifact 方式——因为 `github-pages` 环境的自定义分支策略会拦截 artifact 部署。

### main（主分支 / 项目文档）

| 属性 | 值 |
:|------|-----|
| **职责** | 项目文档展示分支，GitHub 仓库首页展示用 |
| **内容** | `README.md`、`BRANCHES.md`、`.docs-src/` 项目文档 |
| **更新方式** | 从 `source` 分支手动同步文档文件 |
| **禁止** | 不在此分支开发 |

**主要内容**：

```
main 分支（项目文档）
├── README.md            ← 项目说明（与 source 分支同步）
├── BRANCHES.md          ← 分支架构说明
└── .docs-src/           ← 项目文档源文件
    ├── index.md
    ├── AI_CHAT/index.md       ← AI 助手文档
    ├── PROJECT/index.md       ← 系统架构文档
    ├── INSTALL/index.md       ← 安装部署指南
    ├── MAINTENANCE/index.md
    ├── TROUBLESHOOTING/index.md
    └── MIGRATION/index.md
```

> 💡 `main` 分支仅包含项目文档，不包含源码或构建产物。源码在 `source` 分支，构建产物在 `gh-pages` 分支。

---

## 三、工作流程图

```
┌──────────────────────────────────────────────┐
│     本地开发（source 分支）                    │
│                                              │
│  themes/   .wiki/   scripts/                │
│  .docs-src/  _config.yml                    │
└──────────────┬───────────────────────────────┘
               │ git push
               ▼
┌──────────────────────────────────────────────┐
│  GitHub source 分支                           │
│                                              │
│  CI 自动触发构建                               │
│  ├─ npm ci                                  │
│  ├─ wiki-to-hexo.js                          │
│  ├─ hexo generate                            │
│  ├─ compile_css.js                           │  ← stylus 直接编译
│  ├─ Pagefind                                 │
│  ├─ build_docs_html.js                       │  ← .docs-src/*.md → HTML
│  └─ peaceiris/actions-gh-pages@v4           │  ← 推送到 gh-pages 分支
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  GitHub gh-pages 分支（静态文件）              │
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  GitHub Pages（Deploy from branch → gh-pages）│
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  https://mornikar.github.io/Mornikar/        │
│                                              │
│  🌐 网站首页  📄 /Mornikar/docs/  🔍 /Mornikar/pagefind/ │
└──────────────────────────────────────────────┘
```

---

## 四、CI 触发条件

`deploy.yml` 监听 `source` 分支的以下路径变更：

| 路径 | 说明 |
:|------|------|
| `.wiki/**` | Wiki 源文档变更 |
| `scripts/wiki-to-hexo.js` | Wiki → Hexo 转换脚本 |
| `scripts/wiki-compile.js` | AI 编译脚本（raw 素材 → wiki 页面） |
| `scripts/build_docs_html.js` | 文档构建脚本 |
| `scripts/compile_css.js` | CSS 编译脚本 |
| `scripts/copy-assets.js` | 资产复制脚本 |
| `scripts/auto-maintain.js` | 定时自维护脚本 |
| `scripts/wiki-lint.js` | Wiki 健康检查脚本 |
| `tools/sync-wiki-to-dify.js` | Dify 知识库同步脚本 |
| `_config.yml` | Hexo 配置 |
| `themes/**` | 主题代码 |
| `.github/workflows/**` | CI 工作流 |
| `*.md` | 项目文档（根目录） |
| `.docs-src/**` | 项目文档源文件 |
| `source/admin/**` | Decap CMS 管理界面 |
| `tools/**` | 工具脚本（OAuth Worker 等） |

### 自动触发机制

| 触发器 | 说明 |
|:--------|:------|
| **push** | 推送到 `source` 分支时自动触发构建 |
| **schedule** | 每天 UTC 3:00（北京时间 11:00）自动运行 `auto-maintain.js` 自维护任务 |
| **workflow_dispatch** | 手动触发，支持 `normal` / `force` / `dry-run` 三种模式 |

### CI 构建流程

```
push / schedule / dispatch
    ↓
┌─ AI 编译 raw 素材（可选，需 API_KEY）
├─ AI 自动审阅（可选，需 API_KEY）
├─ Wiki Lint 健康检查
├─ Wiki → Hexo 转换
├─ hexo generate
├─ compile_css.js（Stylus 编译）
├─ Pagefind 搜索索引
├─ build_docs_html.js（.docs-src → HTML）
├─ copy-assets.js（资产复制）
└─ peaceiris/actions-gh-pages（部署）
```

---

## 五、日常操作规范

### 开发流程

```
1. git pull origin source          # 拉取最新代码
2. 本地编辑（.wiki/ 或 .docs-src/）
3. wiki-sync.bat                   # 本地预览
4. git add . && git commit -m "..." # 提交
5. git push origin source           # 推送触发 CI
6. 验证 https://mornikar.github.io  # 确认效果
```

### 本地命令速查

| 命令 | 说明 |
:|------|------|
| `wiki-sync.bat` | 一键同步（清理→Dify同步→AI编译→转换→生成→搜索→提交→推送） |
| `wiki-sync.bat --dry-run` | 预览转换结果（不写入文件） |
| `wiki-sync.bat --force` | 强制全量转换 |
| `hexo server` | 本地预览（端口 4000） |
| `hexo clean` | 清理构建缓存 |
| `node scripts/wiki-lint.js --audit` | 运行 Wiki 健康检查 |

### 手动触发 CI

如果 CI 未自动触发：
1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 点击「Wiki-Hexo 自动部署」
3. 点击右侧「Run workflow」→ 选择 `source` 分支
4. 可选：选择构建模式（`normal` / `force` / `dry-run`）

### 定时自维护

`deploy.yml` 配置了每日定时任务（Cron: `0 3 * * *`，北京时间 11:00）：
- 自动运行 `scripts/auto-maintain.js --audit-fix`
- 自动修复 Wiki 健康检查发现的问题
- 自动重新构建并部署

---

## 六、踩坑记录

### 2026-04-19: deploy-pages@v4 被环境分支策略拦截

**问题**：`deploy.yml` 使用 `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` 部署方式，CI 报告成功，但 GitHub Pages 始终停留在旧 commit，不更新。

**排查过程**：
1. CI 所有步骤均为 ✅ success
2. `gh api /pages/builds` 显示 Pages 最后构建停在旧 commit
3. 最新 artifact 创建正常，但 Pages 从未读取
4. `gh api /environments/github-pages` 发现 `deployment_branch_policy.custom_branch_policies: true`
5. **根因**：artifact 部署方式被 `github-pages` 环境分支策略拦截

**修复**：
- 改用 `peaceiris/actions-gh-pages@v4` 推送 `gh-pages` 分支
- GitHub Pages 设置改为 `Deploy from a branch` → `gh-pages`
- 权限改为 `contents: write`（移除了 `pages: write` 和 `id-token: write`）

**结论**：如果 Pages 环境的 `custom_branch_policies: true`，必须使用分支推送方式，不能用 `deploy-pages@v4` artifact 方式。

### 2026-05-14: CI 工作流新增自动化功能

**新增功能**：
1. **AI 编译**：`scripts/wiki-compile.js` — 自动将 `.wiki/raw/` 原始素材编译为结构化 wiki 页面
2. **AI 审阅**：`scripts/wiki-compile.js --review` — 自动审阅新提交的 wiki 内容
3. **Wiki Lint**：`scripts/wiki-lint.js --audit` — 健康检查，检测 broken links、missing frontmatter 等问题
4. **定时自维护**：`scripts/auto-maintain.js --audit-fix` — 每日自动修复 Wiki 问题并重新部署
5. **资产复制**：`scripts/copy-assets.js` — 自动复制 wiki 资产到 `public/assets/`
6. **Dify 同步**：`tools/sync-wiki-to-dify.js` — 自动将 wiki 内容同步到 Dify 知识库

**环境变量配置**（GitHub Secrets）：
- `WIKI_COMPILE_API_KEY` — AI 编译/审阅 API Key
- `WIKI_COMPILE_ENDPOINT` — AI 编译 API 端点
- `WIKI_COMPILE_MODEL` — AI 编译模型名称

**注意**：AI 相关步骤均为可选，未配置 API Key 时自动跳过，不影响整体构建流程。
