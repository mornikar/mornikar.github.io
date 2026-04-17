# 🌲 分支架构说明

> 本文件说明 mornikar.github.io 仓库的分支结构与工作流程。  
> **最后更新**：2026-04-17

---

## 一、分支一览

| 分支 | 用途 | 保护 | 日常操作 |
|------|------|------|----------|
| **`source`** | 🔧 **开发分支** | 否 | 所有开发在此完成 |
| **`main`** | 🏠 **GitHub Pages 部署源**（Actions 原生） | 否 | CI 自动同步；不手动推送 |

> ⚠️ **核心原则**：永远在 `source` 开发。**不要**直接推送内容到 `main`。

---

## 二、各分支详解

### main（主分支）

| 属性 | 值 |
|------|-----|
| **职责** | GitHub Pages 托管的静态文件来源 |
| **读取方式** | Settings → Pages → Build type = `GitHub Actions` |
| **访问地址** | https://mornikar.github.io/ |
| **更新方式** | GitHub Actions CI 自动同步（upload-pages-artifact） |
| **禁止** | 不手动推送；不在此分支开发 |

> 💡 `main` 分支由 CI 通过 `actions/upload-pages-artifact@v3` 自动更新，绕过 Jekyll 直接服务静态文件（解决 legacy Jekyll 的 docs 子目录 404 问题）。

### source（开发分支）

| 属性 | 值 |
|------|-----|
| **职责** | 存放所有源码，是日常开发的唯一分支 |
| **推送** | 完成开发后 push 到 source，CI 自动触发 |
| **合并** | 不合并到 main；CI 负责内容同步 |

**主要内容**：

```
source/
├── source/_posts/       ← Hexo 文章（由 wiki-to-hexo.js 生成）
│   ├── LearningNote/
│   └── LearningEssays/
├── themes/              ← 主题代码
│   └── arknights/
├── scripts/             ← 自动化脚本
│   ├── wiki-to-hexo.js
│   ├── build_docs_html.js  ← .docs-src/ → HTML
│   └── compile_css.js
├── .wiki/               ← Wiki 源文档
│   ├── concepts/
│   ├── entities/
│   └── ...
├── .docs-src/           ← 项目文档（由 build_docs_html.js 转 HTML）
│   ├── index.md
│   ├── PROJECT/index.md
│   ├── MAINTENANCE/index.md
│   ├── TROUBLESHOOTING/index.md
│   └── MIGRATION/index.md
├── .github/workflows/   ← CI 工作流
└── _config.yml          ← Hexo 配置
```

### gh-pages（旧部署分支，已废弃）

| 属性 | 值 |
|------|-----|
| **历史** | legacy GitHub Pages 从 `gh-pages` 读取（peaceiris/actions-gh-pages） |
| **现状** | 已切换到 `main` + `build_type=workflow`，此分支保留作备份 |
| **操作** | 可保留，无需删除 |

---

## 三、工作流程图

```
┌──────────────────────────────────────┐
│     本地开发（source 分支）           │
│                                      │
│  themes/   .wiki/   scripts/         │
│  .docs-src/  _config.yml             │
└──────────────┬───────────────────────┘
               │ git push
               ▼
┌──────────────────────────────────────┐
│  GitHub source 分支                  │
│                                      │
│  CI 自动触发构建                      │
│  ├─ npm install                     │
│  ├─ wiki-to-hexo.js                 │
│  ├─ hexo generate                   │
│  ├─ compile_css.js                  │
│  ├─ pagefind                        │
│  ├─ build_docs_html.js              │  ← .docs-src/*.md → HTML
│  ├─ cp README.md                    │
│  ├─ upload-pages-artifact            │
│  └─ deploy-pages                    │  ← Actions 原生 Pages 部署
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  GitHub Pages（build_type=workflow） │
│                                      │
│  直接服务 artifact，无 Jekyll 处理     │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  https://mornikar.github.io          │
│                                      │
│  🌐 网站首页                          │
│  📄 /docs/ 项目文档（HTML）           │
│  🔍 /pagefind/ 全文搜索               │
└──────────────────────────────────────┘
```

---

## 四、CI 触发条件

`deploy.yml` 监听 `source` 分支的以下路径变更：

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

> 📌 **不需要**手动合并到任何分支，CI 会自动同步。

### 本地命令速查

| 命令 | 说明 |
|------|------|
| `wiki-sync.bat` | 一键同步（清理→转换→生成→搜索→提交→推送） |
| `wiki-sync.bat --dry-run` | 预览转换结果 |
| `hexo server` | 本地预览（端口 4000） |

### 手动触发 CI

如果 CI 未自动触发：
1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 点击「Wiki-Hexo 自动部署」
3. 点击右侧「Run workflow」→ 选择 `source` 分支

---

## 六、文档访问

| 文档 | 地址 |
|------|------|
| 🌐 项目总览 | https://mornikar.github.io/docs/ |
| 📐 系统架构 | https://mornikar.github.io/docs/PROJECT/ |
| 🔧 维护指南 | https://mornikar.github.io/docs/MAINTENANCE/ |
| 🔍 故障排查 | https://mornikar.github.io/docs/TROUBLESHOOTING/ |
| 📋 迁移规范 | https://mornikar.github.io/docs/MIGRATION/ |
| 🌲 分支说明 | https://mornikar.github.io/docs/BRANCHES/ |

---

## 七、相关资源

| 资源 | 链接 |
|------|------|
| GitHub 仓库 | https://github.com/mornikar/mornikar.github.io |
| 网站主站 | https://mornikar.github.io/ |
| CI 构建历史 | https://github.com/mornikar/mornikar.github.io/actions |
| Wiki Schema | https://mornikar.github.io/wiki/index.html |
