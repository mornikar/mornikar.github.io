# 长期维护指南

## 日常使用流程

### 方式一：本地脚本（推荐）

```powershell
cd D:\Auxiliary_means\Git\mornikar.github.io\Hexo

# 完整流程（Wiki → Dify → Hexo → 构建 → 部署）
wiki-sync.bat

# 仅预览（不写入、不部署）
wiki-sync.bat --dry-run

# 强制全量转换
wiki-sync.bat --force
```

`wiki-sync.bat` 内部执行 7 个步骤：
1. hexo clean — 清理旧构建
2. sync-wiki-to-dify.js — 同步 Wiki 到 Dify 知识库
3. wiki-to-hexo.js — 转换 Wiki 到 Hexo Markdown
4. hexo generate — 生成静态文件
5. pagefind — 构建搜索索引
6. git commit + push — 提交源文件变更
7. hexo deploy — 部署到 GitHub Pages

### 方式二：CI 自动部署

只需推送 `.wiki/` 文件到 GitHub `source` 分支，CI 自动完成全部流程。

### 方式三：分步手动操作

```powershell
# 1. Wiki → Dify
node tools/sync-wiki-to-dify.js

# 2. Wiki → Hexo（增量）
node scripts/wiki-to-hexo.js

# 3. 构建
npx hexo generate

# 4. 搜索索引
npx pagefind --site public --output-path public/pagefind

# 5. 部署
npx hexo deploy
```

---

## 添加新的 Wiki 文章

### 步骤 1：在 .wiki/ 下创建文件

根据内容类型选择目录：

| 目录 | 分类 | 适用场景 |
|------|------|----------|
| concepts/ | LearningNote | 技术概念、原理、学习笔记 |
| entities/ | LearningEssays | 项目随笔、个人思考、产品记录 |
| comparisons/ | LearningNote | A vs B 类对比分析 |
| queries/ | LearningNote | 查询结果、FAQ |

文件模板：

```markdown
---
title: 文章标题
created: 2026-04-17
updated: 2026-04-17
tags: [AI, 学习]
aliases: [别名1, 别名2]
related: [相关页面1, 相关页面2]
summary: 一句话描述
---

# 文章标题

正文内容...

## 参考资料

- [[相关概念]] - 相关链接
```

### 步骤 2：运行同步脚本

```powershell
wiki-sync.bat
```

或分步：

```powershell
node tools/sync-wiki-to-dify.js   # 同步到 Dify（AI 对话知识库）
node scripts/wiki-to-hexo.js      # 转换到 Hexo（发布到博客）
npx hexo generate                 # 构建静态文件
npx hexo deploy                   # 部署
```

---

## 更新现有 Wiki 文章

1. 直接编辑 `.wiki/` 下的对应 `.md` 文件
2. **记得更新 frontmatter 的 `updated` 字段为当天日期**
3. 运行 `wiki-sync.bat` 同步

---

## 管理 Dify 知识库

### 访问 Dify

| 环境 | 地址 |
|------|------|
| 电脑本地 | http://localhost:80 |
| 手机（公网） | http://mornikar.tail7ee4f8.ts.net |

### 配置信息（备用）

| 配置项 | 值 |
|--------|-----|
| Dataset API Key | `dataset-qfr0cZc2dnjftg5tVTraWRWf` |
| Dataset ID | `29362489-8750-4915-8cf6-05198f234721` |
| App API Key | `app-JznEvGv3JlWWISRmNdjRO7yE` |
| LM Studio | `http://localhost:1234/v1` |

### 修改知识库同步脚本

编辑 `tools/sync-wiki-to-dify.js` 中的 CONFIG：

```javascript
const CONFIG = {
  apiBase:       'http://localhost/v1',
  datasetApiKey: 'dataset-YOUR_KEY',    // 替换为你的 Key
  datasetId:     'YOUR_DATASET_ID',    // 替换为你的 ID
  wikiDir:       path.resolve(__dirname, '../.wiki'),
  syncDirs:      ['concepts', 'entities', 'comparisons', 'queries'],
  dryRun:        process.argv.includes('--dry-run'),
}
```

---

## WikiLink 语法

在 Wiki 文章中使用 `[[双括号]]` 链接到其他页面：

```markdown
[[文章标题]]              # 精确链接
[[文章标题|显示文字]]      # 带别名显示
```

脚本自动转换为博客内链。

---

## 手机端 AI 对话

wiki-chat.js 自动检测访问来源使用对应的 Dify 地址。手机端通过 Tailscale 访问：

1. 手机安装 Tailscale 并登录同一 GitHub 账号
2. 访问 http://mornikar.tail7ee4f8.ts.net
3. 点击右下角 🔵 AI 按钮即可对话

---

## 常见问题排查

| 问题 | 解决方案 |
|------|----------|
| CI 部署失败 | `gh run view --log` 查看 GitHub Actions 日志 |
| WikiLink 未匹配 | 目标页面不存在于 `.wiki/` 目录 |
| Hexo 生成 0 文件 | frontmatter `date` 格式必须是 `YYYY-MM-DD` |
| GitHub Pages 403 | workflow 需声明 `permissions: contents: write` |
| Dify 同步失败 | 检查 Docker Desktop 是否运行 |
| AI 对话报 Failed to fetch | 检查 Dify 和 LM Studio 服务状态 |

---

## 定期检查清单

- [ ] Wiki 文件 frontmatter 完整（title, created, updated, tags）
- [ ] `wiki-sync.bat` 无报错
- [ ] https://mornikar.github.io/ 页面正常
- [ ] GitHub Actions CI 成功
- [ ] Pagefind 搜索可用
- [ ] Dify AI 对话正常

---

## 开发流程规范

> **AI 主导开发测试，用户只做最终人工验收**

| 阶段 | 执行者 | 产出 |
|------|--------|------|
| 需求确认 | AI + 用户 | 明确功能点/验收标准 |
| 开发 | AI | 代码/配置变更 |
| 自测 | AI | 本地 hexo generate + 浏览器验证 |
| 多轮迭代 | AI | 修复问题直到稳定 |
| GitHub 发布 | AI | push → 触发 CI |
| 人工验收 | 用户 | 访问网站最终确认 |

---

## 备份与恢复

### 备份

```powershell
robocopy /E /MIR D:\Auxiliary_means\Git\mornikar.github.io\Hexo D:\Auxiliary_means\备份\LLM-Wiki-Hexo-YYYYMMDD
```

### 恢复

```powershell
robocopy /E /MIR D:\Auxiliary_means\备份\LLM-Wiki-Hexo-YYYYMMDD\Hexo D:\Auxiliary_means\Git\mornikar.github.io\Hexo
```
