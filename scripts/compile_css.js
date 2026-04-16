// 手动编译主题 CSS 输出到 public/css/
// 修复 hexo-renderer-stylus 多级 import bug
const stylus = require('stylus');
const fs = require('fs');
const path = require('path');

// 计算项目根目录（scripts 的父目录）
const hexoRoot = path.join(__dirname, '..');
const cssDir = path.join(hexoRoot, 'themes/arknights/source/css');
const publicCssDir = path.join(hexoRoot, 'public/css');

const src = fs.readFileSync(path.join(cssDir, 'arknights.styl'), 'utf8');

stylus(src)
  .set('filename', path.join(cssDir, 'arknights.styl'))
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
      console.error('ERROR:', err.message);
      process.exit(1);
    }
    fs.writeFileSync(path.join(publicCssDir, 'arknights.css'), css);
    console.log('Compiled CSS written to public/css/arknights.css');
    console.log('Size:', css.length, 'bytes');
    const lines = css.split('\n').filter(l => l.includes('wiki-chat'));
    console.log('wiki-chat lines:', lines.length);
  });
