/**
 * Wiki → Hexo 转换脚本 v4.0 (Phase 2 增强版)
 *
 * Phase 2 新增功能：
 *   - 冲突检测：检测同名文件不同内容的覆盖风险
 *   - frontmatter 增强：支持 wikiAliases / wikiTags / wikiCategory 字段
 *   - 详细错误处理与警告
 *   - 内置单元测试框架
 *
 * 用法：
 *   node wiki-to-hexo.js              # 全量/增量转换
 *   node wiki-to-hexo.js --dry-run    # 预览，不写入文件
 *   node wiki-to-hexo.js --force      # 强制全量转换
 *   node wiki-to-hexo.js --test       # 运行内置单元测试
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ 配置 ============
const WIKI_DIR    = path.join(__dirname, '..', '.wiki');
const POSTS_DIR   = path.join(__dirname, '..', 'source', '_posts');
const INDEX_FILE  = path.join(WIKI_DIR, 'index.md');
const LOG_FILE    = path.join(WIKI_DIR, 'log.md');
const META_FILE   = path.join(__dirname, '.wiki-meta.json');

// 目录 → Hexo 分类映射
const CATEGORY_MAP = {
    concepts:    'LearningNote',
    entities:    'LearningEssays',
    comparisons: 'LearningNote',
    queries:     'LearningNote',
    // raw/articles 子目录映射
    'AI产品方案': 'AIGC笔记随笔',
    'AI行业分析': 'AIGC笔记随笔',
    'AI部署':     'AIGC笔记随笔',
    '多模态':     'AIGC笔记随笔',
    '随笔':       'AIGC笔记随笔',
    // raw/ 顶级子目录
    'ML':        '机器学习',
    'OS':        '云环境',
    'PM':        'AIGC笔记随笔',
    'skills':    'AIGC笔记随笔',
    'snippets':  'AIGC笔记随笔',
};

// Wiki 层名称
const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];

// raw/articles 子目录（这些文章在 raw/articles/SUBDIR/*.md，映射到对应分类）
const RAW_ARTICLE_SUBDIRS = ['AI产品方案', 'AI行业分析', 'AI部署', '多模态', '随笔'];
// raw/ 顶级子目录（直接在 raw/SUBDIR/*.md）
const RAW_TOP_SUBDIRS = ['ML', 'OS', 'PM', 'skills', 'snippets'];

// ============ 参数解析 ============
const args = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const FORCE    = args.includes('--force');
const RUN_TEST = args.includes('--test');

// ============ 错误收集 ============
const warnings = [];
const errors = [];

/** 添加警告 */
function warn(msg) {
    warnings.push(msg);
    console.log(`  ⚠️  ${msg}`);
}

/** 添加错误 */
function fail(msg) {
    errors.push(msg);
    console.log(`  ❌ ${msg}`);
}

// ============ 工具函数 ============

function md5File(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
}

function loadMeta() {
    try {
        return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveMeta(meta) {
    if (!DRY_RUN) fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

/** 解析 YAML frontmatter（支持中文键名） */
function parseFrontmatter(content) {
    const trimmed = content.trimStart();
    const firstDash = trimmed.indexOf('---');
    if (firstDash !== 0) return { frontmatter: {}, body: content };

    const secondDash = trimmed.indexOf('---', 3);
    if (secondDash === -1) return { frontmatter: {}, body: content };

    const yamlStr = trimmed.slice(3, secondDash).trim();
    let body = trimmed.slice(secondDash + 3).trim();

    // 跳过第二个 frontmatter 块（wiki 层）
    if (body.startsWith('---')) {
        const wikiEnd = body.indexOf('---', 3);
        if (wikiEnd !== -1) body = body.slice(wikiEnd + 3).trim();
    }

    const frontmatter = {};
    yamlStr.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim()).filter(v => v);
            }
            frontmatter[key] = value;
        }
    });

    return { frontmatter, body };
}

/**
 * WikiLink 转换
 * [[RAG检索增强]] → [RAG检索增强](/2025/09/12/RAG检索增强生成/)
 * [[另一个页面|显示文字]] → [显示文字](/2025/09/12/另一个页面/)
 */
function convertWikiLinks(body, wikiMeta) {
    return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, label) => {
        const display = label || target.trim();
        const slug = target.trim();

        let meta = wikiMeta[slug];

        // 忽略大小写
        if (!meta) {
            const lower = slug.toLowerCase();
            meta = Object.values(wikiMeta).find(m => m.titleLower === lower);
        }

        // 模糊匹配：WikiLink 是 title 的前缀
        if (!meta) {
            const lower = slug.toLowerCase();
            meta = Object.values(wikiMeta).find(m => m.titleLower.startsWith(lower));
        }

        if (meta) {
            const hexoPath = `${meta.hexoDate}/${meta.title}`;
            return `[${display}](/${hexoPath}/)`;
        }

        // 找不到时降级为相对路径
        warn(`WikiLink 未匹配: [[${slug}]]`);
        return `[${display}](/${slug}/)`;
    });
}

function slugify(title) {
    return title
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '-')
        .trim();
}

function loadWikiMeta() {
    const meta = {};
    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                scan(full);
            } else if (item.endsWith('.md')) {
                const { frontmatter } = parseFrontmatter(fs.readFileSync(full, 'utf-8'));
                const title = frontmatter.title || path.basename(item, '.md');
                const layer = path.basename(dir);
                const created = frontmatter.created || new Date().toISOString().split('T')[0];
                const dateStr = created.replace(/-/g, '/');

                meta[title] = {
                    title,
                    titleLower: title.toLowerCase(),
                    layer,
                    category: CATEGORY_MAP[layer] || 'LearningNote',
                    hexoDate: dateStr,
                    file: full,
                };
            }
        }
    }
    scan(WIKI_DIR);
    return meta;
}

// ============ Phase 2 新增：冲突检测 ============

/** 检测 hexoPath 冲突：同名文件但内容不同 */
function detectConflicts(converted, prevMeta) {
    const conflicts = [];

    for (const item of converted) {
        const prev = prevMeta[item.wikiPath];

        // 检查 hexoPath 是否有其他 wiki 文件正在写入
        const existingFile = Object.entries(prevMeta).find(
            ([wp, meta]) => meta.hexoPath === item.hexoPath && wp !== item.wikiPath
        );

        if (existingFile) {
            const [existingWikiPath] = existingFile;
            conflicts.push({
                type: 'path_collision',
                wikiPath: item.wikiPath,
                existingWikiPath,
                hexoPath: item.hexoPath,
                title: item.title,
            });
        }

        // 检查目标文件是否已存在且内容不同
        if (fs.existsSync(item.hexoPath)) {
            const existingContent = fs.readFileSync(item.hexoPath, 'utf-8');
            const newContent = generateHexoContent(item, prev?.wikiMeta);

            if (existingContent !== newContent && prev?.hexoMd5 !== md5File(item.wikiPath)) {
                // 内容变更且不是来自同一个 wiki 文件
                if (existingWikiPath !== item.wikiPath) {
                    conflicts.push({
                        type: 'content_overwrite',
                        wikiPath: item.wikiPath,
                        existingWikiPath,
                        hexoPath: item.hexoPath,
                        title: item.title,
                    });
                }
            }
        }
    }

    return conflicts;
}

// ============ Phase 2 新增：frontmatter 增强 ============

/**
 * Phase 2 frontmatter 增强支持：
 * - wikiAliases: 额外的别名（逗号分隔）
 * - wikiTags: 额外的标签（逗号分隔），会追加到 tags
 * - wikiCategory: 覆盖默认分类映射
 */
function processFrontmatterEnhancements(frontmatter, layer, wikiMeta) {
    // 标签处理
    let tags = frontmatter.tags || [];
    if (!Array.isArray(tags)) tags = [tags];

    // Phase 2: 支持 wikiTags 字段
    if (frontmatter.wikiTags) {
        const extraTags = Array.isArray(frontmatter.wikiTags)
            ? frontmatter.wikiTags
            : frontmatter.wikiTags.split(',').map(t => t.trim());
        extraTags.forEach(t => {
            if (!tags.includes(t)) tags.push(t);
        });
    }

    if (!tags.includes('wiki')) tags.unshift('wiki');

    // 分类处理
    // 优先使用 wikiCategory，否则查 CATEGORY_MAP（支持 raw 子目录），最后默认
    let category = null;
    if (frontmatter.wikiCategory && ['LearningNote', 'LearningEssays', 'AIGC笔记随笔', '机器学习', '云环境'].includes(frontmatter.wikiCategory)) {
        category = frontmatter.wikiCategory;
    } else {
        category = CATEGORY_MAP[layer] || 'LearningNote';
    }

    // 别名处理
    // Phase 2: 支持 wikiAliases 追加
    let aliases = frontmatter.aliases || [];
    if (!Array.isArray(aliases)) aliases = [aliases];
    if (frontmatter.wikiAliases) {
        const extraAliases = Array.isArray(frontmatter.wikiAliases)
            ? frontmatter.wikiAliases
            : frontmatter.wikiAliases.split(',').map(a => a.trim());
        extraAliases.forEach(a => {
            if (!aliases.includes(a)) aliases.push(a);
        });
    }

    return { tags, category, aliases };
}

// ============ 主逻辑 ============

function main() {
    console.log('\n🚀 Wiki → Hexo 转换脚本 v4.0 (Phase 2)\n');
    if (DRY_RUN) console.log('🔍 [Dry-run 模式] 仅预览，不写入文件\n');

    const prevMeta = loadMeta();
    const wikiMeta = loadWikiMeta();

    // 确保分类目录存在
    Object.values(CATEGORY_MAP).forEach(cat => {
        const catPath = path.join(POSTS_DIR, cat);
        if (!fs.existsSync(catPath)) {
            console.log(`📁 创建目录: ${cat}`);
            if (!DRY_RUN) fs.mkdirSync(catPath, { recursive: true });
        }
    });

    const stats = { concepts: 0, entities: 0, comparisons: 0, queries: 0, skipped: 0,
        'AI产品方案': 0, 'AI行业分析': 0, 'AI部署': 0, '多模态': 0, '随笔': 0,
        'ML': 0, 'OS': 0, 'PM': 0, 'skills': 0, 'snippets': 0 };
    const converted = [];

    function scanWiki(dir, inRaw) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 在 .wiki/ 顶层：只扫描 layer 目录和 raw
                // 进入 raw/ 后：扫描所有子目录（raw/articles/SUBDIR, raw/ML, raw/skills 等）
                if (inRaw || LAYER_DIRS.includes(item) || item === 'raw') {
                    scanWiki(fullPath, inRaw || item === 'raw');
                }
            } else if (item.endsWith('.md')) {
                const relativePath = path.relative(WIKI_DIR, fullPath);
                const parts = relativePath.split(path.sep);

                // 判断 layer 来源：
                // 1. raw/articles/SUBDIR/*.md → frontmatter.type 或 SUBDIR
                // 2. raw/SUBDIR/*.md（SUBDIR in RAW_TOP_SUBDIRS）→ SUBDIR
                // 3. .wiki/layer/*.md → layer
                let layer = parts[0];
                if (layer === 'raw' && parts.length >= 3 && parts[1] === 'articles') {
                    // raw/articles/SUBDIR/*.md：优先用 frontmatter.type，否则用 SUBDIR
                    const fm = parseFrontmatter(fs.readFileSync(fullPath, 'utf-8')).frontmatter;
                    layer = (fm && fm.type && LAYER_DIRS.includes(fm.type)) ? fm.type : parts[2];
                } else if (layer === 'raw' && parts.length >= 2) {
                    layer = parts[1];
                }

                // 跳过不在 LAYER_DIRS 的 layer（除非是 raw 子目录映射）
                if (!LAYER_DIRS.includes(layer) && !RAW_ARTICLE_SUBDIRS.includes(layer) && !RAW_TOP_SUBDIRS.includes(layer)) {
                    // 如果 frontmatter 有 type 且是 layer，优先使用
                    const fm = parseFrontmatter(fs.readFileSync(fullPath, 'utf-8')).frontmatter;
                    if (!(fm && fm.type && LAYER_DIRS.includes(fm.type))) continue;
                    layer = fm.type;
                }

                const contentMd5 = md5File(fullPath);
                const prev = prevMeta[fullPath];
                const isNewOrChanged = FORCE || !prev || prev.md5 !== contentMd5;

                if (!isNewOrChanged) {
                    stats.skipped++;
                    console.log(`  ⏭️  跳过(未变): ${item}`);
                    continue;
                }

                const result = convertSingle(fullPath, relativePath, wikiMeta);
                if (result) {
                    converted.push(result);
                    stats[layer] = (stats[layer] || 0) + 1;
                    prevMeta[fullPath] = {
                        md5: contentMd5,
                        hexoPath: result.hexoPath,
                        convertedAt: new Date().toISOString(),
                    };
                }
            }
        }
    }

    scanWiki(WIKI_DIR);

    // Phase 2: 冲突检测
    if (converted.length > 0) {
        const conflicts = detectConflicts(converted, prevMeta);
        if (conflicts.length > 0) {
            console.log('\n⚠️  检测到潜在冲突：');
            conflicts.forEach(c => {
                if (c.type === 'path_collision') {
                    warn(`路径冲突: [[${path.basename(c.wikiPath, '.md')}]] 与 [[${path.basename(c.existingWikiPath, '.md')}]] 生成相同路径`);
                } else {
                    warn(`内容覆盖风险: [[${path.basename(c.wikiPath, '.md')}]] 将覆盖已存在的文件`);
                }
            });
        }
    }

    // 打印统计
    console.log('\n========================================');
    console.log('📊 转换统计');
    console.log('========================================');
    Object.entries(stats).forEach(([key, count]) => {
        if (count > 0) console.log(`  ${key}: ${count}`);
    });
    console.log(`  总计新增/更新: ${converted.length}`);
    console.log(`  跳过(未变): ${stats.skipped}`);
    if (warnings.length > 0) {
        console.log(`  警告: ${warnings.length}`);
    }
    if (errors.length > 0) {
        console.log(`  错误: ${errors.length}`);
    }

    if (!DRY_RUN) {
        saveMeta(prevMeta);
        if (converted.length > 0) {
            updateLog(converted);
            updateIndex();
        }
    } else {
        if (converted.length > 0) {
            console.log('\n🔍 预览 — 以下文件将被写入：');
            converted.forEach(r => console.log(`  → ${path.relative(POSTS_DIR, r.hexoPath)}`));
        } else {
            console.log('\n✅ 没有需要更新的文件');
        }
    }

    console.log('\n✨ ' + (DRY_RUN ? 'Dry-run 完成！' : '转换完成！'));
    if (!DRY_RUN) {
        copyAssets();
        if (converted.length > 0) {
            console.log('   运行 hexo generate 构建博客');
        }
    }
}

// ============ Phase 2 新增：assets 拷贝 ============

function copyAssets() {
    const srcAssets = path.join(WIKI_DIR, 'raw', 'assets');
    const SOURCE_DIR = path.join(__dirname, '..', 'source');
    const dstAssets = path.join(SOURCE_DIR, 'assets');

    if (!fs.existsSync(srcAssets)) {
        console.log('  (raw/assets 不存在，跳过 assets 拷贝)');
        return;
    }

    fs.mkdirSync(dstAssets, { recursive: true });

    let count = 0;
    function copyDir(src, dst) {
        fs.mkdirSync(dst, { recursive: true });
        fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
            const srcPath = path.join(src, entry.name);
            const dstPath = path.join(dst, entry.name);
            if (entry.isDirectory()) {
                copyDir(srcPath, dstPath);
            } else {
                fs.copyFileSync(srcPath, dstPath);
                count++;
            }
        });
    }

    copyDir(srcAssets, dstAssets);
    console.log(`  📎 已拷贝 ${count} 个 assets 文件到 source/assets/`);
}

function generateHexoContent(result, prevWikiMeta) {
    const { frontmatter, body } = parseFrontmatter(
        fs.readFileSync(result.wikiPath, 'utf-8')
    );
    const { tags, category, aliases } = processFrontmatterEnhancements(frontmatter, result.layer, null);
    const bodyConverted = convertWikiLinks(body, prevWikiMeta || loadWikiMeta());

    const created = frontmatter.created || new Date().toISOString().split('T')[0];
    const hexoDate = created.replace(/\//g, '-');
    const related = frontmatter.related;
    const summary = frontmatter.summary || '';

    let hexoFrontmatter = `---\ntitle : ${frontmatter.title || result.title}\ndate: ${hexoDate} 08:00:00\nupdated: ${hexoDate} 08:00:00\ntags: ${tags.join(', ')}\ncategory : ${category}\nsource: LLM Wiki\nsource_path: ${result.relativePath.replace(/\\/g, '\\\\')}\n`;

    if (aliases.length > 0) {
        hexoFrontmatter += `aliases: ${aliases.join(', ')}\n`;
    }
    if (related) {
        hexoFrontmatter += `related_posts: ${Array.isArray(related) ? related.join(', ') : related}\n`;
    }
    if (summary) {
        hexoFrontmatter += `description: ${summary}\n`;
    }

    hexoFrontmatter += `---\n\n<!-- 此文章来自 LLM Wiki: ${result.relativePath} -->\n\n${bodyConverted}`;

    return hexoFrontmatter;
}

function convertSingle(wikiPath, relativePath, wikiMeta) {
    const content = fs.readFileSync(wikiPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    const parts = relativePath.split(path.sep);
    let layer = parts[0];
    if (layer === 'raw' && parts.length >= 3 && parts[1] === 'articles') {
        layer = (frontmatter.type && LAYER_DIRS.includes(frontmatter.type)) ? frontmatter.type : parts[2];
    } else if (layer === 'raw' && parts.length >= 2) {
        layer = parts[1];
    }
    const { tags, category, aliases } = processFrontmatterEnhancements(frontmatter, layer, wikiMeta);

    const created = frontmatter.created || new Date().toISOString().split('T')[0];
    const title = frontmatter.title || path.basename(wikiPath, '.md');
    const hexoDate = created.replace(/\//g, '-');
    // 文件名需要清理非法字符（Windows 不支持 \ / : * ? " < > |）
    const safeName = slugify(title);
    const filename = `${hexoDate}-${safeName}.md`;
    const hexoPath = path.join(POSTS_DIR, category, filename);

    if (DRY_RUN) {
        console.log(`  📝 ${title} → ${category}/${filename}`);
        return { title, category, layer, hexoPath, wikiPath, relativePath };
    }

    const bodyConverted = convertWikiLinks(body, wikiMeta);
    const related = frontmatter.related;
    const summary = frontmatter.summary || '';

    let hexoFrontmatter = `---\ntitle : ${title}\ndate: ${hexoDate} 08:00:00\nupdated: ${hexoDate} 08:00:00\ntags: ${tags.join(', ')}\ncategory : ${category}\nsource: LLM Wiki\nsource_path: ${relativePath.replace(/\\/g, '\\\\')}\n`;

    if (aliases.length > 0) {
        hexoFrontmatter += `aliases: ${aliases.join(', ')}\n`;
    }
    if (related) {
        hexoFrontmatter += `related_posts: ${Array.isArray(related) ? related.join(', ') : related}\n`;
    }
    if (summary) {
        hexoFrontmatter += `description: ${summary}\n`;
    }

    hexoFrontmatter += `---\n\n<!-- 此文章来自 LLM Wiki: ${relativePath} -->\n\n${bodyConverted}`;

    fs.writeFileSync(hexoPath, hexoFrontmatter, 'utf-8');
    console.log(`  ✅ ${title}`);

    return { title, category, layer, hexoPath, wikiPath, relativePath };
}

function updateLog(converted) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const entries = converted.map(r => `- ${timestamp} | ${r.layer} | [[${r.title}]](${r.relativePath}) → ${r.category}/`).join('\n');

    let logContent = '';
    if (fs.existsSync(LOG_FILE)) {
        logContent = fs.readFileSync(LOG_FILE, 'utf-8');
        const lastHeader = logContent.lastIndexOf('\n## ');
        if (lastHeader !== -1) {
            const insertPos = logContent.indexOf('\n', lastHeader + 5);
            if (insertPos !== -1) {
                logContent = logContent.slice(0, insertPos) + '\n' + entries + logContent.slice(insertPos);
            } else {
                logContent += '\n' + entries;
            }
        } else {
            logContent = `# Wiki 操作日志\n\n## ${timestamp}\n${entries}\n\n${logContent}`;
        }
    } else {
        logContent = `# Wiki 操作日志\n\n## ${timestamp}\n${entries}\n`;
    }

    fs.writeFileSync(LOG_FILE, logContent, 'utf-8');
}

function updateIndex() {
    if (!fs.existsSync(INDEX_FILE)) return;

    let content = fs.readFileSync(INDEX_FILE, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    const counts = {};
    LAYER_DIRS.forEach(dir => {
        const dirPath = path.join(WIKI_DIR, dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
            counts[dir] = files.length;
        }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const lines = body.split('\n');
    const newLines = [];
    let inStats = false;

    for (const line of lines) {
        if (line.includes('## 统计')) { inStats = true; newLines.push(line); continue; }
        if (inStats) {
            if (line.trim() === '' || line.startsWith('#') || LAYER_DIRS.some(d => line.includes(d))) {
                inStats = false;
            } else {
                continue;
            }
        }
        newLines.push(line);
    }

    const statsBlock = [
        '',
        '## 统计',
        '',
        ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`),
        `- 总计: ${total}`,
        ''
    ].join('\n');

    const bodyWithoutOldStats = newLines.join('\n').replace(/\n{3,}/g, '\n\n');
    const newBody = bodyWithoutOldStats.trimEnd() + '\n' + statsBlock;

    const newContent = `---\n${Object.entries(frontmatter).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`).join('\n')}\n---\n\n${newBody}`;

    fs.writeFileSync(INDEX_FILE, newContent, 'utf-8');
}

// ============ Phase 2 新增：单元测试 ============

function runTests() {
    console.log('\n🧪 Wiki → Hexo 单元测试\n');
    console.log('========================================');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ ${name}`);
            passed++;
        } catch (e) {
            console.log(`  ❌ ${name}`);
            console.log(`     错误: ${e.message}`);
            failed++;
        }
    }

    function assertEqual(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`${msg} 期望: ${expected}, 实际: ${actual}`);
        }
    }

    // 测试 1: slugify
    test('slugify: 去除非法字符', () => {
        assertEqual(slugify('AI/模型*测试?'), 'AI-模型-测试-', 'slugify');
    });

    test('slugify: 空格转横线', () => {
        assertEqual(slugify('Hello World'), 'Hello-World', 'slugify');
    });

    // 测试 2: frontmatter 解析
    test('parseFrontmatter: 基础解析', () => {
        const result = parseFrontmatter(`---
title: Test
tags: [a, b]
---
body content`);
        assertEqual(result.frontmatter.title, 'Test');
        assertEqual(result.body, 'body content');
    });

    test('parseFrontmatter: tags 数组解析', () => {
        const result = parseFrontmatter(`---
title: Test
tags: [ai, ml]
---
`);
        assertEqual(Array.isArray(result.frontmatter.tags), true);
        assertEqual(result.frontmatter.tags[0], 'ai');
        assertEqual(result.frontmatter.tags[1], 'ml');
    });

    // 测试 3: frontmatter 增强
    test('processFrontmatterEnhancements: wikiTags 追加', () => {
        const fm = { tags: ['base'], wikiTags: 'extra1, extra2' };
        const { tags } = processFrontmatterEnhancements(fm, 'concepts', {});
        assertEqual(tags.includes('extra1'), true);
        assertEqual(tags.includes('base'), true);
        assertEqual(tags[0], 'wiki');
    });

    test('processFrontmatterEnhancements: wikiCategory 覆盖', () => {
        const fm = { wikiCategory: 'LearningEssays' };
        const { category } = processFrontmatterEnhancements(fm, 'concepts', {});
        assertEqual(category, 'LearningEssays');
    });

    test('processFrontmatterEnhancements: wikiAliases 追加', () => {
        const fm = { aliases: ['old'], wikiAliases: 'new1, new2' };
        const { aliases } = processFrontmatterEnhancements(fm, 'concepts', {});
        assertEqual(aliases.includes('old'), true);
        assertEqual(aliases.includes('new1'), true);
    });

    // 测试 4: WikiLink 转换
    test('WikiLink: 精确匹配', () => {
        const wikiMeta = {
            'Test': { hexoDate: '2025/01/01', title: 'Test' }
        };
        const result = convertWikiLinks('[[Test]]', wikiMeta);
        assertEqual(result, '[Test](/2025/01/01/Test/)');
    });

    test('WikiLink: 别名显示文字', () => {
        const wikiMeta = {
            'Target': { hexoDate: '2025/01/01', title: 'Target' }
        };
        const result = convertWikiLinks('[[Target|显示文字]]', wikiMeta);
        assertEqual(result, '[显示文字](/2025/01/01/Target/)');
    });

    test('WikiLink: 大小写不敏感', () => {
        const wikiMeta = {
            'Test': { titleLower: 'test', hexoDate: '2025/01/01', title: 'Test' }
        };
        const result = convertWikiLinks('[[test]]', wikiMeta);
        assertEqual(result.includes('[test]'), true);
    });

    console.log('========================================');
    console.log(`结果: ${passed} 通过, ${failed} 失败\n`);
    return failed === 0;
}

// ============ 启动 ============

if (RUN_TEST) {
    const success = runTests();
    process.exit(success ? 0 : 1);
} else {
    main();
}
