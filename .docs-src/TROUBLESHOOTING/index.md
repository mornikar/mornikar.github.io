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

## 11. 联系方式

如果以上方法都无法解决问题：

1. **查看 CI 日志**：https://github.com/mornikar/mornikar.github.io/actions
2. **查看 Wiki 日志**：`.wiki/log.md`
3. **搜索已知问题**：检查本文档其他章节是否已有记录
4. **联系维护者**：通过 GitHub Issue 反馈
