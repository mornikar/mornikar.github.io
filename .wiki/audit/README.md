# Wiki 审计目录

此目录存放知识库审计反馈文件，供 wiki-lint.js 和 AI Review 自动生成。

## 审计文件格式

文件名：`AUDIT-YYYY-NNN.md`（如 `AUDIT-2026-001.md`）

```yaml
---
id: AUDIT-2026-001
target: "[[页面标题]]"
type: quality              # quality | accuracy | completeness | outdated | duplicate | structure | dead_link
severity: major            # critical | major | minor | suggestion
status: open               # open | in_progress | resolved | dismissed
comment: "问题描述"
suggested_action: recompile # add_content | update | merge | split | delete | fix_link | recompile
created: 2026-04-24
resolved:
resolved_by:
---
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 审计唯一标识，格式 AUDIT-YYYY-NNN |
| `target` | ✅ | 目标页面（WikiLink 格式） |
| `type` | ✅ | 审计类型 |
| `severity` | ✅ | 严重度 |
| `status` | ✅ | 当前状态 |
| `comment` | ✅ | 问题描述 |
| `suggested_action` | ✅ | AI 可执行的建议操作 |
| `created` | ✅ | 创建日期 |
| `resolved` | ❌ | 解决日期 |
| `resolved_by` | ❌ | 解决方式（AI compile session / human） |

## 审计来源

1. **wiki-lint.js**：自动检测死链、孤儿页等 → 生成 `dead_link` / `structure` 类审计
2. **CMS 审阅评论**：用户通过 CMS 提交评论 → 转为审计文件
3. **AI Review**：编译后 AI 自动评估质量 → 生成审计
4. **wiki-chat.js**：对话中用户反馈 → 可提交审计

## 生命周期

```
open → in_progress → resolved
                    → dismissed（人工判定无需处理）
```
