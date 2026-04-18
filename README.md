# 🌐 Mornikar's Blog

> 基于 **LLM Wiki 知识管理** + **Hexo 静态生成** + **GitHub Pages 托管** 的个人技术博客

**🌐 在线访问**：https://mornikar.github.io

---

🌐 LLM Wiki + Hexo 博客

**🌐 在线访问**：
https://mornikar.github.io/docs/

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Hexo | 7.x | 静态博客生成 |
| hexo-theme-arknights | fork | 明日方舟风格主题 |
| wiki-to-hexo.js | v4.0 | Wiki → Hexo 格式转换 |
| Dify | 1.13.3 | 本地 RAG 知识库 + AI 对话 |
| WikiChat | — | 网站侧边栏 AI 对话 |
| Pagefind | 1.5.x | 静态全文搜索 |
| GitHub Actions | — | 自动构建与部署 |
| Tailscale | — | 公网安全穿透 |

> 💡 **本地模型**：Qwen3 4B @ LM Studio（RTX 3060 Ti 8GB）

---

## 📁 项目结构

```
mornikar.github.io/ (source 分支)
│
├── .wiki/                      # ⭐ Wiki 源文件（编辑入口）
│   ├── concepts/              #   技术概念笔记
│   ├── entities/              #   实体随笔
│   ├── comparisons/            #   对比分析
│   ├── queries/               #   查询结果
│   └── raw/                   #   原始存档（不发布）
│
├── .docs-src/                 # 📄 项目文档（CI 直接复制 → /docs/）
│   ├── index.md              #   文档首页
│   ├── PROJECT/              #   系统架构
│   ├── MAINTENANCE/          #   维护指南
│   ├── TROUBLESHOOTING/      #   故障排查
│   └── MIGRATION/            #   迁移规范
│
├── source/                     # Hexo 源文件
│   ├── _posts/                #   博客文章（由 wiki-to-hexo.js 生成）
│   └── docs/                  #   （空目录）
│
├── themes/arknights/           # Arknights 主题
│   ├── layout/                #   Pug 模板
│   └── source/                #   静态资源（含 wiki-chat.js）
│
├── scripts/                   # 自动化脚本
│   ├── wiki-to-hexo.js      #   Wiki → Hexo 转换器
│   └── compile_css.js        #   Stylus 编译脚本
│
└── .github/workflows/        # CI 工作流
    └── deploy.yml            #   自动部署配置
```

---

## 🚀 快速开始

### 环境要求

| 环境 | 版本 |
|------|------|
| Node.js | ≥ 18.x |
| Git | ≥ 2.30 |
| npm | 内置 |

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/mornikar/mornikar.github.io.git
cd mornikar.github.io/Hexo

# 安装依赖
npm install

# 一键同步并预览
wiki-sync.bat

# 访问 http://localhost:4000
```

---

## 📚 项目文档

| 文档 | 说明 |
|------|------|
| [📄 项目总览](/docs/) | 系统架构、组件关系、快速导航 |
| [📐 系统架构](/docs/PROJECT/) | 目录结构、核心组件、主题定制 |
| [🔧 维护指南](/docs/MAINTENANCE/) | 日常使用流程、Dify 管理、Tailscale |
| [🔍 故障排查](/docs/TROUBLESHOOTING/) | 常见问题与解决方案 |
| [📋 迁移规范](/docs/MIGRATION/) | Wiki 格式、WikiLink、frontmatter 规范 |
| [🌲 分支说明](/docs/BRANCHES/) | source/main 分支关系、工作流程 |

---

## ✏️ Wiki 使用

### 新建 Wiki 文章

1. 在 `.wiki/` 对应目录下创建 `.md` 文件
2. 填写 frontmatter（`title`、`type`、`tags`、`created`、`updated`）
3. 使用 `[[WikiLink]]` 语法链接相关内容
4. 运行 `wiki-sync.bat` 部署

### frontmatter 示例

```yaml
---
title: 向量数据库
type: concepts
tags: [AI, 数据库, 向量检索]
created: 2026-04-17
updated: 2026-04-17
summary: 用于存储和检索向量 embedding 的专用数据库
---
```

详见 [迁移规范](/docs/MIGRATION/)。

---

## 🔄 分支架构

| 分支 | 用途 |
|------|------|
| `main` | 🏠 GitHub Pages 部署源（Visitors 第一眼看到的） |
| `source` | 🔧 开发分支（所有开发在此） |
| `gh-pages` | 📦 旧废弃分支（已切换到 main） |

> ⚠️ **工作流程**：在 `source` 开发 → push → CI 自动同步到 `main` → GitHub Pages 发布

详见 [分支说明](/docs/BRANCHES/)。

---

## 🌐 相关链接

| 服务 | 地址 |
|------|------|
| 博客主站 | https://mornikar.github.io |
| Wiki 文档 | https://mornikar.github.io/docs/ |
| 搜索 | https://mornikar.github.io/pagefind/ |
| GitHub 仓库 | https://github.com/mornikar/mornikar.github.io |
| CI 构建历史 | https://github.com/mornikar/mornikar.github.io/actions |
| Tailscale 域名 | https://mornikar.tail7ee4f8.ts.net |
| Dify 本地 | http://localhost/v1 |

---

## 📜 License

MIT
