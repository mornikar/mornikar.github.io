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
│   ├── AI_CHAT/index.md           #   AI 助手 → /docs/AI_CHAT/
│   ├── GISCUS/index.md            #   Giscus 留言 → /docs/GISCUS/
│   ├── MAINTENANCE/index.md       #   维护指南 → /docs/MAINTENANCE/
│   ├── TROUBLESHOOTING/index.md  #   故障排查 → /docs/TROUBLESHOOTING/
│   └── MIGRATION/index.md        #   迁移规范 → /docs/MIGRATION/
│
├── source/                         # Hexo 源文件
│   ├── _posts/                    #   博客文章（由 wiki-to-hexo.js 生成）
│   │   ├── LearningNote/
│   │   └── LearningEssays/
│   └── docs/                      #   项目文档 HTML（由 build_docs_html.js 生成）
│
├── themes/arknights/               # 明日方舟风格主题（fork）
│   ├── layout/                    #   Pug / EJS 模板
│   │   ├── includes/layout.pug   #   主布局（script 集中管理）
│   │   ├── post.pug              #   文章页
│   │   ├── page.pug              #   页面页
│   │   ├── index.pug             #   主页
│   │   ├── login.pug             #   登录页路由
│   │   └── custom/
│   │       ├── wiki-login.ejs    #   登录页内容模板
│   │       └── wiki-chat-btn.ejs #   AI 对话按钮模板
│   ├── scripts/                   #   主题脚本（含 hexo7-pug-fix）
│   └── source/
│       ├── css/                  #   样式文件
│       │   ├── arknights.styl    #   主样式
│       │   ├── wikilink.styl     #   WikiLink 高亮
│       │   ├── wiki-badge.styl   #   Wiki 徽章
│       │   ├── wiki-source.styl  #   Wiki 来源标注
│       │   ├── _custom/
│       │   │   ├── wiki-chat.styl  #   AI 对话面板样式
│       │   │   └── wiki-login.styl #   登录页样式（赛博雨幕 + 战术面板）
│       │   └── _page/post/post.styl # 文章页样式
│       ├── js/
│       │   ├── wiki-chat.js      #   AI 对话面板逻辑 + TTS 朗读
│       │   ├── wiki-login.js     #   登录页逻辑（特效 + 配置）
│       │   └── wikilink.js       #   WikiLink 交互
│       └── live2d/               #   🐱 Live2D 看板娘模块
│           ├── live2d.js          #   Live2D 主入口
│           ├── Core/              #   核心引擎
│           │   └── waifu-tips.js  #   工具栏（换模型、换音色、换装）
│           ├── chatCore/          #   AI 对话核心
│           │   └── waifu-chat.js  #   对话逻辑 + TTS 朗读
│           └── model/             #   Live2D 模型资源
│               └── ariu/          #   阿丽露模型
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
│  ② npm ci                     │
│  ③ wiki-to-hexo.js            │
│  ④ hexo generate              │
│  ⑤ compile_css.js            │  ← stylus 直接编译（无 hexo-renderer-stylus）
│  ⑥ Pagefind 索引              │
│  ⑦ build_docs_html.js         │  ← .docs-src/*.md → HTML
│  ⑧ cp README.md              │
│  ⑨ upload-pages-artifact      │
│  ⑩ deploy-pages              │  ← Actions 原生 Pages 部署 |
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
| `scripts/compile_css.js` | CSS 编译脚本 |
| `tools/sync-wiki-to-dify.js` | Dify 同步脚本 |
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

### 4.3 Wiki AI 助手系统

> Phase 7+ — 多模块 AI 对话系统，由两套互补的 UI 和一套共享 TTS 组成

#### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      AI 助手系统                              │
│                                                             │
│  ┌──────────────────┐     ┌──────────────────┐             │
│  │  Wiki 聊天面板     │     │  Live2D 看板娘     │             │
│  │  (wiki-chat.js)  │     │  (waifu-chat.js)  │             │
│  │                  │     │                    │             │
│  │  · 右下角悬浮按钮  │     │  · 页面左侧看板娘   │             │
│  │  · 设置面板       │     │  · 对话气泡         │             │
│  │  · Markdown 渲染  │     │  · 工具栏操作       │             │
│  │  · TTS 朗读      │     │  · TTS 朗读        │             │
│  └───────┬──────────┘     └────────┬──────────┘             │
│          │                         │                        │
│          │   共享 localStorage      │                        │
│          │   waifu_tts_settings    │                        │
│          │   wiki-chat-settings    │                        │
│          │                         │                        │
│  ┌───────▼─────────────────────────▼──────────┐             │
│  │              三模式 API 接入                  │             │
│  │                                           │             │
│  │  · Dify RAG → 本地 Dify API               │             │
│  │  · 在线 API → CF Worker 代理 → 远程模型     │             │
│  │  · 直连模型 → 本地 LM Studio               │             │
│  └───────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

#### Wiki 聊天面板（wiki-chat.js）

- **外观**：🔵 蓝色悬浮按钮，位于页面右下角
- **功能**：点击展开 AI 对话界面，支持 Markdown 渲染、TTS 朗读
- **设置面板**：选择接入方式、配置参数、自定义 System Prompt、切换 TTS 音色
- **触发**：Footer 区域的标记 + `layout.pug` 中的 script 加载

#### Live2D 看板娘（waifu-chat.js + waifu-tips.js）

- **模型**：阿丽露（Ariu）moc3 模型
- **功能**：AI 对话气泡、换模型、换装、TTS 音色切换
- **工具栏**：隐藏/显示、换模型、换装、音色选择、聊天开关
- **Script 加载**：`layout.pug` body 尾部，通过 pjax 兼容方式加载

#### 登录页（wiki-login.js + wiki-login.ejs）

- **地址**：`/login/`
- **视觉特效**：
  - 赛博雨幕（Cyber Rain）— 垂直下落的字符流，带尾迹拖影
  - 粒子星云 — 青/品红粒子，鼠标引力交互
  - 扫描线 — CRT 显示器横线扫描
  - 网格线 — 赛博朋克风格网格
  - 战术卡片 — 四角装饰 + 赛博风 UI
- **功能**：配置接入方式、System Prompt、用户名
- **Script 加载**：`layout.pug` body 尾部，条件加载（仅 `/login/` 页面）

#### TTS 朗读系统

两套 UI（Wiki 面板 + Live2D 看板娘）共享 TTS 设置：

| 存储键 | 内容 |
|--------|------|
| `waifu_tts_settings` | `{ enabled: boolean, voice: string }` |
| `wiki-chat-settings` | 完整配置（接入方式 + prompt + TTS 等） |

**音色匹配策略**：
- 存储简短关键字（如 `Yunxi`、`Xiaoxiao`）
- 匹配时用 `includes()` 包含匹配 + Online Natural 优先级排序
- 两个 `speakText()` 在朗读前均从 localStorage 重新同步最新设置

**Chrome SpeechSynthesis 注意事项**：
- `cancel()` 后需 ≥100ms 延迟再 `speak()`，否则后续播放失败
- `getVoices()` 在 Chrome 上异步加载，需 `voiceschanged` 事件或轮询等待

#### 默认人设（System Prompt）

```
你是一个基于 Wiki 知识库的猫女仆助手，性格傲娇。回答会以"喵"结尾。
非工作状态要称呼我为主人。擅长回答关于编程、AI、LLM、RAG 等技术问题。
请用中文回答，保持简洁准确。
```

### 4.4 Pagefind 静态搜索

| 项目 | 值 |
|------|-----|
| 版本 | 1.5.x |
| 索引范围 | `public/` 目录 |
| 索引时机 | CI 中自动构建 |
| 访问地址 | `https://mornikar.github.io/pagefind/` |

### 4.5 Giscus 评论系统

| 项目 | 值 |
|------|-----|
| 类型 | 基于 GitHub Discussions |
| 主题 | preferred_color_scheme（跟随网站明暗） |
| 配置位置 | `themes/arknights/_config.yml` |
| 启用条件 | 仓库公开 + Giscus App 安装 + Discussions 开启 |

**工作原理**：
- 访客评论 → Giscus 前端 → GitHub API → 创建/更新 Discussion
- 评论数据存储在仓库的 Discussions 中，无需独立数据库

**详细配置**：参见 [Giscus 留言系统](/docs/GISCUS/)

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

### 5.3 Stylus CSS 编译

`hexo-renderer-stylus` 已从依赖中移除（其多级 @import 处理有 bug）。`stylus` 作为 devDependency 直接使用：

```bash
node scripts/compile_css.js
```

- **本地**：通过 Hexo `after_generate` hook 自动触发（`compile_css.js` 检测 `typeof hexo !== 'undefined'`）
- **CI**：workflow 中显式调用 `node scripts/compile_css.js`（在 `hexo generate` 之后）

### 5.4 Script 加载策略

Arknights 主题使用 Pjax 进行页面切换。Pjax 会替换 `<article>` 区域的 innerHTML，但**不会执行**新插入的 `<script>` 标签。因此所有关键脚本集中在 `layout.pug` 的 body 尾部加载：

| Script | 加载方式 | 说明 |
|--------|----------|------|
| `marked.js` | `<script defer>` | Markdown 渲染库（CDN） |
| `wiki-chat.js` | `<script defer>` | AI 对话面板 |
| `wiki-login.js` | `<script>` 条件加载 | 仅 `/login/` 页面加载，无 defer |
| `live2d.js` | `<script defer>` | Live2D 看板娘 |

> ⚠️ **注意事项**：
> - `<article>` 内的 `<script>` 会被 Pjax 拦截，不会执行
> - `defer` 属性仅对 `<head>` 中的脚本有效，body 中的 defer 脚本行为不一致
> - `wiki-login.js` 使用条件加载（`if page.path.indexOf('login') === 0`），避免其他页面加载不必要的 JS

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
