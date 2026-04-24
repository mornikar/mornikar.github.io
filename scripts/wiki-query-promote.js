/**
 * Wiki Query Promote 脚本 v1.0 (Phase 6.C)
 *
 * 将 wiki-chat.js 中的优质对话提升为 wiki 页面
 * 对标 llm-wiki-skill 的 "query 答案可提升为 wiki"
 *
 * 功能：
 *   1. 扫描 .wiki/queries/ 目录中的查询记录
 *   2. AI 判断哪些查询值得提升为 wiki 页面
 *   3. 将优质查询编译为 concepts/entities 页面
 *   4. 标记已提升的查询
 *
 * 用法：
 *   node wiki-query-promote.js                # 扫描并提升
 *   node wiki-query-promote.js --dry-run      # 预览
 *   node wiki-query-promote.js --file <path>  # 提升指定查询
 *
 * 环境变量（同 wiki-compile.js）：
 *   WIKI_COMPILE_API_KEY / WIKI_COMPILE_ENDPOINT / WIKI_COMPILE_MODEL
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, slugify, determineTargetLayer } = require('./wiki-utils');

const WIKI_DIR = path.join(__dirname, '..', '.wiki');
const QUERIES_DIR = path.join(WIKI_DIR, 'queries');
const CONCEPTS_DIR = path.join(WIKI_DIR, 'concepts');
const ENTITIES_DIR = path.join(WIKI_DIR, 'entities');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILE_INDEX = args.indexOf('--file');
const TARGET_FILE = FILE_INDEX !== -1 && args[FILE_INDEX + 1] ? args[FILE_INDEX + 1] : null;

// ============ AI 配置（复用 wiki-compile 的配置）============
function loadAIConfig() {
    const CONFIG_FILE = path.join(WIKI_DIR, 'compile-config.json');
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            if (cfg.apiKey && cfg.endpoint && cfg.model) return cfg;
        } catch (e) {}
    }
    const apiKey = process.env.WIKI_COMPILE_API_KEY;
    const endpoint = process.env.WIKI_COMPILE_ENDPOINT;
    const model = process.env.WIKI_COMPILE_MODEL;
    if (apiKey && endpoint && model) return { apiKey, endpoint, model };
    return null;
}

// ============ AI 调用 ============
async function callAI(prompt, config) {
    const https = require('https');
    const http = require('http');
    const endpoint = config.endpoint.replace(/\/$/, '');
    const body = JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
    });

    return new Promise((resolve, reject) => {
        const url = new URL(`${endpoint}/chat/completions`);
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 120000,
        };
        if (config.apiKey) options.headers['Authorization'] = `Bearer ${config.apiKey}`;
        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) { reject(new Error(`API ${res.statusCode}`)); return; }
                try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('超时')); });
        req.write(body); req.end();
    });
}

// ============ 主逻辑 ============
async function main() {
    console.log('\n🚀 Wiki Query Promote v1.0 (Phase 6.C)\n');
    if (DRY_RUN) console.log('🔍 [Dry-run 模式]\n');

    const config = loadAIConfig();
    if (!config) {
        console.log('ℹ️ 未配置 AI，跳过查询提升');
        return;
    }

    // 确保 queries 目录存在
    if (!fs.existsSync(QUERIES_DIR)) {
        fs.mkdirSync(QUERIES_DIR, { recursive: true });
        console.log('📁 创建 .wiki/queries/ 目录');
    }

    // 扫描查询文件
    const queryFiles = [];
    if (TARGET_FILE) {
        const resolved = path.resolve(TARGET_FILE);
        if (fs.existsSync(resolved)) queryFiles.push(resolved);
    } else {
        if (fs.existsSync(QUERIES_DIR)) {
            fs.readdirSync(QUERIES_DIR)
                .filter(f => f.endsWith('.md'))
                .forEach(f => queryFiles.push(path.join(QUERIES_DIR, f)));
        }
    }

    if (queryFiles.length === 0) {
        console.log('ℹ️ 无待提升的查询');
        return;
    }

    console.log(`📋 发现 ${queryFiles.length} 个查询\n`);

    const promoted = [];
    const skipped = [];

    for (const filePath of queryFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);

        // 跳过已提升的查询
        if (frontmatter.promoted === 'true' || frontmatter.promoted === true) {
            skipped.push({ file: filePath, reason: '已提升' });
            continue;
        }

        const title = frontmatter.title || path.basename(filePath, '.md');
        console.log(`  📖 评估: ${title}`);

        // AI 判断是否值得提升
        const evaluatePrompt = `以下是一个用户与 AI 助手的对话记录。请判断这个对话是否包含值得保存为 wiki 页面的知识。

## 对话记录

${body.substring(0, 3000)}

## 判断标准
1. 包含具体的技术概念或知识点（非闲聊）
2. 回答内容有参考价值（非简单确认）
3. 信息密度较高（非重复已有内容）

请回答 JSON：
{"worth_promoting": true/false, "reason": "判断理由", "suggested_title": "建议的wiki标题", "suggested_layer": "concepts或entities"}`;

        try {
            const response = await callAI(evaluatePrompt, config);
            const jsonMatch = response.match(/\{[\s\S]*"worth_promoting"[\s\S]*\}/);
            if (!jsonMatch) {
                skipped.push({ file: filePath, reason: 'AI评估格式异常' });
                continue;
            }

            const evalResult = JSON.parse(jsonMatch[0]);

            if (!evalResult.worth_promoting) {
                skipped.push({ file: filePath, reason: evalResult.reason || '不值得提升' });
                console.log(`     ❌ 不值得提升: ${evalResult.reason}`);
                continue;
            }

            // 值得提升，编译为 wiki 页面
            console.log(`     ✅ 值得提升: ${evalResult.reason}`);
            const suggestedTitle = evalResult.suggested_title || title;
            const suggestedLayer = evalResult.suggested_layer || 'concepts';

            const compilePrompt = `将以下对话记录中的知识编译为结构化 wiki 页面。

## 对话记录

${body}

## 要求
1. 提取核心知识点，去除对话格式
2. 用清晰的标题层级组织
3. 用 [[双括号]] 链接可能的相关概念
4. 单页 800-2000 字
5. 纯 Markdown，不含 frontmatter`;

            const compiledContent = await callAI(compilePrompt, config);
            let cleaned = compiledContent.trim();
            if (cleaned.startsWith('```markdown')) cleaned = cleaned.slice('```markdown'.length);
            if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
            cleaned = cleaned.trim();

            // 生成 wiki 页面
            const today = new Date().toISOString().split('T')[0];
            const wikiFrontmatter = [
                '---',
                `title: ${suggestedTitle}`,
                `type: ${suggestedLayer}`,
                `tags: [wiki, query-promoted]`,
                `created: ${today}`,
                `updated: ${today}`,
                `source: query`,
                `promoted_from: ${path.basename(filePath)}`,
                `---`,
            ].join('\n');

            const targetDir = suggestedLayer === 'entities' ? ENTITIES_DIR : CONCEPTS_DIR;
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            const outputPath = path.join(targetDir, slugify(suggestedTitle) + '.md');

            if (!DRY_RUN) {
                fs.writeFileSync(outputPath, wikiFrontmatter + '\n\n' + cleaned, 'utf-8');

                // 标记原查询为已提升
                const updatedContent = content.replace(
                    /^(---\n)/,
                    `$1promoted: true\npromoted_to: ${suggestedTitle}\npromoted_date: ${today}\n`
                );
                fs.writeFileSync(filePath, updatedContent, 'utf-8');
            }

            promoted.push({ title: suggestedTitle, layer: suggestedLayer, from: filePath });
            console.log(`     📝 → ${suggestedLayer}/${slugify(suggestedTitle)}.md`);

        } catch (e) {
            console.log(`     ❌ 评估失败: ${e.message}`);
            skipped.push({ file: filePath, reason: e.message });
        }
    }

    console.log('\n========================================');
    console.log('📊 查询提升统计');
    console.log('========================================');
    console.log(`  提升: ${promoted.length}`);
    console.log(`  跳过: ${skipped.length}`);
    if (promoted.length > 0) {
        promoted.forEach(p => console.log(`  ✅ ${p.title} → ${p.layer}/`));
    }

    console.log('\n✨ ' + (DRY_RUN ? 'Dry-run 完成！' : '查询提升完成！'));
}

if (require.main === module) {
    main().catch(e => { console.error('❌ 查询提升失败:', e.message); process.exit(1); });
}
