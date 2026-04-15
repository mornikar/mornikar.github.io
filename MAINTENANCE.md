# Phase 5: 长期维护指南

## 开发流程规范

### 核心原则

> AI 主导开发测试，用户只做最终人工验收

```
需求确认 → AI 开发 → AI 自测（多轮） → GitHub 发布 → 人工验收
```

### 详细流程

| 阶段 | 执行者 | 产出 | 验收标准 |
|------|--------|------|----------|
| 需求确认 | AI + 用户 | 明确功能点/验收标准 | 用户确认 |
| 开发 | AI | 代码/配置变更 | - |
| 自测 | AI | 本地 hexo generate + 浏览器验证 | 无报错 |
| 多轮迭代 | AI | 修复问题直到稳定 | 单元测试通过 |
| GitHub 发布 | AI | push → 触发 CI | CI success |
| 人工验收 | 用户 | 访问网站最终确认 | 用户确认 |

## 本地测试命令

```powershell
# 1. 转换 Wiki 到 Hexo
cd D:\Auxiliary_means\Git\mornikar.github.io\Hexo
node scripts/wiki-to-hexo.js

# 2. 生成静态站点
hexo generate

# 3. 运行单元测试
node scripts/wiki-to-hexo.js --test

# 4. 强制全量转换
node scripts/wiki-to-hexo.js --force

# 5. 预览模式（不写入文件）
node scripts/wiki-to-hexo.js --dry-run
```

## 常见问题

### Q: CI 失败了怎么办？
A: 检查 GitHub Actions 日志：`gh run view --log-failed`

### Q: WikiLink 未匹配警告？
A: 检查链接的目标页面是否存在于 .wiki 目录中

### Q: Hexo 生成 0 文件？
A: 检查 frontmatter 的 date 格式是否为 `YYYY-MM-DD HH:mm:ss`

### Q: GitHub Pages 403 错误？
A: 确认 workflow 有 `permissions: contents: write` 且 Pages 源分支为 `gh-pages`

## 定期检查清单

- [ ] 运行 `node scripts/wiki-to-hexo.js --test` 确保测试通过
- [ ] 运行 `node scripts/wiki-to-hexo.js` 确保转换正常
- [ ] 检查 https://mornikar.github.io/ 确保网站正常
- [ ] 检查 GitHub Actions 确保 CI 正常

## 备份与恢复

### 备份位置
```
D:\Auxiliary_means\备份\LLM-Wiki-Hexo-20260416\
```

### 恢复方法
```powershell
robocopy /E D:\Auxiliary_means\备份\LLM-Wiki-Hexo-20260416\Hexo D:\Auxiliary_means\Git\mornikar.github.io\Hexo
```
