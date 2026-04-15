/**
 * Wiki → Hexo 转换脚本 v3.0 (增强版)
 * 功能：
 *   - [[WikiLink]] 自动转换为 Hexo 链接
 *   - 增量转换（mtime 对比，跳过未变更文件）
 *   - --dry-run 预览模式
 *   - 自动维护 index.md 和 log.md
 *   - 支持 aliases / related / summary 字段
 *
 * 用法：
 *   node wiki-to-hexo.js           # 全量/增量转换
 *   node wiki-to-hexo.js --dry-run  # 预览，不写入文件
 *   node wiki-to-hexo.js --force     # 强制全量转换
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
const META_FILE   = path.join(__dirname, '.wiki-meta.json'); // 记录上次转换状态

// 目录 → Hexo 分类映射
const CATEGORY_MAP = {
    concepts:    'LearningNote',
    entities:    'LearningEssays',
    comparisons: 'LearningNote',
    queries:     'LearningNote',
};

// Wiki 层名称
const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];

// ============ 参数解析 ============
const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const FORCE     = args.includes('--force');

// ============ 工具函数 ============

/** 计算文件 MD5（用于判断内容是否变化） */
function md5File(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
}

/** 读取上次转换状态 */
function loadMeta() {
    try {
        return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

/** 保存转换状态 */
function saveMeta(meta) {
    if (!DRY_RUN) fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

/** 解析 YAML frontmatter */
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
                value = value.slice(1, -1).split(',').map(v => v.trim());
            }
            frontmatter[key] = value;
        }
    });

    return { frontmatter, body };
}

/**
 * 将 [[WikiLink]] 转换为 Hexo Markdown 链接
 * [[RAG检索增强]] → [RAG检索增强](/2025/09/12/RAG检索增强生成/)
 * [[另一个页面|显示文字]] → [显示文字](/2025/09/12/另一个页面/)
 *
 * 匹配策略（按优先级）：
 *   1. 精确匹配 title
 *   2. 忽略大小写匹配
 *   3. 模糊匹配：WikiLink 是 title 的前缀（如 [[RAG]] 匹配 "RAG检索增强生成"）
 *   4. 最后降级为相对路径
 */
function convertWikiLinks(body, wikiMeta) {
    return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, label) => {
        const display = label || target.trim();
        const slug = target.trim();

        let meta = wikiMeta[slug];

        // 2. 忽略大小写
        if (!meta) {
            const lower = slug.toLowerCase();
            meta = Object.values(wikiMeta).find(m => m.titleLower === lower);
        }

        // 3. 模糊匹配：WikiLink 是 title 的前缀
        if (!meta) {
            const lower = slug.toLowerCase();
            meta = Object.values(wikiMeta).find(m => m.titleLower.startsWith(lower));
        }

        if (meta) {
            const hexoPath = `${meta.hexoDate}/${meta.title}`;
            return `[${display}](/${hexoPath}/)`;
        }

        // 4. 找不到时降级为相对路径
        return `[${display}](/${slug}/)`;
    });
}

/** 生成 Hexo 友好的 slug */
function slugify(title) {
    return title
        .replace(/[\\/:*?"<>|]/g, '-')  // 去除非法字符
        .replace(/\s+/g, '-')
        .trim();
}

/** 加载所有 wiki 页面元数据（用于 WikiLink 转换） */
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

// ============ 主逻辑 ============

function main() {
    console.log('\n🚀 Wiki → Hexo 转换脚本 v3.0\n');
    if (DRY_RUN) console.log('🔍 [Dry-run 模式] 仅预览，不写入文件\n');

    // 加载上次状态
    const prevMeta = loadMeta();
    const wikiMeta = loadWikiMeta();

    // 确保输出目录存在
    Object.values(CATEGORY_MAP).forEach(cat => {
        const catPath = path.join(POSTS_DIR, cat);
        if (!fs.existsSync(catPath)) {
            console.log(`📁 创建目录: ${cat}`);
            if (!DRY_RUN) fs.mkdirSync(catPath, { recursive: true });
        }
    });

    const stats = { concepts: 0, entities: 0, comparisons: 0, queries: 0, skipped: 0 };
    const converted = []; // 本次转换的页面列表
    const now = new Date().toISOString();

    function scanWiki(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (LAYER_DIRS.includes(item) || item === 'raw') {
                    scanWiki(fullPath);
                }
            } else if (item.endsWith('.md')) {
                const relativePath = path.relative(WIKI_DIR, fullPath);
                const layer = relativePath.split(path.sep)[0];

                if (layer !== 'concepts' && layer !== 'entities' &&
                    layer !== 'comparisons' && layer !== 'queries') {
                    continue;
                }

                // 增量判断
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

                    // 更新状态
                    prevMeta[fullPath] = {
                        md5: contentMd5,
                        hexoPath: result.hexoPath,
                        convertedAt: now,
                    };
                }
            }
        }
    }

    scanWiki(WIKI_DIR);

    // 打印统计
    console.log('\n========================================');
    console.log('📊 转换统计');
    console.log('========================================');
    Object.entries(stats).forEach(([key, count]) => {
        if (count > 0) console.log(`  ${key}: ${count}`);
    });
    console.log(`  总计新增/更新: ${converted.length}`);
    console.log(`  跳过(未变): ${stats.skipped}`);

    if (!DRY_RUN) {
        saveMeta(prevMeta);
        if (converted.length > 0) {
            updateLog(converted);
            updateIndex();
        }
    } else {
        if (converted.length > 0) {
            console.log('\n🔍 预览 — 以下文件将被写入：');
            converted.forEach(r => console.log(`  → ${r.hexoPath}`));
        } else {
            console.log('\n✅ 没有需要更新的文件');
        }
    }

    console.log('\n✨ ' + (DRY_RUN ? 'Dry-run 完成！' : '转换完成！'));
    if (!DRY_RUN && converted.length > 0) {
        console.log('   运行 hexo generate 构建博客');
    }
}

function convertSingle(wikiPath, relativePath, wikiMeta) {
    const content = fs.readFileSync(wikiPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    const layer = relativePath.split(path.sep)[0];
    const category = CATEGORY_MAP[layer] || 'LearningNote';

    // 日期
    const created = frontmatter.created || new Date().toISOString().split('T')[0];
    const dateStr = created.replace(/-/g, '/');

    // 标题
    const title = frontmatter.title || path.basename(wikiPath, '.md');

    // 标签
    let tags = frontmatter.tags || [];
    if (!Array.isArray(tags)) tags = [tags];
    if (!tags.includes('wiki')) tags.unshift('wiki');

    // WikiLink 转换
    const bodyConverted = convertWikiLinks(body, wikiMeta);

    // 文件名
    const filename = `${created.replace(/-/g, '-')}-${title}.md`;
    const hexoPath = path.join(POSTS_DIR, category, filename);

    if (DRY_RUN) {
        console.log(`  📝 ${title} → ${category}/${filename}`);
        return { title, category, layer, hexoPath, wikiPath };
    }

    // 生成 Hexo frontmatter
    const aliases = frontmatter.aliases;
    const related = frontmatter.related;
    const summary = frontmatter.summary || '';

    let hexoFrontmatter = `---\ntitle : ${title}\ndate: ${dateStr} 08:00:00\nupdated: ${dateStr} 08:00:00\ntags: ${tags.join(', ')}\ncategory : ${category}\nsource: LLM Wiki\nsource_path: ${relativePath.replace(/\\/g, '\\\\')}\n`;

    if (aliases) {
        hexoFrontmatter += `aliases: ${Array.isArray(aliases) ? aliases.join(', ') : aliases}\n`;
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

    return { title, category, layer, hexoPath, wikiPath };
}

/** 更新 log.md */
function updateLog(converted) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const entries = converted.map(r => `- ${timestamp} | ${r.layer} | [[${r.title}]](${path.relative(WIKI_DIR, r.wikiPath)}) → ${r.category}/`).join('\n');

    let logContent = '';
    if (fs.existsSync(LOG_FILE)) {
        logContent = fs.readFileSync(LOG_FILE, 'utf-8');
        // 找到最后一个 ## 标题，在其下追加
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

/** 更新 index.md */
function updateIndex() {
    if (!fs.existsSync(INDEX_FILE)) return;

    let content = fs.readFileSync(INDEX_FILE, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // 统计各层数量
    const counts = {};
    LAYER_DIRS.forEach(dir => {
        const dirPath = path.join(WIKI_DIR, dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
            counts[dir] = files.length;
        }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // 更新统计行
    const lines = body.split('\n');
    const newLines = [];
    let inStats = false;

    for (const line of lines) {
        if (line.includes('## 统计')) { inStats = true; newLines.push(line); continue; }
        if (inStats) {
            if (line.trim() === '' || line.startsWith('#') || LAYER_DIRS.some(d => line.includes(d))) {
                inStats = false;
            } else {
                // 跳过旧统计行
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

    // 重新组装
    const bodyWithoutOldStats = newLines.join('\n').replace(/\n{3,}/g, '\n\n');
    const newBody = bodyWithoutOldStats.trimEnd() + '\n' + statsBlock;

    const newContent = `---\n${Object.entries(frontmatter).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`).join('\n')}\n---\n\n${newBody}`;

    fs.writeFileSync(INDEX_FILE, newContent, 'utf-8');
}

main();
