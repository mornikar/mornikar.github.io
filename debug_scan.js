// 调试：直接模拟 scanWiki 的逻辑，看看为什么 raw 文件没被处理
const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.join(__dirname, '.wiki');
const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];
const RAW_ARTICLE_SUBDIRS = ['AI产品方案', 'AI行业分析', 'AI部署', '多模态', '随笔'];
const RAW_TOP_SUBDIRS = ['ML', 'OS', 'PM', 'skills', 'snippets'];

function scanWiki(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            const willRecurse = LAYER_DIRS.includes(item.name) || item.name === 'raw';
            console.log(`[REcurse? ${willRecurse}] DIR: ${path.relative(WIKI_DIR, fullPath)}`);
            if (willRecurse) {
                scanWiki(fullPath);
            }
        } else if (item.name.endsWith('.md')) {
            const relativePath = path.relative(WIKI_DIR, fullPath);
            const parts = relativePath.split(path.sep);
            let layer = parts[0];
            if (layer === 'raw' && parts.length >= 3 && parts[1] === 'articles') {
                layer = parts[2];
            } else if (layer === 'raw' && parts.length >= 2) {
                layer = parts[1];
            }
            const skip = !LAYER_DIRS.includes(layer) && !RAW_ARTICLE_SUBDIRS.includes(layer) && !RAW_TOP_SUBDIRS.includes(layer);
            console.log(`  [${skip ? 'SKIP' : 'OK  '}] ${relativePath} (layer=${layer})`);
        }
    }
}

console.log('--- scan .wiki/ ---');
scanWiki(WIKI_DIR);
