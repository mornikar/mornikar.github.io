# 🌐 Mornikar's Blog

> **LLM Wiki 知识管理** + **Hexo 静态生成** + **GitHub Pages 托管** 的个人技术博客

**🌐 在线访问**：[mornikar.github.io](https://mornikar.github.io)
**📚 在线文档**：[mornikar.github.io/docs/](https://mornikar.github.io/docs/)
**💾 下载安装包**：[ Releases → hexo-arknights-blog.zip](https://github.com/mornikar/mornikar.github.io/releases)

---

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 📝 **Wiki 管理** | 把 Markdown 丢进 `.wiki/` 目录，push 即发布 |
| 🔗 **WikiLink 双向链接** | `[[文章标题]]` 自动高亮，鼠标悬停预览 |
| 🤖 **AI 对话侧边栏** | 网站右下角悬浮按钮，接入 Dify RAG 知识库 |
| 🐱 **Live2D 看板娘** | 页面左侧阿丽露模型，可对话、换装、TTS 朗读 |
| 🎙️ **TTS 朗读** | AI 回复自动朗读，多音色切换，猫女仆人设 |
| 🔍 **静态全文搜索** | Pagefind，无需服务器，离线可用 |
| 🎨 **Arknights 明日方舟主题** | 自定义 CSS，蓝色系卡片风格 |
| 📝 **在线内容管理 CMS** | 自建 Wiki CMS v4，GitHub OAuth 一键登录 + Markdown 编辑 + 图片上传 |
| ⚡ **CI 全自动发布** | push → 2 分钟内上线，无需手动操作 |

---

## 🚀 快速部署（下载安装包）

### 方式一：下载安装包（最简单，推荐）

1. 进入 **[Releases 页面](https://github.com/mornikar/mornikar.github.io/releases)**，下载 `hexo-arknights-blog.zip`
2. 解压到本地
3. 修改 `_config.yml` 中的博客名称、URL、作者
4. 上传到自己的 GitHub 仓库
5. 开启 GitHub Pages → 完成！

详细步骤：[完整安装部署指南](https://mornikar.github.io/docs/INSTALL/)

### 方式二：Fork + Clone（适合开发者）

```bash
# 1. Fork 本仓库到你的 GitHub 账号
# 2. 克隆到本地
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 3. 安装依赖
npm install

# 4. 本地预览
wiki-sync.bat
# 访问 http://localhost:4000

# 5. 推送更新
git add . && git commit -m "更新文章" && git push
# CI 自动构建 → 2 分钟后博客上线
```

---

## 📁 目录结构

```
.wiki/                    ← ⭐ 写文章只需在这里放 md 文件
├── concepts/             ← 技术概念笔记 → 博客「学习笔记」
├── entities/             ← 实体随笔 → 博客「学习随笔」
├── comparisons/           ← 对比分析
├── queries/              ← 问答笔记
└── raw/                  ← 原始存档（不发布）

.docs-src/                ← 项目文档（CI 自动生成 /docs/ 页面）
├── INSTALL/              ← 安装部署指南
├── PROJECT/              ← 系统架构
├── MAINTENANCE/          ← 日常维护
├── TROUBLESHOOTING/      ← 故障排查
└── MIGRATION/            ← Wiki 格式规范

source/_posts/            ← Hexo 文章（由脚本自动生成，无需手动编辑）
source/admin/             ← 📝 在线内容管理 CMS（Wiki CMS v4）
  ├── index.html          ← 自建 CMS 管理界面（OAuth + Token 双模式登录）
  ├── callback.html       ← OAuth 回调页面
  └── config.yml          ← Decap CMS 标准配置
tools/                    ← Cloudflare Workers
  ├── wiki-cms-unified-worker.js  ← 统一 Worker v4（OAuth + API代理 + 图片上传）
  └── README.md           ← Worker 部署说明
themes/arknights/         ← 明日方舟风格主题
  source/live2d/          ← Live2D 看板娘 + AI 对话
  source/js/wiki-chat.js  ← AI 对话面板 + TTS
  source/js/wiki-login.js ← 登录页特效 + 配置
scripts/                   ← 自动化脚本
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Hexo | 7.x | 静态博客生成 |
| hexo-theme-arknights | fork | 明日方舟风格主题 |
| wiki-to-hexo.js | v4.0 | Wiki → Hexo 格式转换 |
| Wiki CMS | v4 | 在线内容管理（OAuth + Token 双模式登录） |
| Cloudflare Workers | — | GitHub API 代理 + OAuth 认证 + 图片上传 |
| Dify | 1.13.3 | 本地 RAG 知识库 + AI 对话（可选） |
| WikiChat | — | 网站侧边栏 AI 悬浮按钮 |
| Live2D | Cubism 4 | 看板娘 AI 对话 + TTS 朗读 |
| Pagefind | 1.5.x | 静态全文搜索 |
| GitHub Actions | — | CI 自动构建与部署 |

> 💡 **本地模型**：Qwen3 4B @ LM Studio（RTX 3060 Ti 8GB）

---

## 📚 项目文档

| 文档 | 说明 |
|------|------|
| [🚀 安装部署](https://mornikar.github.io/docs/INSTALL/) | **新用户必读**：从零部署自己的博客 |
| [📐 系统架构](https://mornikar.github.io/docs/PROJECT/) | 目录结构、组件关系、主题定制 |
| [🤖 AI 助手](https://mornikar.github.io/docs/AI_CHAT/) | Wiki AI 对话助手使用指南 |
| [🔧 日常维护](https://mornikar.github.io/docs/MAINTENANCE/) | Wiki 编辑、Dify 同步、Tailscale |
| [💬 Giscus 留言](https://mornikar.github.io/docs/GISCUS/) | 基于 GitHub Discussions 的评论系统 |
| [🔍 故障排查](https://mornikar.github.io/docs/TROUBLESHOOTING/) | 常见问题与解决方案 |
| [📋 Wiki 格式规范](https://mornikar.github.io/docs/MIGRATION/) | frontmatter、WikiLink、分类映射 |
| [🌲 分支说明](https://mornikar.github.io/docs/BRANCHES/) | source/main 分支关系与工作流程 |

---

## 🔄 工作流程

```
你 → 编辑 .wiki/*.md
  → git push origin source
  → GitHub Actions CI 自动触发
      ① wiki-to-hexo.js 转换格式
      ② hexo generate 生成 HTML
      ③ compile_css.js 编译 Stylus（含 wiki-chat/wikilink 样式）
      ④ Pagefind 建立搜索索引
      ⑤ deploy-pages 部署到 GitHub Pages
  → https://你的用户名.github.io 上线（2~3 分钟）
```

---

## 🌐 相关链接

| 服务 | 地址 |
|------|------|
| 博客主站 | https://mornikar.github.io |
| Wiki 文档站 | https://mornikar.github.io/docs/ |
| 搜索 | https://mornikar.github.io/pagefind/ |
| CI 构建历史 | https://github.com/mornikar/mornikar.github.io/actions |
| GitHub 仓库 | https://github.com/mornikar/mornikar.github.io |

---

## 📋 更新日志

### v8.7 — 2026-04-24

**新功能：**
- ✨ Wiki CMS v4：GitHub OAuth 一键登录 + 手动 Token 双模式
- ✨ 统一 Cloudflare Worker（OAuth 认证 + API 代理 + 图片上传合一）
- ✨ CMS 集合路径对齐到实际 `_posts/` 子目录（AIGC / 学习随笔 / 学习笔记 / 机器学习 / 云环境）
- ✨ callback.html 支持 popup + 整页跳转双模式 OAuth 回调
- ✨ 新增「所有文章」递归视图
- 🔧 `config.yml` 集合路径与自建 CMS 统一
- 🔧 旧 Worker 文件标记为待废弃

### v8.6 — 2026-04-24

**Bug 修复：**
- 🔧 设置页关闭(✕)按钮后 Live2D 看板娘消失 — 关闭 handler 中补充 `showLive2DArea()` 调用
- 🔧 移动端无法加载看板娘 — 移除 `live2d.js` 中 `screen.width >= 768` 硬编码限制，改为始终初始化
- 🔧 移动端 Live2D 区域适配 — 区域高度 300→200px，模型尺寸 280→180px

### v8.5 — 2026-04-22

**新功能：**
- ✨ RAG 页面上下文 + search.xml 全局检索
- ✨ 设置面板 System Prompt 自定义配置
- ✨ 登录页 /login 支持三种接入方式（Dify / 在线 API / 直连模型）
- ✨ 导航栏旧 AI 助手入口移除，由浮动面板替代

### v7.0 — 2026-04-20

**新功能：**
- ✨ 多模型接入（Dify / 在线 API / 直连模型）
- ✨ 设置面板完整重构
- ✨ 登录页赛博雨幕 Canvas 背景
- ✨ TTS 语音朗读与 Live2D 工具栏共享设置

---

## 📜 License

MIT — 欢迎 Fork、借鉴、魔改。
