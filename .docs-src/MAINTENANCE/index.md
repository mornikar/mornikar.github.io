---
title: 维护指南
---
# 🔧 维护指南

## 一、系统要求

| 环境 | 版本 | 安装方式 |
|------|------|----------|
| Node.js | ≥ 18.x | [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| npm | 内置 | — |
| Git | ≥ 2.30 | [git-scm.com](https://git-scm.com/) |
| Docker Desktop | ≥ 4.28 | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Tailscale | 最新版 | [tailscale.com/download](https://tailscale.com/download) |

> 💡 **推荐**：使用 `nvm install 18 && nvm use 18` 安装 Node.js，避免全局污染。

---

## 二、日常使用流程

### 2.1 完整开发流程（推荐）

```powershell
# 1. 拉取最新代码
git pull origin source

# 2. 编辑 Wiki 文件
#    - 编辑 .wiki/concepts/xxx.md
#    - 或新建文件

# 3. 一键同步 + 预览
wiki-sync.bat

# 4. 访问 http://localhost:4000 确认效果

# 5. 推送（CI 自动部署）
git add -A
git commit -m "feat: 更新 xxx"
git push origin source
```

### 2.2 仅预览（不修改文件）

```powershell
wiki-sync.bat --dry-run
```

### 2.3 仅本地构建

```powershell
# 不执行 git 操作
node scripts/wiki-to-hexo.js
hexo generate
hexo server
```

---

## 三、Wiki 编辑规范

### 3.1 新建 Wiki 文章

**Step 1**：在 `.wiki/` 对应目录下创建文件

```
.wiki/
├── concepts/       ← 技术概念
├── entities/       ← 实体随笔
├── comparisons/     ← 对比分析
├── queries/        ← 查询结果
└── raw/            ← 原始存档（不发布）
```

**Step 2**：填写 frontmatter（必须完整）

```yaml
---
title: RAG检索增强生成        # 页面标题（必填）
type: concepts                # 固定为所在目录名（必填）
tags: [AI, LLM, RAG]         # 标签（必填）
created: 2025-09-12          # 创建日期（必填，YYYY-MM-DD）
updated: 2025-09-12          # 更新日期（必填，YYYY-MM-DD）
summary: 一句话描述           # 摘要（可选）
aliases: [别名1, 别名2]      # 别名（可选）
related: [相关页面1, 相关页面2] # 关联页面（可选）
---
```

> ⚠️ **日期格式必须为 `YYYY-MM-DD`**，不能写成 `YYYY/MM/DD`，否则 hexo generate 无法生成文章！

**Step 3**：使用 WikiLink 链接相关内容

```markdown
## RAG 简介

RAG（检索增强生成）结合了 [[信息检索]] 和 [[大语言模型]] 的优势...

## 相关技术

- [[向量数据库]]
- [[Embedding模型]]
```

### 3.2 WikiLink 语法

| 语法 | 示例 | 输出 |
|------|------|------|
| 直接链接 | `[[RAG检索增强生成]]` | 明日方舟风格链接 |
| 带显示文字 | `[[RAG检索增强生成\|点击这里]]` | "点击这里" |
| 外部链接 | `[百度](https://baidu.com)` | 普通 Markdown 链接 |

**匹配优先级**：
1. 精确匹配文件名（不含扩展名）
2. 大小写不敏感匹配
3. 前缀模糊匹配
4. 降级为路径搜索

### 3.3 编辑规则

| 规则 | 说明 |
|------|------|
| frontmatter 必填 | 每个 `.md` 必须有完整 frontmatter |
| 孤立页面禁止 | 每页至少链接 2 个其他页面 |
| 内容简洁 | 单页控制在 200 行内，超过则拆分 |
| 先 orient | 每次编辑先读 `SCHEMA.md + index.md + log.md` |
| 更新 updated | 修改内容后同步更新 frontmatter 的 `updated` 字段 |

---

## 四、Dify 知识库管理

### 4.1 本地访问 Dify

| 地址 | 说明 |
|------|------|
| http://localhost/v1 | Dify 主界面 |
| http://localhost/v1/apps | 应用管理 |
| http://localhost/v1/datasets | 知识库管理 |

### 4.2 同步 Wiki 到 Dify

```powershell
# 方式一：使用脚本（推荐）
node tools/sync-wiki-to-dify.js

# 方式二：手动同步
# 1. 打开 http://localhost/v1/datasets
# 2. 进入知识库 "mmo的知识库"
# 3. 点击「同步」按钮
```

> 💡 同步后 Dify 会自动重新索引，约需 1-2 分钟。

### 4.3 Dify 应用信息

| 配置项 | 值 |
|--------|-----|
| 应用名称 | 聊天机器人 mornikar |
| App API Key | `app-JznEvGv3JlWWISRmNdjRO7yE` |
| 知识库名称 | mmo的知识库 |
| Dataset API Key | `dataset-qfr0cZc2dnjftg5tVTraWRWf` |
| 向量数据库 | Weaviate |

---

## 五、Pagefind 搜索

### 5.1 工作原理

Pagefind 在 `public/` 目录中建立静态全文索引，支持模糊搜索、分词搜索。

### 5.2 构建时机

| 场景 | 构建方式 |
|------|----------|
| CI 自动构建 | 每次 push 后自动运行 |
| 本地调试 | `wiki-sync.bat` 中自动包含 |
| 手动构建 | `npx pagefind --site public --output-path public/pagefind` |

### 5.3 验证搜索

1. 访问 https://mornikar.github.io/pagefind/
2. 输入关键词测试搜索
3. 确认 Wiki 文章能被检索到

---

## 六、Tailscale 公网访问

### 6.1 设备信息

| 设备 | Tailscale IP | 域名 |
|------|-------------|------|
| Windows 电脑 | `100.73.236.115` | `mornikar.tail7ee4f8.ts.net` |
| Android 手机 | `100.69.47.104` | — |

### 6.2 使用条件

1. 电脑和手机都安装 Tailscale
2. 都登录同一个 GitHub 账号
3. 双方设备都显示「Connected」

### 6.3 访问方式

```
手机访问博客：https://mornikar.tail7ee4f8.ts.net
手机访问 Dify：http://mornikar.tail7ee4f8.ts.net:18789
```

---

## 七、GitHub Pages 部署状态

| 项目 | 值 |
|------|-----|
| 部署源分支 | `main` |
| 部署方式 | `build_type=workflow`（Actions 原生，无 Jekyll） |
| CI 触发条件 | push 到 `source` 分支 |
| 网站地址 | https://mornikar.github.io |
| 文档地址 | https://mornikar.github.io/docs/ |
| CI 历史 | https://github.com/mornikar/mornikar.github.io/actions |

### 手动触发 CI

如果 CI 未自动触发：

1. 打开 https://github.com/mornikar/mornikar.github.io/actions
2. 点击「Wiki-Hexo 自动部署」
3. 点击「Run workflow」→ 选择 `source` 分支 → 运行

---

## 八、Giscus 评论系统维护

### 8.1 评论数据位置

评论存储在 GitHub Discussions 中：
- 仓库地址：https://github.com/mornikar/mornikar.github.io/discussions
- 每个页面自动对应一个 Discussion

### 8.2 管理评论

1. 打开仓库 Discussions 页面
2. 可以对评论进行编辑、删除、置顶等操作
3. 可以设置分类、添加标签

### 8.3 修改 Giscus 配置

编辑 `themes/arknights/_config.yml` 中的 giscus 配置：

```yaml
giscus:
  enable: true
  repo: mornikar/mornikar.github.io
  repo_id: R_xxxxxxxxxxxxx
  category: Announcements
  category_id: DIC_xxxxxxxxxxxxx
  mapping: pathname
  input_position: top
  theme: preferred_color_scheme
```

### 8.4 常见问题

| 问题 | 解决方案 |
|------|----------|
| 评论不显示 | 检查 Giscus App 是否安装、Discussions 是否开启 |
| 关闭某页评论 | 在 frontmatter 中添加 `comments: false` |
| 修改主题 | 修改 `theme` 参数：`light` / `dark` / `preferred_color_scheme` |

---

## 九、CMS 管理面板

### 9.1 访问方式

访问 `https://mornikar.github.io/admin/` 进入自定义 CMS 面板（GitHub OAuth 登录）。

### 9.2 文章集合

| 集合 | 目录 | 新建文件名格式 |
|------|------|---------------|
| AIGC 笔记随笔 | `source/_posts/AIGC笔记随笔/` | `YYYY-MM-DD-标题` |
| 学习随笔 | `source/_posts/LearningEssays/` | `YYYY-MM-DD-标题` |
| 学习笔记 | `source/_posts/LearningNote/` | `YYYY-MM-DD-标题` |
| 机器学习 | `source/_posts/机器学习/` | `YYYY-MM-DD-标题` |
| 云环境 | `source/_posts/云环境/` | `YYYY-MM-DD-标题` |
| 所有文章 | `source/_posts/` | `YYYY-MM-DD-标题` |

### 9.3 Wiki 集合（v4.2 新增）

| 集合 | 目录 | 新建文件名格式 |
|------|------|---------------|
| 📚 Wiki 概念 | `.wiki/concepts/` | 无日期前缀 |
| ✍️ Wiki 随笔 | `.wiki/entities/` | 无日期前缀 |
| 📥 素材·文章 | `.wiki/raw/articles/` | 无日期前缀 |
| 📥 素材·ML | `.wiki/raw/ML/` | 无日期前缀 |
| 📥 素材·PM | `.wiki/raw/PM/` | 无日期前缀 |
| 🔍 审计反馈 | `.wiki/audit/` | `AUDIT-YYYY-NNN` |

### 9.4 保存逻辑差异

| 集合类型 | 保存行为 |
|----------|---------|
| Posts 集合 | 自动包装 Hexo frontmatter（title/date/category/tags） |
| Wiki 集合 | 原样保存，不包装 Hexo frontmatter（wiki 文件自有 title/tags/created/updated 格式） |

---

## 十、URL 卫生规范（v4.2 新增）

### 10.1 slugify 自动清洗

`wiki-to-hexo.js` 的 `slugify()` 函数会自动执行以下清洗：

| 清洗规则 | 输入示例 | 输出 |
|----------|---------|------|
| 去 YAML 值引号 | `"LLMWiki_VS_RAG调研"` | `LLMWiki_VS_RAG调研` |
| `_` → `-` | `LLMWiki_VS_RAG调研` | `LLMWiki-VS-RAG调研` |
| `+` → `-` | `C++基础` | `C-基础` |
| 去首尾横线 | `-标题-` | `标题` |
| 合并连续横线 | `A--B---C` | `A-B-C` |
| 去 `#` 符号 | `C#笔记` | `C笔记` |

### 10.2 WikiLink URL 来源

**重要变更**：WikiLink 的 URL 现在统一使用 `wiki-index.json` 中的 `url` 字段，不再客户端拼接。

```
旧流程：wiki-chat.js 中 slugify(title) → 拼 URL（可能和服务端不一致）
新流程：wiki-to-hexo.js 生成 wiki-index.json（含 url 字段）→ wiki-chat.js 读取 url
```

### 10.3 URL 格式

```
正确格式：/YYYY/MM/DD/Category/YYYY-MM-DD-标题/
错误格式：/YYYY/MM/DD/Category/--标题-/    ← 双横线+尾横线
错误格式：/YYYY/MM/DD/Category/标题\_转义/  ← 下划线转义残留
```

### 10.4 定期数据质量检查

```powershell
# 1. 检查 wiki-index.json 中有无 URL 异常
node scripts/wiki-to-hexo.js --test

# 2. 检查 hexo generate 文件数是否稳定（约 240）
npx hexo clean && npx hexo generate 2>&1 | Select-String "files generated"

# 3. 强制重建（自动清理含双横线的旧文件）
node scripts/wiki-to-hexo.js --force
```

---

## 十一、本地命令速查

| 命令 | 说明 |
|------|------|
| `wiki-sync.bat` | 一键同步：清理→转换→生成→搜索→提交→推送 |
| `wiki-sync.bat --dry-run` | 预览转换结果（不修改文件） |
| `node scripts/wiki-to-hexo.js` | 仅执行 Wiki → Hexo 转换（增量） |
| `node scripts/wiki-to-hexo.js --force` | 强制全量转换 + 自动清理旧文件 |
| `node scripts/wiki-to-hexo.js --dry-run` | 预览转换结果 |
| `node scripts/wiki-to-hexo.js --test` | 数据质量检查 |
| `node scripts/wiki-compile.js` | AI 编译 raw → concepts/entities |
| `node scripts/compile_css.js` | 手动编译 Stylus CSS |
| `node tools/sync-wiki-to-dify.js` | 同步 Wiki 到 Dify |
| `hexo server` | 本地预览（端口 4000） |
| `hexo clean` | 清理 public/ 目录 |
| `hexo generate` | 生成静态文件 |
