---
title: Hexo 迁移到 /Mornikar/ 路径说明
---
# Hexo 迁移到 /Mornikar/ 路径说明

> 2026-05-17 起，`https://mornikar.github.io/` 根站由 `mornikar/mornikar_index` 仓库中的 `MMO_index` 首页项目承载。旧 Hexo 博客继续保留在 `mornikar/mornikar.github.io` 仓库，但线上访问路径迁移为 `https://mornikar.github.io/Mornikar/`。

## 目标边界

| 项目 | 仓库 | 线上路径 | 说明 |
|------|------|----------|------|
| MMO_index 首页 | `mornikar/mornikar_index` | `https://mornikar.github.io/` | 新首页和导航 shell |
| 旧 Hexo 博客 | `mornikar/mornikar.github.io` | `https://mornikar.github.io/Mornikar/` | 历史博客、Wiki、CMS、文档 |
| MMO_CMS | `mornikar/mornikar.github.io` 的 `source/admin` | `https://mornikar.github.io/Mornikar/admin/` | GitHub OAuth CMS 入口 |

不要把 Hexo 内容推到 `mornikar_index`，也不要把 `MMO_index` 内容提交到 Hexo 仓库。两个仓库职责分离。

## 已调整的关键位置

| 文件 | 改动原因 |
|------|----------|
| `_config.yml` | `url` 改为 `https://mornikar.github.io/Mornikar`，`root` 改为 `/Mornikar/`。 |
| `.github/workflows/deploy.yml` | Pages 部署写入 `gh-pages/Mornikar`，并使用 `keep_files: true` 保留根站 MMO_index 文件。 |
| `source/admin/config.yml` | Decap/Sveltia CMS 的 `site_url`、`public_folder` 对齐 `/Mornikar/`。 |
| `source/admin/callback.html` | OAuth 回调完成后回到 `/Mornikar/admin/`。`postMessage` 的 target origin 仍必须是 `https://mornikar.github.io`，不能加路径。 |
| `tools/decap-oauth-worker.js`、`tools/wiki-cms-unified-worker.js` | OAuth 成功/失败回跳地址改为 `/Mornikar/admin/`。 |
| `tools/cms-worker.js`、`tools/wiki-cms-unified-worker.js` | CMS 上传图片后返回 `/Mornikar/images/wiki/...`，避免文章插图落到根站。 |
| `themes/arknights/layout/post.pug` | 文章编辑按钮通过 `config.root + 'admin/'` 生成，避免写死 `/admin/`。 |
| `themes/arknights/source/js/wiki-chat.js` | Pagefind 动态导入跟随 `config.root`，实际加载 `/Mornikar/pagefind/pagefind.js`。 |
| `themes/arknights/layout/custom/page-search.ejs` | Pagefind UI 本地兜底脚本通过 `url_for('/pagefind/pagefind-ui.js')` 生成。 |
| `themes/arknights/layout/custom/infinite-menu.ejs`、`themes/arknights/source/js/infinite-menu.js` | 首页、归档、分类、登录、资源等菜单项跟随 `/Mornikar/`。 |
| `themes/arknights/source/404.html` | 静态 404 页字体和首页链接改为 `/Mornikar/`。 |
| `scripts/build_docs_html.js` | 自建文档站 HTML 的导航、面包屑和品牌链接增加 `/Mornikar/` 前缀。 |
| `scripts/copy-assets.js` | 资源存档页面中的文件链接输出为 `/Mornikar/assets/...`。 |
| `scripts/auto-maintain.js` | 增加 `require.main === module` 保护，避免 Hexo 自动加载 `scripts/` 时误触发 git pull/commit/push。 |

## 脚本审计清单

迁移后每次改 Hexo 脚本，需要优先检查这些类型：

| 类型 | 检查重点 |
|------|----------|
| Hexo 构建脚本 | 是否写死 `/docs/`、`/pagefind/`、`/assets/`、`/admin/`。 |
| CMS/OAuth worker | 回跳 URL 是否为 `https://mornikar.github.io/Mornikar/admin/`；GitHub 仓库目标仍是 `mornikar.github.io`。 |
| 前端主题脚本 | 浏览器里使用 `config.root` 或 Hexo `url_for()`，不要直接写 `/login/`、`/pagefind/...`。 |
| 静态复制文件 | `themes/arknights/source/**` 里的文件不经过 Pug/EJS helpers，需要手动写 `/Mornikar/` 或使用相对路径。 |
| 自动维护脚本 | `scripts/auto-maintain.js` 只有直接执行时才应运行；`hexo generate` 不应产生 git 提交或推送。 |

## 推荐复查命令

```powershell
# 查旧根站线上 URL；旧 Hexo 文档和代码应指向 /Mornikar/，只有说明 MMO_index 根站时可保留根地址。
rg -n -F "https://mornikar.github.io/" _config.yml README.md BRANCHES.md source themes scripts tools .github .docs-src

# 查旧根路径入口
rg -n -F "/admin/" README.md BRANCHES.md source themes scripts tools .github .docs-src
rg -n -F "/pagefind/" README.md BRANCHES.md source themes scripts tools .github .docs-src
rg -n -F "/assets/" .wiki source scripts .docs-src

# 查构建时是否会误执行维护脚本
npm run build
git status --short
```

## 验证清单

1. `npm run build` 不应触发 `git pull`、`git commit`、`git push`。
2. `public/index.html`、文章页、文档页、资源页应在 `/Mornikar/` 下可访问。
3. CMS 入口应为 `https://mornikar.github.io/Mornikar/admin/`。
4. Pagefind 应加载 `/Mornikar/pagefind/pagefind.js` 或 `/Mornikar/pagefind/pagefind-ui.js`。
5. 资源存档页里的 PDF/图片链接应是 `/Mornikar/assets/...`。
6. `gh-pages` 根目录仍应保留 MMO_index 文件，Hexo 部署只写入 `Mornikar/` 子目录。

## 高风险提醒

- `postMessage` 的 target origin 只能是 origin，不能写成 `https://mornikar.github.io/Mornikar`。
- `scripts/auto-maintain.js` 的保护不要移除，否则本地构建可能再次自动提交/推送。
- `destination_dir: Mornikar` 和 `keep_files: true` 必须同时保留，否则可能覆盖根站 MMO_index。
- 旧 Hexo 的源码仓库仍是 `mornikar/mornikar.github.io`，不要因为线上路径变成 `/Mornikar/` 而改仓库名或 worker 的 GitHub API repo。
