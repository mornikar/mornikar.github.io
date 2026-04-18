'use strict';

const stylus = require('stylus');
const fs = require('fs');
const path = require('path');

const hexoRoot = path.join(__dirname, '..');
const cssDir = path.join(hexoRoot, 'themes/arknights/source/css');
const publicCssDir = path.join(hexoRoot, 'public/css');

function compile() {
  if (!fs.existsSync(publicCssDir)) {
    fs.mkdirSync(publicCssDir, { recursive: true });
  }
  const srcPath = path.join(cssDir, 'arknights.styl');
  if (!fs.existsSync(srcPath)) {
    console.error('compile_css: source not found:', srcPath);
    return;
  }
  const src = fs.readFileSync(srcPath, 'utf8');
  stylus(src)
    .set('filename', srcPath)
    .set('paths', [
      path.join(cssDir, '_modules'),
      path.join(cssDir, '_core'),
      path.join(cssDir, '_custom'),
      path.join(cssDir, '_page'),
      path.join(cssDir, '_modules/cards'),
      path.join(cssDir, '_modules/comments'),
      path.join(cssDir, '_modules/search'),
    ])
    .render(function(err, css) {
      if (err) {
        console.error('compile_css ERROR:', err.message);
        return;
      }
      const outPath = path.join(publicCssDir, 'arknights.css');
      fs.writeFileSync(outPath, css);
      console.log('compile_css: written', css.length, 'bytes to public/css/arknights.css');
    });
}

// 本地 hexo generate 时自动触发
if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('after_generate', compile);
}

// CLI 直接调用
if (require.main === module) {
  compile();
}
