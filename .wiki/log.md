# Wiki 操作日志

> Append-only。每次 wiki-to-hexo.js 成功运行后自动追加记录。

## 2026

### 2026-04-18
- CI CSS 编译故障排查：
  - **问题1**：`compile_css.js` 被 hexo-renderer-stylus 错误触发（stylus 渲染时 `public/css/` 尚未创建）
  - **修复**：移除 `hexo-renderer-stylus`；`compile_css.js` 改用 Hexo `after_generate` hook；CI workflow 直接调用 `node scripts/compile_css.js`
  - **问题2**：sitemap generator 找不到 `./sitemap.xml` 模板
  - **修复**：移除 `_config.yml` 中的 `template: ./sitemap.xml`（使用内置模板）
  - commit `23c2d9a` → CI 成功 ✅
- PDF.js v4.4.168 已装到 `themes/arknights/source/lib/pdfjs/`
- raw/ 目录重组（87 个文件分到 articles/ML/PM/OS/skills 子目录），全部补全 frontmatter
- Dialoqbase部署.md 中的 API Key 已替换为占位符（防止 GitHub Secret Scanning 拦截推送）
- `.github/workflows/deploy.yml` CI 触发路径加入 `scripts/compile_css.js`
- ⚠️ **Pages 部署异常**：CI `deploy-pages@v4` 步骤报告成功，但 GitHub Pages 停留在旧 commit `d062660`（4/17）。排查后发现 CI 产物正常上传，但 Pages 服务层未更新。已通过 workflow_dispatch 重新触发。

### 2026-04-17
- Phase 6 完成：Wiki AI 对话侧边栏 + Dify 知识库集成
- `tools/sync-wiki-to-dify.js` 新增：将 .wiki/ 文件同步到 Dify 知识库
- `wiki-sync.bat` 升级到 v4.0：新增步骤 2（Dify 同步）
- Dify LM Studio 插件 SDK 修复：`.dict()` → `.model_dump()`
- Tailscale 公网穿透部署完成（固定域名：mornikar.tail7ee4f8.ts.net）
- 文档整合：新增 `PROJECT.md`、`TROUBLESHOOTING.md`，重写 `MAINTENANCE.md`、`MIGRATION.md`、`.wiki/SCHEMA.md`

- 2026-04-15 20:25:46 | concepts | [[AI模型优化训练方向]](concepts\AI模型优化训练方向.md) → LearningNote/
- 2026-04-15 20:25:46 | concepts | [[RAG检索增强生成]](concepts\RAG检索增强生成.md) → LearningNote/
- 2026-04-15 20:25:46 | entities | [[Hexo博客升级记录]](entities\Hexo博客升级记录.md) → LearningEssays/
- 2026-04-15 18:40:33 | concepts | [[AI模型优化训练方向]](concepts\AI模型优化训练方向.md) → LearningNote/
- 2026-04-15 18:40:33 | concepts | [[RAG检索增强生成]](concepts\RAG检索增强生成.md) → LearningNote/
- 2026-04-15 18:40:33 | entities | [[Hexo博客升级记录]](entities\Hexo博客升级记录.md) → LearningEssays/
- 2026-04-15 14:46:14 | concepts | [[AI模型优化训练方向]](concepts\AI模型优化训练方向.md) → LearningNote/
- 2026-04-15 14:46:14 | concepts | [[RAG检索增强生成]](concepts\RAG检索增强生成.md) → LearningNote/
- 2026-04-15 14:46:14 | entities | [[Hexo博客升级记录]](entities\Hexo博客升级记录.md) → LearningEssays/

### 2026-04-15
- `scripts/wiki-to-hexo.js` 升级到 v3.0：新增 WikiLink 转换、增量检测、dry-run 模式
- `scripts/wiki-sync.bat` 重写为 v3.0：支持 `--dry-run` / `--force` 参数
- `.github/workflows/deploy.yml` 修复：监听 `.wiki/**` 路径变更
- `.wiki/SCHEMA.md` 升级到 v3.0：新增 `aliases` / `related` / `summary` 字段，WikiLink 规范
