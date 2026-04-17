---
title: 问题与解决方案
date: 2026-04-17 11:00:00
type: docs
---

# 问题与解决方案手册

> 记录 LLM Wiki + Hexo 项目 Phase 1-6 中遇到的所有问题、解决思路和最终方案。
> 目的：同类问题不再踩坑，有据可查。

---

## 目录

1. [Wiki → Hexo 转换](#1-wiki--hexo-转换)
2. [Hexo Pug 模板渲染](#2-hexo-pug-模板渲染)
3. [Stylus CSS 编译](#3-stylus-css-编译)
4. [GitHub Pages + CI 部署](#4-github-pages--ci-部署)
5. [Dify + LM Studio 插件](#5-dify--lm-studio-插件)
6. [Docker Desktop](#6-docker-desktop)
7. [OpenClaw AI Agent](#7-openclaw-ai-agent)
8. [Wiki AI 对话（wiki-chat.js）](#8-wiki-ai-对话wiki-chatjs)

---

## 1. Wiki → Hexo 转换

### 1.1 WikiLink 链接无法匹配

**现象：** `[[文章标题]]` 转换后链接失效，页面找不到。

**原因：** 链接目标页面可能存在大小写差异、别名差异，或路径前缀不匹配。

**解决：** wiki-to-hexo.js v4.0 实现 4 级 fallback 策略：
1. **精确匹配** — 按 title 直接查找
2. **大小写模糊** — 忽略大小写匹配（Windows/macOS 文件系统大小写不敏感）
3. **前缀模糊** — 取 WikiLink 关键词前缀，去 `.wiki/` 下匹配所有文件名包含关键词的
4. **降级路径** — 完全匹配不到时，转为指向根路径的链接

```javascript
// scripts/wiki-to-hexo.js 核心逻辑
function resolveWikiLink(title) {
  // 1. 精确
  if (fileMap[title]) return fileMap[title]
  // 2. 大小写
  const lower = title.toLowerCase()
  const match = Object.entries(fileMap).find(([k]) => k.toLowerCase() === lower)
  if (match) return match[1]
  // 3. 前缀模糊
  const keyword = title.split(/[/\-|:]/)[0]
  // 4. 降级
  return null
}
```

---

### 1.2 Hexo generate 生成 0 文件

**现象：** `hexo generate` 成功执行，但 `public/` 目录下没有任何文章文件。

**原因：** frontmatter 的 `date` 字段格式错误。Hexo 要求 `YYYY-MM-DD HH:mm:ss`，不能用 `YYYY/MM/DD`。

**解决：** wiki-to-hexo.js 在写入 frontmatter 前统一格式化日期：
```javascript
const dateStr = `${meta.created.substring(0, 10)} 00:00:00`
```
手动修复：检查 `.wiki/` 下的 `.md` 文件，确保 frontmatter 使用 `YYYY-MM-DD` 格式。

---

### 1.3 CI 中多路召回触发 tool_calls 导致 400 错误

**现象：** Dify 应用启用知识库后，任何对话都返回 `400 | tool_calls is not valid`。

**根因：** Dify LM Studio 插件 SDK（`dify_plugin/interfaces/model/openai_compatible/llm.py`）使用 Pydantic v2，但代码调用了 v1 方法 `.dict()`，Pydantic v2 中该方法已移除。

**解决：** 直接修改 Docker 容器内的 SDK 文件：
```bash
# 进入插件守护进程容器
docker exec -it docker-plugin_daemon-1 bash

# 找到问题文件
find /app/storage -name "llm.py" -path "*/openai_compatible/*"

# 修改第 725 行
sed -i 's/\.dict()/.model_dump()/g' <file_path>

# 清除 Python 字节码缓存
find . -name "__pycache__" -exec rm -rf {} +
find . -name "*.pyc" -delete

# 重启容器使改动生效
docker restart docker-plugin_daemon-1
```

**回滚：** 重新运行 sed 改回 `.dict()`，重启即可恢复。

---

### 1.4 改动后错误仍然存在

**现象：** 已修改 `.dict()` → `.model_dump()`，但重启后错误依旧。

**原因：** Python 有 `.pyc` 字节码缓存，源文件改了但旧字节码仍在内存/磁盘中。

**解决：** 必须同时清除两处缓存：
1. 项目目录的 `__pycache__`
2. venv 的 `site-packages/` 下的 `__pycache__`

然后重启容器，让 Python 重新导入模块。

---

## 2. Hexo Pug 模板渲染

### 2.1 Pug 模板 `is_post()` 等函数报错

**现象：** 部署到 CI 时，`layout.pug` 中 `is_post()`、`is_page()` 等函数报 `is not defined`。

**原因：** Hexo 7 的 `_buildLocals` 把 frontmatter 字段扁平化为 `locals` 顶层 key，但 pug-runtime 的 `compile()` 调用时需要手动注入 `page` 对象。pug 的 `extends` 链里 helper 函数的作用域注入有限制。

**解决（两次 patch）：**

**Patch 1 — hexo-renderer-pug 源码（`node_modules/hexo-renderer-pug/lib/pug.js`）：**
在 `compile()` 调用前注入 `page` 对象：
```javascript
// node_modules/hexo-renderer-pug/lib/pug.js
const _compile = pug_runtime.compile
pug_runtime.compile = function (template, options) {
  if (options && options.locals && !options.locals.page) {
    options.locals.page = {}
  }
  return _compile.call(this, template, options)
}
```

**Patch 2 — `layout.pug` 模板本身：**
不依赖 pug extends 链注入的 `is_post()` 裸函数，改为直接用 pug 注入的 `page` 局部变量：
```pug
// ❌ 错误：is_post() 在 extends 链中不可用
- if (is_post())

// ✅ 正确：用 page 局部变量
- const _page = page || {}
- const isPost = _page.layout === 'post'
- if (isPost)
```

---

## 3. Stylus CSS 编译

### 3.1 CI 中 hexo-renderer-stylus 无法解析多级 @import

**现象：** 本地构建正常，CI 中 `hexo generate` 后 CSS 为空或只有单层。

**原因：** `hexo-renderer-stylus` 处理 `@import '_modules/modules'` 时，不会递归处理 `modules.styl` 中的二级 `@import 'wiki-chat'`。

**排查过程：** 本地 `.stylusrc.js` 的 `include` 路径在 CI 中不生效（CI 用 `npm install --production` 没有 devDependencies）。

**解决（两步）：**

**Step 1 — 删除 `.gitignore` 中的 `css/` 行：**
`wikilink.styl` 从未被提交到 git（被 `.gitignore` 的 `css/` 规则忽略）。删除该行后 `wikilink.styl` 才真正入库。

**Step 2 — CI 中手动编译 CSS：**
在 `deploy.yml` 的 `hexo generate` 之后，添加 `scripts/compile_css.js`：
```yaml
- name: Compile Stylus CSS
  run: node scripts/compile_css.js
```
该脚本递归解析所有 `.styl` 文件的 `@import`，合并输出到 `public/css/`。

---

### 3.2 wikilink.styl 文件从未被提交

**现象：** 明明创建了 `stylus/_modules/wikilink.styl`，但 CI 找不到。

**原因：** `.gitignore` 中有 `css/` 规则（排在 `public/` 之后），把所有 `css/` 目录和文件都忽略了，包括 `stylus/` 下的源文件。

**解决：** 检查 `.gitignore` 规则，确认 `css/` 在 `public/` 之后不会被其他模式覆盖。用 `git check-ignore -v` 排查。

---

## 4. GitHub Pages + CI 部署

### 4.1 GitHub Pages 部署返回 403

**现象：** workflow 运行成功，但 Pages 访问返回 403 或 404。

**解决（两个条件必须同时满足）：**

**① workflow 必须声明写权限：**
```yaml
permissions:
  contents: write
```

**② Pages 服务分支不能是仓库默认分支：**
- 在 GitHub Settings → Pages → Source 设为 `gh-pages` 分支
- 仓库默认分支（通常是 `main`/`master`）不能同时是 Pages 源

---

### 4.2 Hexo 嵌套 git 仓库导致 Actions 路径问题

**现象：** CI 中 `cache-dependency-path` 找不到，或 git 命令在嵌套仓库中行为异常。

**原因：** Hexo 博客是 `mornikar.github.io` 仓库的子目录，本身也是 git 仓库，形成嵌套结构。

**解决：** deploy.yml 中移除 `cache-dependency-path` 和 `working-directory`，改用 `run: |` 多行命令在 Hexo 子目录内执行。

---

### 4.3 pagefind 搜索索引构建失败

**现象：** `pagefind --site public` 找不到文件。

**原因：** `_config.yml` 中 `public_dir: ..` 把 Hexo 输出到仓库根目录（而不是 `public/`），pagefind 默认去 `public/` 找当然失败。

**解决：**
1. `public_dir` 保持 `..`（以便 `peaceiris/actions-gh-pages` 推送）
2. CI 中手动指定：`pagefind --site public`（从 Hexo 子目录运行时 `public` 目录存在）
3. 或 CI 中添加步骤将 Hexo 输出复制到 `public/` 目录

---

### 4.4 CI 推送触发 workflow 自身不运行

**现象：** `deploy.yml` 本身修改后推送到 GitHub，workflow 没有被触发。

**解决：** 在 workflow 的 `on.push.paths` 中加入 `.github/workflows/**`，使 workflow 文件变更也能触发自身。

---

## 5. Dify + LM Studio 插件

### 5.1 LM Studio 推理报 tool_calls 错误

详见 [§1.3](#13-ci-中多路召回触发-tool_calls-导致-400-错误)。

---

### 5.2 blocking 模式超时，streaming 正常

**现象：** Dify API 的 `response_mode=blocking` 超时（约 2 分钟），但 `streaming` 模式正常返回。

**分析：** 流式模式下 Dify 边推理边输出 chunk，处理完即结束。blocking 模式需要等待所有 chunk 处理完毕再做额外操作（如 Rerank、结果聚合），在本地 LM Studio 推理较慢时容易超时。

**解决：** wiki-chat.js 使用流式模式（SSE），不受影响。如果需要在 Dify 调试页测试，用流式模式。

---

### 5.3 插件容器重启后改动丢失

**现象：** 在 Docker 容器内修改了 SDK 文件，重启容器后改动恢复。

**原因：** Docker 容器文件系统是非持久化的（除非用 volume mount）。

**解决：** 修改源码后，立即将改动记录到本文档或项目脚本中。若需要持久化，改用 volume mount 覆盖容器内路径，或修改挂载到 host 的配置文件。

---

## 6. Docker Desktop

### 6.1 汉化包导致 Docker Desktop 无法启动

**现象：** 替换 `resources/app.asar` 后，Docker Desktop 启动界面闪退。

**原因：** 第三方汉化包（`asxez/DockerDesktop-CN`）基于旧版本 asar，与当前 Docker Desktop 版本（4.68.0）的后端不兼容。

**解决：**
```powershell
# 恢复原版 asar
Copy-Item "D:\Auxiliary_means\Docker\app-original-4.68.0.asar" `
         "C:\Program Files\Docker\Docker\resources\app.asar" -Force

# 删除配置中的语言设置
# C:\Users\Q\.docker\config.toml 中的 language = zh-CN 已失效，可保留
```

**教训：** 等待汉化包更新到对应版本再尝试，或用管理员 PowerShell 手动汉化字符串资源。

---

### 6.2 Docker 镜像源配置不生效

**现象：** 修改 `daemon.json` 中的 `registry-mirrors` 后，拉取镜像仍然很慢。

**原因：** Docker Desktop 启动时从自身 GUI 配置读取 daemon 设置，直接修改 `daemon.json` 不会立即生效。

**解决：** 必须通过 Docker Desktop GUI 操作：
1. 打开 Docker Desktop → Settings → Docker Engine
2. 在编辑器中粘贴完整的 `daemon.json` 配置
3. 点 **Apply & Restart**

验证：`docker info | findstr "Mirrors"` 确认镜像源已加载。

---

## 7. OpenClaw AI Agent

### 7.1 npm 安装后找不到 `openclaw` 命令

**现象：** `npm install -g openclaw` 成功，但命令行输入 `openclaw` 提示找不到命令。

**原因：** OpenClaw 的 `package.json` 没有配置 `.bin` 字段导出命令入口，或安装路径不在 PATH 中。

**解决：** 手动创建命令入口：
```cmd
::: 在 C:\Users\Q\AppData\Roaming\npm\openclaw.cmd
@echo off
node "C:\Users\Q\AppData\Roaming\npm\node_modules\openclaw\openclaw.mjs" %*
```

---

### 7.2 openclaw.json 配置 systemPrompt 导致启动失败

**现象：** `openclaw gateway` 启动时报 `Config invalid`，配置读取失败。

**原因：** `openclaw.json` 不支持 `systemPrompt` 字段（可能已被移除或改名）。

**解决：** 从 `openclaw.json` 中删除 `systemPrompt` 字段，重启 Gateway。

---

### 7.3 claw-sama 插件版与 OpenClaw 版本不兼容

**现象：** claw-sama 有独立版和 OpenClaw 插件版，插件版在 OpenClaw 2026.3.23 上无法加载。

**原因：** OpenClaw API（`plugin-sdk/compat` 路径）在版本间发生变化，插件的 SDK 引用路径失效。

**解决：** 使用独立版 `claw-sama.exe`（功能完整），不依赖 OpenClaw 插件系统。

---

### 7.4 Gateway 在 Windows 上无法用信号重启

**现象：** Linux 上可以用 `kill -USR1 <pid>` 优雅重启 Gateway，Windows 无效。

**原因：** Windows 不支持 POSIX 信号（如 `SIGUSR1`）。

**解决：** 用 Windows 原生命令重启：
```powershell
taskkill /F /PID <pid>
Start-Process powershell -ArgumentList "-NoExit", "-Command", "openclaw gateway" -WindowStyle Normal
```

---

## 8. Wiki AI 对话（wiki-chat.js）

### 8.1 公网穿透方案选择

**历程：**

| 方案 | 结果 | 原因 |
|------|------|------|
| localtunnel | ❌ 弃用 | 每次启动 URL 变化，不稳定 |
| Cloudflare Tunnel | ❌ 弃用 | DNS 被墙，国内无法访问 |
| Tailscale | ✅ 成功 | 固定域名，GitHub 账号通行 |

**Tailscale 部署步骤：**
1. 电脑安装 Tailscale → Settings → Run as service → 用 GitHub 账号登录
2. 手机安装 Tailscale → 用同一 GitHub 账号登录（同一 Tailnet）
3. 固定域名：`mornikar.tail7ee4f8.ts.net`（在 Tailscale 设置中申请 MagicDNS 子域名）

---

### 8.2 SSE 流式响应处理踩坑

**问题 1 — 连接断开但 Worker 仍在处理：**
Dify SSE 连接断开后，后端推理仍在继续，导致下一条消息复用旧响应。

**解决：** wiki-chat.js 使用 `closing` 标志 + `controller.close()` 主动中断，避免事件污染。

**问题 2 — 重复事件 ID 导致 Worker 逻辑执行多次：**
SSE 重连时服务器可能重复发送相同 `eventId`，`lastEventId` 去重失效。

**解决：** 使用 `Set` 记录已处理的 `eventId`，每次处理前检查：
```javascript
if (processedIds.has(eventId)) continue
processedIds.add(eventId)
```

**问题 3 — context 溢出导致回复质量下降：**
长对话积累历史消息，LM Studio context 爆掉。

**解决：** `MAX_TURNS = 4` 限制对话轮数，溢出时清空 Worker 重置。

---

### 8.3 移动端样式适配

**问题：** wiki-chat 侧边栏在手机上与底部固定按钮 z-index 冲突。

**解决：** 在 `wiki-chat.css` 中明确设置侧边栏 `z-index` 高于底部按钮，并用 `@media (max-width: 768px)` 适配移动端。

---

## 踩坑经验速查

| 场景 | 经验 |
|------|------|
| Docker 容器内改 Python 代码无效 | 清除 `__pycache__` + 重启容器 |
| CI 中 hexo generate 0 文件 | 检查 frontmatter `date` 格式 |
| GitHub Pages 403 | 确认 `permissions: write` + Pages 非默认分支 |
| Stylus 多级 @import CI 失败 | 手动编译 CSS，或删除 `.gitignore` 中 `css/` |
| 推送不触发 CI | 检查 `.github/workflows/**` 是否在 paths 中 |
| Dify streaming 正常 blocking 超时 | 用流式模式，不影响实际使用 |
| 公网穿透国内 DNS 污染 | 弃用 Cloudflare Tunnel，改用 Tailscale |
| Windows 无 SIGUSR1 | 用 `taskkill` + `Start-Process` 重启进程 |
| npm 全局命令找不到 | 手动创建 `.cmd` 入口脚本 |
| 嵌套 git 仓库 CI 路径异常 | 移除 `cache-dependency-path`，用 cd 进入子目录 |
