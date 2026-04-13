/**
 * Wiki → Hexo 转换脚本 v2.0
 * 将 .wiki/ 目录下的 Markdown 文件转换为 Hexo 格式
 */

'use strict';

const fs = require('fs');
const path = require('path');

const WIKI_PATH = path.join(__dirname, '..', '.wiki');
const HEXO_POSTS = path.join(__dirname, '..', 'source', '_posts');

// 目录到分类的映射
const CATEGORY_MAP = {
    'concepts': 'LearningNote',
    'entities': 'LearningEssays',
    'comparisons': 'LearningNote',
    'queries': 'LearningNote'
};

console.log('🚀 Wiki → Hexo 转换脚本\n');
console.log(`Wiki 目录: ${WIKI_PATH}`);
console.log(`Hexo 目录: ${HEXO_POSTS}\n`);

// 确保输出目录存在
Object.values(CATEGORY_MAP).forEach(cat => {
    const catPath = path.join(HEXO_POSTS, cat);
    if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath, { recursive: true });
        console.log(`📁 创建目录: ${cat}`);
    }
});

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(content) {
    const trimmed = content.trimStart();
    const firstDash = trimmed.indexOf('---');
    if (firstDash !== 0) return { frontmatter: {}, body: content };

    const secondDash = trimmed.indexOf('---', 3);
    if (secondDash === -1) return { frontmatter: {}, body: content };

    const yamlStr = trimmed.slice(3, secondDash).trim();
    let body = trimmed.slice(secondDash + 3).trim();

    // 移除 wiki frontmatter
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
 * 转换单个 wiki 文件到 Hexo 格式
 */
function convertFile(wikiPath, relativePath) {
    const content = fs.readFileSync(wikiPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // 确定分类
    const dir = relativePath.split(path.sep)[0];
    const category = CATEGORY_MAP[dir] || 'LearningNote';

    // 解析日期
    const created = frontmatter.created || new Date().toISOString().split('T')[0];
    const dateStr = created.replace(/-/g, '/');

    // 解析标签
    let tags = frontmatter.tags || [];
    if (!Array.isArray(tags)) tags = [tags];
    if (!tags.includes('wiki')) tags.unshift('wiki');

    // 文件名
    const title = frontmatter.title || path.basename(wikiPath, '.md');
    const datePrefix = created.replace(/-/g, '-');
    const filename = `${datePrefix}-${title}.md`;
    const outputPath = path.join(HEXO_POSTS, category, filename);

    // 生成 Hexo frontmatter
    const hexoFrontmatter = `---
title : ${title}
date: ${dateStr} 08:00:00
updated: ${dateStr} 08:00:00
tags: ${tags.join(', ')}
category : ${category}
source: LLM Wiki
source_path: ${relativePath.replace(/\\/g, '\\\\')}
---

<!-- 此文章来自 LLM Wiki: ${relativePath} -->

${body}`;

    fs.writeFileSync(outputPath, hexoFrontmatter, 'utf-8');
    console.log(`  ✅ ${title}`);
    return { title, category };
}

/**
 * 扫描并转换 wiki 目录
 */
function scanWiki(dir, stats = { concepts: 0, entities: 0, comparisons: 0, queries: 0 }) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (['concepts', 'entities', 'comparisons', 'queries'].includes(item)) {
                console.log(`\n📚 处理 ${item}...`);
                scanWiki(fullPath, stats);
                stats[item] = stats[item] || 0;
            } else if (item !== 'raw') {
                scanWiki(fullPath, stats);
            }
        } else if (item.endsWith('.md')) {
            const relativePath = path.relative(WIKI_PATH, fullPath);
            const dirName = relativePath.split(path.sep)[0];
            stats[dirName] = (stats[dirName] || 0) + 1;
            convertFile(fullPath, relativePath);
        }
    });

    return stats;
}

// 执行转换
const stats = scanWiki(WIKI_PATH);

console.log('\n========================================');
console.log('📊 转换统计');
console.log('========================================');
Object.entries(stats).forEach(([key, count]) => {
    if (count > 0) console.log(`  ${key}: ${count}`);
});
console.log(`  总计: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

console.log('\n✨ 转换完成！');
console.log('   现在可以运行 hexo generate 构建博客');
