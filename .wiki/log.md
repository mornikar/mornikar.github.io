# Wiki 操作日志

> Append-only。每次 wiki-to-hexo.js 成功运行后自动追加记录。

## 2026
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
