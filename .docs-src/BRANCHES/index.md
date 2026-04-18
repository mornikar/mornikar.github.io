---
title: 分支架构说明
---

# 🌲 分支架构说明

> 本文件说明 mornikar.github.io 仓库的分支结构与工作流程。
> **最后更新**：2026-04-19

---

## 一、分支一览

| 分支 | 用途 | 保护 | 日常操作 |
:|------|------|------|----------|
| **`source`** | 🔧 **开发分支** | 否 | 所有开发在此完成 |
| **`gh-pages`** | 🏠 **GitHub Pages 部署源**（静态文件） | 否 | CI 自动推送；不手动操作 |
| **`main`** | 📌 **备用**（无实际作用） | 否 | 不使用 |

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
| **访问地址** | https://mornikar.github.io/ |
| **更新方式** | CI 通过 `peaceiris/actions-gh-pages@v4` 自动推送 |
| **禁止** | 不手动推送；不在此分支开发 |

> 💡 `gh-pages` 分支由 CI 通过 `peaceiris/actions-gh-pages@v4` 自动推送（`force_orphan: true`）。**不使用** `deploy-pages@v4` 的 artifact 方式——因为 `github-pages` 环境的自定义分支策略会拦截 artifact 部署。

### main（主分支）

| 属性 | 值 |
:|------|-----|
| **职责** | 备用，当前无实际作用 |
| **历史** | 曾作为 GitHub Actions workflow 方式的部署源（2026-04-18） |
| **禁止** | 不在此分支开发或推送 |

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
│  https://mornikar.github.io                  │
│                                              │
│  🌐 网站首页  📄 /docs/  🔍 /pagefind/       │
└──────────────────────────────────────────────┘
```

---

## 四、CI 触发条件

`deploy.yml` 监听 `source` 分支的以下路径变更：

| 路径 | 说明 |
:|------|------|
| `.wiki/**` | Wiki 源文档变更 |
| `scripts/wiki-to-hexo.js` | 转换脚本更新 |
| `scripts/build_docs_html.js` | 文档构建脚本 |
| `scripts/compile_css.js` | CSS 编译脚本 |
| `tools/sync-wiki-to-dify.js` | Dify 同步脚本 |
| `_config.yml` | Hexo 配置 |
| `themes/**` | 主题代码 |
| `.github/workflows/**` | CI 工作流 |
| `*.md` | 项目文档（根目录） |
| `.docs-src/**` | 项目文档源文件 |

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
| `wiki-sync.bat` | 一键同步（清理→转换→生成→搜索→提交→推送） |
| `wiki-sync.bat --dry-run` | 预览转换结果 |
| `hexo server` | 本地预览（端口 4000） |

### 手动触发 CI

如果 CI 未自动触发：
1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 点击「Wiki-Hexo 自动部署」
3. 点击右侧「Run workflow」→ 选择 `source` 分支

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
