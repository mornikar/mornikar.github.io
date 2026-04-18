const path = require('path');
const fs = require('fs');

const WIKI_DIR = path.join(__dirname, '.wiki');
const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];
const RAW_ARTICLE_SUBDIRS = ['AI产品方案', 'AI行业分析', 'AI部署', '多模态', '随笔'];

function scan(dir, depth) {
    const indent = '  '.repeat(depth);
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
            console.log(indent + '[DIR] ' + item.name);
            scan(full, depth + 1);
        } else if (item.name.endsWith('.md')) {
            const rel = path.relative(WIKI_DIR, full);
            const parts = rel.split(path.sep);
            let layer = parts[0];
            if (layer === 'raw' && parts.length >= 3 && parts[1] === 'articles') {
                layer = parts[2];
            } else if (layer === 'raw' && parts.length >= 2) {
                layer = parts[1];
            }
            const skip = !LAYER_DIRS.includes(layer) && !RAW_ARTICLE_SUBDIRS.includes(layer);
            console.log(indent + (skip ? '[SKIP] ' : '[OK]   ') + rel + ' (layer=' + layer + ')');
        }
    }
}

console.log('=== .wiki/raw/articles/ ===');
scan(path.join(WIKI_DIR, 'raw', 'articles'), 0);
console.log('\n=== .wiki/raw/ML/ ===');
scan(path.join(WIKI_DIR, 'raw', 'ML'), 0);
console.log('\n=== .wiki/raw/skills/ ===');
scan(path.join(WIKI_DIR, 'raw', 'skills'), 0);
