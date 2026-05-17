---
title: 故障排查
---
# 🔍 故障排查

> 遇到问题时，先确认错误类型，再按对应章节排查。常见问题一般可在 5 分钟内解决。

---

## 按症状分类

| 症状 | 可能原因 | 快速跳转 |
|------|----------|----------|
| 网站显示旧样式 | 浏览器/CDN 缓存 | [§1](#1-网站样式不更新) |
| Wiki 文章没出现在博客 | 转换/编译问题 | [§2](#2-wiki-文章没出现在博客) |
| CI 构建失败 | 依赖/脚本错误 | [§3](#3-ci-构建失败) |
| wiki-chat-侧边栏没生效 | JS 未加载/路径错误 | [§4](#4-wiki-chat-侧边栏没生效) |
| AI 助手对话失败 | API 配置错误/CORS 问题 | [§5](#5-ai-助手对话失败) |
| CSS 编译失败 | Stylus @import 问题 | [§6](#6-css-编译失败) |
| Pug 渲染错误 | hexo7-pug-fix 未生效 | [§7](#7-pug-渲染错误) |
| GitHub Pages 404 | 分支/路径配置错误 | [§8](#8-github-pages-404) |
| Giscus 评论不显示 | App 未安装/Discussions 未开启 | [§9](#9-giscus-评论不显示) |
| Dify 无法访问 | Docker 未启动/端口占用 | [§10](#10-dify-无法访问) |
| Live2D 看板娘消失 | 设置面板关闭 Bug / 移动端限制 | [§12](#12-live2d-看板娘问题) |
| URL 含双横线/转义字符 | slugify 清洗不完整 | [§13](#13-url-异常双横线转义字符) |
| WikiLink 跳转 404 | 客户端和服务端 URL 不一致 | [§14](#14-wikilink-跳转-404) |
| CMS 保存 wiki 文件格式错误 | 保存时被包装 Hexo frontmatter | [§15](#15-cms-保存-wiki-文件格式错误) |
| PDF 资源未更新/存档页白色字 | 文件未提交/构建产物未生成 | [§16](#16-pdf-资源未更新-assets-archive-页面白色字无法打开) |

---

## 1. 网站样式不更新

**症状**：推送了新 CSS/JS，但网站显示旧样式。

### 排查步骤（按顺序）

**Step 1**：强制刷新浏览器

| 操作 | 快捷键 |
|------|--------|
| Windows Chrome | `Ctrl + Shift + R` |
| Windows Edge | `Ctrl + Shift + R` |
| 手机 Safari | 长按刷新 → 「硬性重新加载」 |

**Step 2**：禁用浏览器缓存（DevTools）

1. 按 `F12` 打开 DevTools
2. `Network` 面板 → 勾选 **Disable cache**
3. 保持 DevTools 打开状态下刷新页面

**Step 3**：确认 CDN 缓存

访问 https://www.gifgit.com/（或清缓存工具）清除 CDN 缓存。

**Step 4**：检查 GitHub Pages 最新 commit

打开 https://github.com/mornikar/mornikar.github.io/commits/main，确认最新 commit 是你的推送。

---

## 2. Wiki 文章没出现在博客

**症状**：编辑了 `.wiki/` 文件，但博客上没有这篇文章。

### 排查步骤

**Step 1**：检查 frontmatter 是否完整

```yaml
---
title: 文章标题          # ✅ 必须有
type: concepts            # ✅ 必须与目录名一致
tags: [AI, 学习]         # ✅ 至少一个标签
created: 2025-09-12      # ✅ 必须是 YYYY-MM-DD
updated: 2025-09-12      # ✅ 必须是 YYYY-MM-DD
---
```

> ⚠️ **常见错误**：`date: 2025/09/12` — 斜杠格式会导致 Hexo 无法生成文章！

**Step 2**：预览转换结果（不修改文件）

```powershell
wiki-sync.bat --dry-run
```

检查输出中是否包含目标文件。

**Step 3**：检查 `source/_posts/` 是否生成了文件

```powershell
# Windows
dir /s /b "source/_posts/*.md" | findstr "关键词"

# 或者直接查看目录
explorer source/_posts/
```

**Step 4**：检查 Hexo 编译是否有错误

```powershell
hexo generate 2>&1
```

观察输出中是否有 `[error]` 字样。

**Step 5**：检查文章路径

生成的 URL 应为 `/YYYY/MM/DD/标题/` 格式，如：
`https://mornikar.github.io/2025/09/12/RAG检索增强生成/`

---

## 3. CI 构建失败

**症状**：GitHub Actions 显示红色 ❌。

### 排查步骤

**Step 1**：查看 CI 日志

1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 点击失败的 workflow
3. 点击失败的步骤，查看报错信息

**Step 2**：常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `npm ERR!` | 依赖安装失败 | 检查 `package.json`；本地 `npm install` 复现 |
| `Error: Cannot find module` | 缺少依赖 | `npm install <模块名>` |
| `hexo-renderer-pug error` | Pug 编译失败 | 检查 `layout.pug` 语法；确认 `hexo7-pug-fix` 已安装 |
| `ENOENT: no such file` | 文件路径错误 | 检查 `scripts/` 下的 `require` 路径 |
| `stylus render error` | CSS 编译失败 | 见 [§5 CSS 编译失败](#5-css-编译失败) |

**Step 3**：手动触发 CI 重试

1. 进入 Actions 页面
2. 点击「Wiki-Hexo 自动部署」
3. 点击右侧「...」→「Re-run all jobs」

**Step 4**：本地复现 CI 环境

```powershell
# 清理后重新构建
hexo clean
npm install
node scripts/wiki-to-hexo.js
hexo generate
```

---

## 4. wiki-chat 侧边栏没生效

**症状**：页面右下角没有出现 🔵 AI 对话按钮。

### 排查步骤

**Step 1**：检查 JS 是否加载

在浏览器 Console 中执行：

```javascript
document.querySelector('.footer-credit a')?.innerHTML
```

- 返回 `<span>...</span>` → JS 正常 ✅
- 返回带 `<br>` 或普通文本 → JS 未生效 ❌

**Step 2**：检查 JS 文件是否存在

访问以下 URL，确认返回 200：
- `https://mornikar.github.io/js/wiki-chat.js`
- `https://mornikar.github.io/js/wikilink.js`

**Step 3**：检查 GitHub Pages 上的 JS 内容

```javascript
// 在 Console 中执行
fetch('/js/wiki-chat.js')
  .then(r => r.text())
  .then(t => console.log(t.substring(0, 200)))
```

确认文件内容是最新的（不是旧版本）。

**Step 4**：检查 CSS 文件

访问 `https://mornikar.github.io/css/arknights.css`，确认包含 wiki-chat 相关样式。

---

## 5. AI 助手对话失败

**症状**：AI 助手显示但无法发送消息，或收到错误回复。

### 5.1 检查接入方式

确认当前配置的接入方式与实际需求匹配：

| 模式 | 配置位置 | 检查项 |
|------|----------|--------|
| Dify | 登录页 / 设置面板 | Dify 服务是否运行 |
| 在线 API | 登录页 / 设置面板 | Cloudflare Worker 是否可用 |
| 直连模型 | 登录页 / 设置面板 | LM Studio 是否运行 |

### 5.2 检查 API 配置

**Step 1**：打开登录页 `/login/`

**Step 2**：检查当前接入模式配置

**Step 3**：验证各项参数：
- API 地址是否正确
- API 密钥是否有效
- 模型名称是否匹配

### 5.3 检查 CORS 问题

如果是在线 API 模式出现跨域错误：

1. 确认使用 Cloudflare Worker 代理
2. 检查代理地址是否正确
3. 验证 Worker 是否正常响应

```javascript
// 测试代理
fetch('https://dify-proxy.1548324254.workers.dev/health')
  .then(r => r.json())
  .then(console.log)
```

### 5.4 检查浏览器 Console

1. 按 F12 打开 DevTools
2. 切换到 Console 面板
3. 查看是否有错误信息

常见错误：
- `Failed to fetch` — 网络问题或 CORS
- `401 Unauthorized` — API 密钥错误
- `404 Not Found` — API 地址错误

### 5.5 常见问题解决

| 问题 | 原因 | 解决 |
|------|------|------|
| 发送消息无响应 | 服务未启动 | 启动 Dify / LM Studio |
| CORS 错误 | 跨域限制 | 使用在线 API 模式 |
| 401 错误 | API 密钥错误 | 检查并更新密钥 |
| 回复乱码 | 模型编码问题 | 更换模型或调整配置 |

---

## 6. CSS 样式不完整

**症状**：`arknights.css` 体积很小（几 KB），WikiLink、wiki-chat 样式丢失。

**原因**：`hexo-renderer-stylus` 已从依赖中移除，Stylus 源文件不会被自动编译进 `arknights.css`。

**解决方案**

`compile_css.js` 在 CI 中独立运行（`hexo generate` 后），本地也通过 Hexo `after_generate` hook 自动触发：

```powershell
# 本地手动触发
node scripts/compile_css.js
```

验证编译成功：检查 `public/css/arknights.css` 是否存在且 > 50KB。

---

## 7. Pug 渲染错误

**症状**：页面空白或显示 `500 Internal Server Error`。

### 排查步骤

**Step 1**：检查 `hexo7-pug-fix` 是否生效

```powershell
# 检查 patch 文件是否存在
dir themes/arknights/scripts/

# 检查 node_modules 中是否被 patch
findstr /s "page" node_modules/hexo-renderer-pug/lib/pug.js | findstr "compile"
```

**Step 2**：检查 `layout.pug` 语法

```pug
// 正确写法：使用 page 局部变量
- const _page = page || {}
if _page.title
  title= _page.title + ' | ' + config.title

// 错误写法：直接调用 is_post()
// 原因：pug 的 extends 链里 helpers 变量注入有作用域限制
//- title= is_post() ? page.title + ' | ' + config.title : config.title
```

**Step 3**：本地测试

```powershell
hexo clean
hexo generate
hexo server
# 访问 http://localhost:4000 确认页面正常
```

---

## 8. GitHub Pages 404

**症状**：访问 `mornikar.github.io` 或 `/docs/` 返回 404。

### 排查步骤

**Step 1**：确认 GitHub Pages 配置

```bash
gh api repos/mornikar/mornikar.github.io/pages
```

确认返回：
```json
{
  "source": { "branch": "main", "path": "/" }
}
```

如果显示 `gh-pages` 或其他分支，需要切换（见 [BRANCHES.md](/docs/BRANCHES/)）。

**Step 2**：确认 CI 已成功推送

1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 确认最新的 workflow 显示 ✅
3. 打开 https://github.com/mornikar/mornikar.github.io/tree/main，确认文件存在

**Step 3**：检查 Pages 构建状态

GitHub Settings → Pages页面显示 `built` 即为正常。如果显示 `deploying`，等待 2-3 分钟。

---

## 10. Dify 无法访问

**症状**：http://localhost/v1 无法打开。

### 排查步骤

**Step 1**：检查 Docker Desktop 是否运行

1. 打开 Docker Desktop 应用
2. 确认状态显示「Running」
3. 确认 Dify 容器在运行：`docker ps | findstr dify`

**Step 2**：重启 Dify 容器

```powershell
docker restart $(docker ps -q --filter "name=dify")
# 或
docker-compose -f D:\path\to\dify\docker-compose.yml restart
```

**Step 3**：检查端口占用

```powershell
netstat -ano | findstr ":80 "
```

确认没有其他程序占用 80 端口。

**Step 4**：检查容器日志

```powershell
docker logs $(docker ps -q --filter "name=dify" | head -1) --tail 50
```

---

## 9. Giscus 评论不显示

**症状**：文章底部没有 Giscus 评论区。

### 排查步骤

**Step 1**：检查配置是否启用

确认 `themes/arknights/_config.yml` 中 giscus 已启用：

```yaml
giscus:
  enable: true
```

**Step 2**：检查 Giscus App 安装

1. 打开 https://github.com/apps/giscus
2. 确认 App 已安装到你的仓库
3. 如果未安装，点击 "Install" 并授权

**Step 3**：检查 Discussions 功能

1. 进入仓库 Settings → Features
2. 确认 Discussions 已勾选开启
3. 如果未开启，勾选并确认

**Step 4**：检查浏览器 Console

1. 打开博客文章页面
2. 按 F12 打开 DevTools
3. 切换到 Console 面板
4. 刷新页面，查看是否有 Giscus 相关错误

**Step 5**：检查网络请求

1. DevTools → Network 面板
2. 筛选 `giscus.app` 请求
3. 确认请求成功返回（无 CORS 错误）

### 常见错误及解决

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `404 Not Found` | repo_id 或 category_id 错误 | 重新从 giscus.app 获取 |
| `403 Forbidden` | Giscus App 未安装 | 安装 Giscus App |
| `Discussions disabled` | Discussions 未开启 | 仓库 Settings 开启 Discussions |
| 页面空白 | 仓库非公开 | 将仓库设为 Public |

---

## 11. Live2D 看板娘问题

**症状**：看板娘不显示、设置页关闭后消失、移动端无法加载。

### 排查步骤

**Step 1**：确认版本

v8.5 及之前版本存在两个已知 Bug：
- 设置页关闭(✕)按钮后看板娘消失 — v8.6 已修复
- 移动端(screen.width < 768)跳过 Live2D 初始化 — v8.6 已修复

更新到 v8.6+ 即可解决。

**Step 2**：检查 Live2D 是否加载

在浏览器 Console 中执行：
```javascript
document.querySelector('#waifu') ? 'Live2D 已加载' : 'Live2D 未加载'
```

**Step 3**：移动端确认

- 移动端看板娘在 Wiki 聊天面板内显示，不在页面左下角浮动
- 打开聊天面板即可看到看板娘区域

**Step 4**：检查浏览器 Console 错误

常见错误：
- `CubismCore not found` — live2dcubismcore.js 加载失败
- `model3.json 404` — 模型文件路径错误
- `Canvas is already in use` — 重复初始化

---

## 12. 联系方式

如果以上方法都无法解决问题：

1. **查看 CI 日志**：https://github.com/mornikar/mornikar.github.io/actions
2. **查看 Wiki 日志**：`.wiki/log.md`
3. **搜索已知问题**：检查本文档其他章节是否已有记录
4. **联系维护者**：通过 GitHub Issue 反馈

---

## 13. URL 异常（双横线/转义字符）

**症状**：文章 URL 中出现 `--`（双横线）、`\_`（下划线转义）、首尾多余横线。

**示例**：
- ❌ `/2026/04/18/LearningNote/2026-04-18--Matplotlib基础-/`
- ✅ `/2026/04/18/LearningNote/2026-04-18-Matplotlib基础/`

### 排查步骤

**Step 1**：确认 wiki-to-hexo.js 版本

```powershell
# 检查脚本头部版本号
Get-Content scripts/wiki-to-hexo.js -TotalCount 5 | Select-String "version"
```

版本应为 **v4.2+**。旧版本的 `slugify()` 不清洗首尾横线和下划线。

**Step 2**：强制重新生成

```powershell
# --force 会自动清理含双横线的旧文件
node scripts/wiki-to-hexo.js --force
```

**Step 3**：重建 Hexo

```powershell
npx hexo clean
npx hexo generate
```

**Step 4**：验证 wiki-index.json

```powershell
# 检查 URL 字段是否干净
Select-String -Path source/wiki-index.json -Pattern '"url":' | Select-String "\-\-|\\_"
```

如果输出为空，说明所有 URL 已修复。

**Step 5**：推送部署

```powershell
git add -A
git commit -m "fix: URL卫生修复"
git push origin source
```

### 根因

| 问题 | 根因 | v4.2 修复 |
|------|------|-----------|
| 双横线 `--` | parseFrontmatter 不去引号 → slugify 输入含引号 | 自动去引号 |
| 尾横线 `-` | slugify 不去首尾横线 | 自动去首尾横线 |
| `\_` 转义 | title 中含 `_` 但未转 `-` | 自动 `_` → `-` |

---

## 14. WikiLink 跳转 404

**症状**：点击 WikiLink `[[页面名]]` 跳转后显示 404。

### 排查步骤

**Step 1**：确认 wiki-index.json 存在且格式正确

```javascript
// 浏览器 Console 执行
fetch('/wiki-index.json').then(r => r.json()).then(d => console.log(d.length, 'entries'))
```

**Step 2**：确认目标页面在索引中

```javascript
// 搜索目标页面
fetch('/wiki-index.json').then(r => r.json()).then(d => d.filter(e => e.title.includes('搜索词')).forEach(e => console.log(e.title, e.url)))
```

**Step 3**：检查 URL 格式

URL 应为 `/YYYY/MM/DD/Category/YYYY-MM-DD-标题/` 格式，不能有双横线或转义字符。

**Step 4**：清浏览器缓存

v4.2 更改了 WikiLink 的 URL 来源（从客户端计算改为读取 wiki-index.json），旧缓存的 wiki-chat.js 可能还在用旧逻辑。

| 操作 | 快捷键 |
|------|--------|
| 强制刷新 | `Ctrl + Shift + R` |
| 清所有缓存 | Settings → Clear browsing data |

### 根因

| 版本 | URL 来源 | 一致性 |
|------|---------|--------|
| v4.0-v4.1 | wiki-chat.js 客户端 slugify(title) | ❌ 可能和服务端不一致 |
| **v4.2** | **wiki-index.json 的 url 字段** | ✅ 单一数据源 |

---

## 15. CMS 保存 wiki 文件格式错误

**症状**：在 CMS 中编辑 `.wiki/` 下的文件后，保存时被额外包装了 Hexo 格式的 frontmatter。

**示例**：
```yaml
# 错误：wiki 文件被双重包装
---
title: 页面标题
date: 2026-04-25  # ← 不应该有，wiki 文件用 created/updated
category: xxx      # ← 不应该有
tags: [...]
---
---
title: 页面标题    # ← 这是原始 wiki frontmatter
type: concepts
tags: [...]
created: 2026-04-25
updated: 2026-04-25
---
```

### 排查步骤

**Step 1**：确认 CMS 版本

访问 `https://mornikar.github.io/admin/`，检查是否能看到 Wiki 集合（📚 Wiki 概念、✍️ Wiki 随笔等）。

如果没有 Wiki 集合，说明 CMS 版本过旧。

**Step 2**：确认保存的文件内容

在 GitHub 上查看对应文件，确认 frontmatter 格式正确。

**Step 3**：手动修复

如果文件已被错误包装，删除多余的 Hexo frontmatter 块，只保留 wiki 格式的 frontmatter。

### 预防

v4.2 的 CMS 会根据集合类型自动选择保存逻辑：
- **Posts 集合**：自动包装 Hexo frontmatter
- **Wiki 集合**：原样保存，不包装

---

## 16. PDF 资源未更新 / assets-archive 页面白色字无法打开

**症状**：
- 推送了 `.wiki/raw/assets/` 下的 PDF/图片文件后，`https://mornikar.github.io/assets-archive/` 页面显示白色字或链接无法打开
- 新文件（如"爱泼斯坦案"文件夹）没有出现在资源存档页面
- 直接访问 PDF URL 返回 404

**根本原因**：
1. **`.wiki/raw/assets/` 下的文件必须先提交到 git，CI 才会处理** — 未提交的文件不会被 CI 检测到
2. **`public/assets/` 是构建产物，不应该手动提交** — 它被 `.gitignore` 忽略，每次 CI 构建时由 `copy-assets.js` 自动生成
3. **`source/assets-archive.md` 是 Hexo 文章，由 `copy-assets.js` 自动生成** — 手动编辑会被覆盖

### 正确流程（一步到位）

```powershell
# Step 1: 把 PDF/图片文件放进 .wiki/raw/assets/ 目录
# 示例：.wiki/raw/assets/爱泼斯坦案/Jeffrey Epstein Part 12 of 12.pdf

# Step 2: 提交到 git（触发 CI）
git add .wiki/raw/assets/
git commit -m "docs: 添加 XXX PDF 资源"
git push origin source

# Step 3: 等待 CI 自动完成（2-5 分钟）
# CI 会自动执行：
#   ├─ hexo generate
#   ├─ copy-assets.js（复制 PDF 到 public/assets/）
#   ├─ 生成 source/assets-archive.md（更新存档页面）
#   └─ 部署到 GitHub Pages
```

### 本地调试（可选）

如果需要立即验证效果，可以本地运行 `copy-assets.js`：

```powershell
# 复制 PDF 到 public/assets/ 并生成 assets-archive.md
node scripts/copy-assets.js

# 验证文件已复制
dir public\assets\爱泼斯坦案\

# 验证存档页面已生成
Get-Content source\assets-archive.md

# 本地预览
hexo server
# 访问 http://localhost:4000/assets-archive/
```

> ⚠️ **注意**：本地生成的 `public/assets/` 和 `source/assets-archive.md` 需要提交到 git，CI 才会重新构建并部署到线上。

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 页面白色字/链接无效 | PDF 未复制到 public/assets/ | 运行 `node scripts/copy-assets.js` |
| 新文件没出现在存档页 | assets-archive.md 未更新 | 运行 `node scripts/copy-assets.js` |
| CI 不处理新 PDF | 文件未提交到 git | `git add .wiki/raw/assets/ && git push` |
| 直接访问 PDF 返回 404 | 文件未部署到 GitHub Pages | 等待 CI 构建完成（2-5 分钟） |

### 架构说明

```
.wiki/raw/assets/          # 源文件（你手动添加 PDF 的地方）
    ↓ git push
CI 自动触发
    ├─ hexo generate
    ├─ copy-assets.js ← 扫描 .wiki/raw/assets/
    │   ├─ 复制所有 .pdf/.png/.jpg 到 public/assets/
    │   └─ 生成 source/assets-archive.md（存档页面）
    └─ 部署 public/ 到 GitHub Pages
    ↓
https://mornikar.github.io/assets-archive/  # 在线资源存档
https://mornikar.github.io/assets/XXX.pdf    # 直接访问 PDF
```

### 铁律

1. **添加 PDF 只需一步**：放进 `.wiki/raw/assets/` → `git add && git push` → CI 自动处理
2. **不要手动编辑 `public/assets/`** — 这是构建产物，会被 CI 覆盖
3. **不要手动编辑 `source/assets-archive.md`** — 这是 `copy-assets.js` 自动生成的
4. **文件必须先提交到 git** — 未提交的文件 CI 不会处理
5. **CI 构建需要 2-5 分钟** — 推送后耐心等待，不要重复推送

### 2026-05-17 新增：存档页链接显示为白色纯文本（无法点击）

**症状**：
- 资源存档页面中，包含中文字符的 PDF 链接显示为白色纯文本，无法点击
- 例如：`[Jeffrey Epstein Part 12 of 12.pdf](/assets/爱泼斯坦案/Jeffrey Epstein Part 12 of 12.pdf)` 而不是 `<a href="/assets/...">Jeffrey Epstein Part 12 of 12.pdf</a>`

**根本原因**：
- `copy-assets.js` 生成 `assets-archive.md` 时，URL 中包含未编码的中文字符
- Hexo 的 `hexo-renderer-marked` v6.0.0 调用 `marked` 库解析 Markdown 链接语法时，无法正确识别包含未编码中文字符的 URL
- 导致链接语法被解析为纯文本，而非 `<a>` 标签

**修复方案**：
- 在 `copy-assets.js` 第 131 行生成 Markdown 时，使用 `encodeURI()` 预编码 URL
- `encodeURI()` 会将中文字符转换为 URL 编码格式：`爱泼斯坦案` → `%E7%88%B1%E6%B3%BC%E6%96%AF%E5%9D%A6%E6%A1%88`
- 这样 `marked` 就能正确识别链接语法，并渲染成 `<a>` 标签

```javascript
// copy-assets.js 第 131 行
`| ${iconMap[f.ext] || '📄'} | [${f.name}](${encodeURI(f.url)}) | ${f.sizeStr} |`
```

**为什么用 `encodeURI()` 而不是 `encodeURIComponent()`**：
- `encodeURI()` 保留 URL 中的特殊字符（如 `:`、`/`），只编码非 ASCII 字符
- `encodeURIComponent()` 会编码所有特殊字符，包括 `:` 和 `/`，导致 URL 失效

**验证方法**：
```powershell
# 检查 assets-archive.md 中的链接是否已编码
Get-Content source\assets-archive.md | Select-String "%E7"

# 如果输出包含 %E7 开头的字符串，说明已正确编码
```

**铁律**：
1. **生成 Markdown 链接时，URL 必须预编码** — 使用 `encodeURI()` 处理包含非 ASCII 字符的 URL
2. **不要手动编辑 `assets-archive.md`** — 每次 `hexo generate` 时由 `copy-assets.js` 自动生成
3. **`encodeURI()` ≠ `encodeURIComponent()`** — 前者保留 URL 结构字符，后者会破坏 URL
