# 分支架构说明

> 本文件说明 mornikar.github.io 仓库的分支结构与工作流程。

---

## 一、分支一览

| 分支 | 用途 | 是否受保护 | 日常操作 |
|------|------|-----------|----------|
| **main** | 🏠 **主分支 / GitHub Pages 部署源** | 否 | 不手动推送；由 CI 自动同步最新内容 |
| **source** | 🔧 **开发分支** | 否 | 所有开发在此分支进行 |
| **gh-pages** | 📦 旧部署分支（已废弃） | 否 | 可保留作备份 |

---

## 二、各分支详解

### main（主分支）

- **职责**：GitHub Pages 托管的静态文件来源
- **读取方式**：GitHub Settings → Pages → Source = `main` / `(root)`
- **访问地址**：[https://mornikar.github.io/](https://mornikar.github.io/)
- **更新方式**：由 GitHub Actions CI 自动同步 source 分支的最新构建产物（`public/` 目录）
- **禁止**：不直接从本地推送内容到 main；不要在 main 上手动开发

> ⚠️ `main` 分支包含 Hexo 生成的静态文件（index.html、css/、js/、docs/ 等），以及根目录的 `README.md`、`_config.yml`、`package.json` 等配置文件。

### source（开发分支）

- **职责**：存放所有源码和配置，是日常开发的唯一分支
- **内容**：
  - `source/` — Hexo 源文件（文章、页面、主题）
  - `themes/` — 主题代码
  - `scripts/` — 自动化脚本（wiki-to-hexo.js 等）
  - `.wiki/` — Wiki 源文档
  - `.github/workflows/` — CI 工作流
  - `source/docs/` — 项目文档（会在 CI 中部署到 `/docs/`）
  - `README.md` — 仓库说明文档
- **推送**：完成开发后 push 到 source，CI 自动触发
- **合并**：不合并到 main；CI 负责内容同步

### gh-pages（旧部署分支，已废弃）

- **历史**：早期 GitHub Pages 从 `gh-pages` 读取
- **现状**：已切换到 `main`，此分支保留作备份
- **处理**：可保留，无需删除

---

## 三、工作流程图

```
┌─────────────────────────────┐
│    本地开发（source 分支）    │
│  themes/ .wiki/ scripts/     │
│  source/docs/ _config.yml    │
└──────────────┬──────────────┘
               │ git push
               ▼
┌─────────────────────────────┐
│  GitHub source 分支          │
│  CI 自动触发构建              │
└──────────────┬──────────────┘
               │ CI: hexo generate
               │ CI: 编译 CSS
               │ CI: 构建 Pagefind
               │ CI: 复制 docs/
               ▼
┌─────────────────────────────┐
│  GitHub main 分支           │
│  public/ 内容（自动同步）     │
└──────────────┬──────────────┘
               │ GitHub Pages 读取
               ▼
┌─────────────────────────────┐
│  https://mornikar.github.io │
│  网站 + /docs/ 文档          │
└─────────────────────────────┘
```

---

## 四、CI 触发条件

deploy.yml 监听 source 分支的以下路径变更：

| 路径 | 说明 |
|------|------|
| `.wiki/**` | Wiki 源文档变更 |
| `scripts/wiki-to-hexo.js` | 转换脚本更新 |
| `scripts/sync-wiki-to-dify.js` | Dify 同步脚本 |
| `_config.yml` | Hexo 配置 |
| `themes/**` | 主题代码 |
| `.github/workflows/**` | CI 工作流 |
| `*.md` | 项目文档 |
| `source/docs/**` | 文档源文件 |

---

## 五、日常操作规范

### 开发流程
1. 在 `source` 分支开发、测试（本地 `hexo generate` + `hexo server`）
2. push 到 GitHub → CI 自动构建
3. 验证 [https://mornikar.github.io/](https://mornikar.github.io/) 正常
4. **不需要**手动合并到任何分支

### 本地测试命令
```powershell
# 完整构建流程
cd D:\Auxiliary_means\Git\mornikar.github.io\Hexo
node scripts/wiki-to-hexo.js
hexo generate
# 本地预览
hexo server
```

### Wiki 同步到网站
```powershell
# 一键同步
wiki-sync.bat
```

### 触发手动 CI
如 CI 未自动触发，可在 GitHub Actions 页面手动运行：
`https://github.com/mornikar/mornikar.github.io/actions` → Wiki-Hexo 自动部署 → Run workflow

---

## 六、文档访问

| 文档 | 链接 |
|------|------|
| 项目总览 | https://mornikar.github.io/docs/PROJECT/ |
| 维护指南 | https://mornikar.github.io/docs/MAINTENANCE/ |
| 故障排查 | https://mornikar.github.io/docs/TROUBLESHOOTING/ |
| 迁移规范 | https://mornikar.github.io/docs/MIGRATION/ |
| 文档首页 | https://mornikar.github.io/docs/ |

---

## 七、相关资源

- **GitHub 仓库**：[mornikar/mornikar.github.io](https://github.com/mornikar/mornikar.github.io)
- **网站**：[https://mornikar.github.io/](https://mornikar.github.io/)
- **CI 构建历史**：[https://github.com/mornikar/mornikar.github.io/actions](https://github.com/mornikar/mornikar.github.io/actions)
