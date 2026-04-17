# Mornikar's Blog

> Dr.GT_Mornikar 的个人博客，基于 LLM Wiki 知识管理 + Hexo 静态生成 + GitHub Pages 托管

**🌐 在线访问**：https://mornikar.github.io

## 项目结构

```
Hexo/                       # 博客源码（编辑入口）
├── .wiki/                  # LLM Wiki 知识库
│   ├── concepts/            # 技术概念笔记
│   ├── entities/            # 实体随笔
│   ├── comparisons/         # 对比分析
│   └── queries/             # 查询结果
├── source/                  # Hexo 源文件
│   ├── _posts/              # 博客文章（自动生成）
│   └── docs/                # 项目文档（直接在网站 /docs/ 下访问）
├── themes/arknights/         # Arknights 主题
└── scripts/                 # 工具脚本
    └── wiki-to-hexo.js     # Wiki → Hexo 转换器
```

## 核心技术栈

| 技术 | 用途 |
|------|------|
| **Hexo** | 静态博客生成 |
| **Arknights 主题** | 明日方舟风格 UI |
| **LLM Wiki** | Markdown 知识管理，支持 WikiLink |
| **Dify RAG** | 本地向量知识库 + AI 对话 |
| **Pagefind** | 静态全文搜索 |
| **GitHub Actions** | 自动构建与部署 |

## 快速开始

```bash
git clone https://github.com/mornikar/mornikar.github.io.git
cd mornikar.github.io/Hexo

# 安装依赖
npm install

# 本地预览
wiki-sync.bat

# 访问 http://localhost:4000
```

## 项目文档

- [项目总览](/docs/) — 系统架构、组件关系
- [维护指南](/docs/MAINTENANCE/) — 日常使用流程、Dify 管理
- [故障排查](/docs/TROUBLESHOOTING/) — 常见问题与解决方案
- [迁移规范](/docs/MIGRATION/) — Wiki 格式规范、CI 部署说明

## Wiki 使用

在 `.wiki/` 目录下新建 `.md` 文件，填好 frontmatter 后运行 `wiki-sync.bat` 自动同步到博客。

详见 [迁移规范](/docs/MIGRATION/)。

## 技术细节

- **模型**：Qwen3 4B @ LM Studio（本地 GPU 运行）
- **RAG**：Dify + Weaviate 向量库
- **公网访问**：Tailscale（手机 + 电脑同一网络）
- **部署**：GitHub Actions 监听 `source` 分支，自动构建并推送到 `gh-pages`

## License

MIT
