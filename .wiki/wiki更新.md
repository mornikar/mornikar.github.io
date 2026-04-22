完整的架构梳理：

---

## 当前博客架构

```
用户操作                          CI 自动处理
   │                                  │
   ▼                                  ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│  .wiki/  (源文件)    │ push │  CI 自动化构建流水线            │
│  .wiki/concepts/     │ ──→  │  ① wiki-to-hexo.js 转换       │
│  .wiki/entities/     │      │  ② hexo generate 生成 HTML    │
│  .wiki/comparisons/  │      │  ③ Pagefind 搜索索引           │
│  .wiki/queries/      │      │  ④ deploy → GitHub Pages       │
│  .wiki/raw/          │      └──────────────────────────────┘
└──────────────────────┘
            │
            │ wiki-to-hexo.js
            ▼ (自动)
┌──────────────────────┐
│  source/_posts/      │  ← Hexo 格式的 .md（自动生成，不手动编辑）
│  LearningNote/       │
│  LearningEssays/     │
└──────────────────────┘
            │
            │ hexo generate
            ▼
┌──────────────────────┐
│  public/  (= repo根) │  ← GitHub Pages 读取这里
└──────────────────────┘
```

## 分类映射规则

| 放在 `.wiki/` 哪个子目录 | 生成到博客的分类       |
| ----------------- | -------------- |
| `concepts/`       | LearningNote   |
| `comparisons/`    | LearningNote   |
| `queries/`        | LearningNote   |
| `entities/`       | LearningEssays |
| `raw/`            | 不转换（原始资源）      |

## raw/ 目录说明

`raw/` 存放不可发布的原始材料，**不转换到博客文章**，但以下子目录有特殊处理：

| 子目录             | 用途                                      |
| --------------- | --------------------------------------- |
| `raw/articles/` | 主题文章笔记，带 frontmatter                    |
| `raw/ML/`       | 机器学习笔记                                  |
| `raw/PM/`       | 产品经理资料                                  |
| `raw/OS/`       | 操作系统笔记                                  |
| `raw/skills/`   | 技能笔记（flask/git/mysql/python/ubuntu/web） |
| `raw/snippets/` | 可复用代码/嵌入模板片段                            |
| `raw/assets/`   | **PDF、图片等二进制资源**                        |

### PDF 嵌入方法

1. 把 PDF 复制到 `.wiki/raw/assets/`
2. 从 `raw/snippets/PDF嵌入Snippet.md` 复制 HTML 模板到文章
3. 替换模板中的文件路径为 `assets/你的PDF.pdf`
4. push 后 CI 自动把 assets 拷贝到博客 `source/assets/`

PDF 使用 PDF.js 渲染，支持桌面和手机查看。

## 新增文章的正确方式

**只需做这一件事：把 md 文件放进 `.wiki/` 对应目录，然后 push。**

示例，比如你有几篇 AI 相关的笔记：

```
.wiki/
├── concepts/
│   ├── 我的AI笔记.md        ← 新增在这里 → 生成 LearningNote
│   └── 本地模型部署指南.md
├── entities/
│   └── 某篇文章.md         ← 新增在这里 → 生成 LearningEssays
└── ...
```

push 后，CI 自动：

1. 把 `.wiki/concepts/我的AI笔记.md` → `source/_posts/LearningNote/YYYY-MM-DD-我的AI笔记.md`
2. 运行 `hexo generate` 生成 HTML
3. 部署到 GitHub Pages

**博客直接就能看到**，无需手动运行任何命令。

---

**不需要操作的地方：**

- ❌ `source/_posts/` — 这是中间产物，由脚本自动生成，不要手动改
- ❌ `public/` — hexo generate 的输出，不要手动改
- ❌ `.docs-src/` — 这是项目文档站用的（mornikar.github.io/docs/），不是博客文章

所有未处理的 md 文件，直接扔进 `.wiki/` 对应子目录，然后 commit + push，剩下的 CI 全自动完成。**
