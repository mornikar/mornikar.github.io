/**
 * copy-assets.js
 * 将 .wiki/raw/assets/ 和 .wiki/raw/snippets/ 的二进制文件同步到网站
 * - 直接写入 public/assets/（hexo generate 之后执行）
 * - 生成 source/assets-archive.md 作为存档浏览页（hexo generate 会渲染它）
 *
 * 调用顺序（CI/local）：
 *   1. wiki-to-hexo.js（转换 md 文件）
 *   2. hexo generate（生成博客 HTML）
 *   3. THIS SCRIPT（复制二进制资产 + 生成存档页）
 *
 * 用法: node scripts/copy-assets.js
 */
const fs = require('fs');
const path = require('path');

const WIKI_DIR  = path.join(__dirname, '..', '.wiki');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ASSETS_PUBLIC = path.join(PUBLIC_DIR, 'assets');
const ARCHIVE_SRC  = path.join(__dirname, '..', 'source', 'assets-archive.md');
const SITE_ROOT = '/Mornikar/';

function withSiteRoot(urlPath) {
    return SITE_ROOT + urlPath.replace(/^\/+/, '');
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

/**
 * 扫描目录下所有二进制资产文件
 * @param {string} rootDir - 要扫描的根目录（不含末尾斜杠）
 * @param {string} urlBase - URL 前缀，如 'assets'
 * @returns {{name,url,src,size,sizeStr,ext}[]}
 */
function scanAssets(rootDir, urlBase) {
    const files = [];
    const dirs = [rootDir];
    while (dirs.length > 0) {
        const dir = dirs.shift();
        if (!fs.existsSync(dir)) continue;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
                dirs.push(full);
            } else if (item.isFile()) {
                const ext = path.extname(item.name).toLowerCase();
                if (['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.txt'].includes(ext)) {
                    const stat = fs.statSync(full);
                    // URL: /Mornikar/assets/subdir/file.pdf（相对于 rootDir 的路径）
                    const relRaw = path.relative(rootDir, full); // 'subdir/file.pdf'
                    const rel = relRaw.replace(/\\/g, '/'); // 确保是 / 分隔
                    const url = withSiteRoot(urlBase + '/' + rel);
                    files.push({
                        name: item.name,
                        url: url,
                        src: full, // 完整源路径
                        mtimeMs: stat.mtimeMs,
                        size: stat.size,
                        sizeStr: formatSize(stat.size),
                        ext: ext,
                    });
                }
            }
        }
    }
    return files;
}

// 扫描两个来源
const rawAssetsFiles   = scanAssets(path.join(WIKI_DIR, 'raw', 'assets'),   'assets');
const rawSnippetsFiles = scanAssets(path.join(WIKI_DIR, 'raw', 'snippets'), 'assets');

// 按完整 url 去重（raw/assets 优先）
const seen = new Map();
const allFiles = [...rawAssetsFiles, ...rawSnippetsFiles];
for (const f of allFiles) {
    // seen key 包含完整 url（包括子目录），确保不误合并不同路径的文件
    if (!seen.has(f.url) || f.src.includes(path.join(WIKI_DIR, 'raw', 'assets'))) {
        seen.set(f.url, f);
    }
}
const uniqueFiles = [...seen.values()];

// 按 URL 排序
uniqueFiles.sort((a, b) => a.url.localeCompare(b.url));

console.log(`\n=== 资产复制 ===`);
console.log(`扫描到 ${uniqueFiles.length} 个资产文件（去重后）\n`);

// 复制到 public/assets/
let copied = 0, skipped = 0;
for (const f of uniqueFiles) {
    // URL: /Mornikar/assets/subdir/file.pdf → rel: subdir/file.pdf
    const rel = f.url.replace(new RegExp('^' + SITE_ROOT.replace(/\//g, '\\/') + 'assets\\/'), '');
    const dst = path.join(ASSETS_PUBLIC, rel);
    const dstDir = path.dirname(dst);

    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });

    if (fs.existsSync(dst)) {
        const ds = fs.statSync(dst);
        if (ds.mtimeMs >= f.mtimeMs && ds.size === f.size) { skipped++; continue; }
    }

    fs.copyFileSync(f.src, dst);
    fs.utimesSync(dst, new Date(), new Date(f.mtimeMs));
    copied++;
    console.log(`  ${copied}. ${f.url} (${f.sizeStr})`);
}
console.log(`\n复制完成：${copied} 新增/更新，${skipped} 未变`);

// 生成存档页面
const iconMap = {
    '.pdf': '📄', '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️',
    '.gif': '🖼️', '.webp': '🖼️', '.svg': '🖼️', '.txt': '📝',
};

// 按子目录分组
const groups = {};
for (const f of uniqueFiles) {
    const rel = f.url.replace(new RegExp('^' + SITE_ROOT.replace(/\//g, '\\/') + 'assets\\/'), '');
    const parts = rel.split('/');
    const group = parts.length > 1 ? parts[0] : '根目录';
    if (!groups[group]) groups[group] = [];
    groups[group].push(f);
}

const sections = Object.entries(groups).map(([group, files]) => {
    const rows = files.map(f =>
        // 使用 encodeURI 预编码 URL，避免 Hexo marked 解析中文链接时出错
        `| ${iconMap[f.ext] || '📄'} | [${f.name}](${encodeURI(f.url)}) | ${f.sizeStr} |`
    ).join('\n');
    return `### ${group}\n\n| 类型 | 文件名 | 大小 |\n|------|--------|------|\n${rows}`;
}).join('\n\n---\n\n');

const today = new Date().toISOString().split('T')[0];
const archiveMd = `---
title: 资源存档
date: ${today} 00:00:00
layout: page
permalink: /assets-archive/
---

# 📦 资源存档

> 共 **${uniqueFiles.length}** 个文件，来自 \`.wiki/raw/assets/\` 和 \`.wiki/raw/snippets/\`

---

${sections}
`;

fs.writeFileSync(ARCHIVE_SRC, archiveMd, 'utf-8');
console.log(`\n生成存档页面: source/assets-archive.md`);
console.log(`\n✅ 全部完成！`);
