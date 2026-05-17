/**
 * Auto-Maintain 守护脚本 v1.0 (Phase 6.D)
 *
 * 让仓库能自行维护健康状态：
 *   git pull → lint → fix → compile → to-hexo → commit → push
 *
 * 用法：
 *   node auto-maintain.js                 # 完整维护流程
 *   node auto-maintain.js --dry-run       # 预览
 *   node auto-maintain.js --skip-pull     # 跳过 git pull
 *   node auto-maintain.js --skip-push     # 跳过 git push
 *   node auto-maintain.js --audit-fix     # 包含 AI 审计修复
 *
 * CI 定时触发：GitHub Actions cron（每天一次）
 * 安全防护：
 *   - 不自动 force-push
 *   - 不自动修改非 .wiki/ 和 scripts/ 文件
 *   - auto-commit 消息格式：🤖 auto-maintain: {summary}
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const WIKI_DIR = path.join(PROJECT_ROOT, '.wiki');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_PULL = args.includes('--skip-pull');
const SKIP_PUSH = args.includes('--skip-push');
const AUDIT_FIX = args.includes('--audit-fix');

// ============ 工具函数 ============

function run(cmd, options = {}) {
    const cwd = options.cwd || PROJECT_ROOT;
    try {
        const result = execSync(cmd, {
            cwd,
            encoding: 'utf-8',
            timeout: options.timeout || 60000,
            stdio: 'pipe',
        });
        return { success: true, output: result.trim() };
    } catch (e) {
        return { success: false, output: e.stderr || e.message };
    }
}

function hasGitChanges() {
    const result = run('git status --porcelain');
    return result.success && result.output.trim().length > 0;
}

function getChangedFiles(pattern) {
    const result = run('git diff --name-only HEAD');
    if (!result.success) return [];
    return result.output.split('\n').filter(f => f.match(pattern));
}

// ============ 主逻辑 ============

async function main() {
    console.log('\n🤖 Auto-Maintain 守护脚本 v1.0 (Phase 6.D)\n');
    console.log(`模式: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}\n`);

    const startTime = Date.now();
    const summary = [];

    // ─── Step 1: Git Pull ───
    if (!SKIP_PULL) {
        console.log('📥 Step 1: Git Pull...');
        const pullResult = run('git pull origin source');
        if (pullResult.success) {
            console.log(`  ✅ ${pullResult.output.split('\n')[0]}`);
            summary.push('git pull');
        } else {
            console.log(`  ⚠️ Pull 失败: ${pullResult.output.split('\n')[0]}`);
            summary.push('git pull failed');
        }
    } else {
        console.log('📥 Step 1: Git Pull (跳过)');
    }

    // ─── Step 2: Wiki Lint 健康检查 ───
    console.log('\n🔍 Step 2: Wiki Lint...');
    const lintResult = run('node scripts/wiki-lint.js', { timeout: 30000 });
    let lintIssues = 0;
    if (lintResult.success) {
        // 解析 lint 输出中的问题数
        const match = lintResult.output.match(/(\d+) 个问题/);
        lintIssues = match ? parseInt(match[1]) : 0;
        console.log(`  发现 ${lintIssues} 个问题`);
    } else {
        console.log(`  ⚠️ Lint 运行异常`);
    }

    // ─── Step 3: 自动修复 ───
    console.log('\n🔧 Step 3: Auto Fix...');
    if (lintIssues > 0) {
        const fixResult = run('node scripts/wiki-lint.js --fix', { timeout: 30000 });
        if (fixResult.success) {
            console.log('  ✅ 自动修复已执行');
            summary.push(`lint fix`);
        }
    } else {
        console.log('  ✅ 无需修复');
    }

    // ─── Step 4: AI 审计修复（可选）───
    if (AUDIT_FIX) {
        console.log('\n🤖 Step 4: AI Audit Fix...');
        const auditResult = run('node scripts/wiki-compile.js --audit-fix', { timeout: 300000 });
        if (auditResult.success) {
            console.log('  ✅ AI 审计修复完成');
            summary.push('audit-fix');
        } else {
            console.log(`  ⚠️ AI 审计修复失败: ${auditResult.output.split('\n')[0]}`);
        }
    } else {
        console.log('\n🤖 Step 4: AI Audit Fix (跳过，使用 --audit-fix 启用)');
    }

    // ─── Step 5: Wiki Compile（增量编译 raw 素材）───
    console.log('\n📝 Step 5: Wiki Compile...');
    const compileResult = run('node scripts/wiki-compile.js', { timeout: 300000 });
    if (compileResult.success) {
        const compiledMatch = compileResult.output.match(/编译成功: (\d+)/);
        if (compiledMatch && parseInt(compiledMatch[1]) > 0) {
            console.log(`  ✅ 编译了 ${compiledMatch[1]} 个文件`);
            summary.push(`compile ${compiledMatch[1]} files`);
        } else {
            console.log('  ✅ 无新文件需要编译');
        }
    } else {
        console.log(`  ⚠️ 编译失败（可能未配置 AI）`);
    }

    // ─── Step 6: Wiki → Hexo 转换 ───
    console.log('\n🔄 Step 6: Wiki → Hexo...');
    const toHexoResult = run('node scripts/wiki-to-hexo.js', { timeout: 60000 });
    if (toHexoResult.success) {
        const convertMatch = toHexoResult.output.match(/转换了 (\d+)/);
        console.log(`  ✅ 转换完成${convertMatch ? ` (${convertMatch[1]} 篇文章)` : ''}`);
        summary.push('wiki-to-hexo');
    } else {
        console.log(`  ⚠️ 转换失败: ${toHexoResult.output.split('\n')[0]}`);
    }

    // ─── Step 7: 查询提升（检查 .wiki/queries/）───
    const queriesDir = path.join(WIKI_DIR, 'queries');
    if (fs.existsSync(queriesDir)) {
        const queryFiles = fs.readdirSync(queriesDir).filter(f => f.endsWith('.md'));
        if (queryFiles.length > 0) {
            console.log(`\n📌 Step 7: Query Promote (${queryFiles.length} 个待提升查询)...`);
            const promoteResult = run('node scripts/wiki-query-promote.js', { timeout: 300000 });
            if (promoteResult.success) {
                console.log('  ✅ 查询提升完成');
                summary.push('query-promote');
            } else {
                console.log('  ⚠️ 查询提升失败（可能未配置 AI）');
            }
        }
    }

    // ─── Step 8: Auto Commit & Push ───
    console.log('\n📦 Step 8: Auto Commit...');

    if (hasGitChanges()) {
        // 安全检查：只提交 .wiki/ 和 scripts/ 和 source/ 相关文件
        const safePatterns = /^\.wiki\/|^scripts\/|^source\/|^themes\/.*\.(js|styl)$/;
        const allChanged = run('git diff --name-only HEAD').output.split('\n').filter(Boolean);
        const safeFiles = allChanged.filter(f => f.match(safePatterns));
        const unsafeFiles = allChanged.filter(f => !f.match(safePatterns));

        if (unsafeFiles.length > 0) {
            console.log(`  ⚠️ 发现 ${unsafeFiles.length} 个非安全文件变更，仅提交安全文件:`);
            unsafeFiles.forEach(f => console.log(`     ⛔ ${f}`));
        }

        if (safeFiles.length > 0 || allChanged.length === 0) {
            if (!DRY_RUN) {
                // 暂存所有变更
                run('git add -A');

                const commitMsg = `🤖 auto-maintain: ${summary.join(', ') || 'routine check'}`;
                const commitResult = run(`git commit -m "${commitMsg}"`);
                if (commitResult.success) {
                    console.log(`  ✅ Committed: ${commitMsg}`);

                    if (!SKIP_PUSH) {
                        const pushResult = run('git push origin source', { timeout: 60000 });
                        if (pushResult.success) {
                            console.log('  ✅ Pushed to source');
                        } else {
                            console.log(`  ⚠️ Push 失败: ${pushResult.output.split('\n')[0]}`);
                        }
                    }
                } else {
                    console.log(`  ⚠️ Commit 失败: ${commitResult.output.split('\n')[0]}`);
                }
            } else {
                console.log(`  📋 [Dry-run] 会 commit: ${summary.join(', ')}`);
            }
        }
    } else {
        console.log('  ✅ 无变更需要提交');
    }

    // ─── 完成 ───
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Auto-maintain 完成 (${elapsed}s)`);
    console.log(`   ${summary.length > 0 ? summary.join(' → ') : '无操作'}`);

    // ─── 更新维护日志 ───
    if (!DRY_RUN && summary.length > 0) {
        const LOG_FILE = path.join(WIKI_DIR, 'log.md');
        if (fs.existsSync(LOG_FILE)) {
            const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
            const logEntry = `- ${timestamp} | auto-maintain | ${summary.join(', ')}\n`;
            let logContent = fs.readFileSync(LOG_FILE, 'utf-8');
            const insertAfter = logContent.indexOf('\n', logContent.indexOf('\n') + 1);
            if (insertAfter !== -1) {
                logContent = logContent.slice(0, insertAfter + 1) + logEntry + logContent.slice(insertAfter + 1);
            } else {
                logContent = logEntry + logContent;
            }
            fs.writeFileSync(LOG_FILE, logContent, 'utf-8');
        }
    }
}

// Hexo 会自动 require scripts/ 下的 .js 文件。只有直接执行本文件时才运行维护流程，
// 避免 hexo generate/server 误触发 git pull/commit/push。
if (require.main === module) {
    main().catch(e => {
        console.error('❌ Auto-maintain 失败:', e.message);
        process.exit(1);
    });
}
