'use strict';
/**
 * Hexo 7 + hexo-renderer-pug 3.0 兼容层
 *
 * 问题：Hexo 7 的 _buildLocals 把 frontmatter 字段扁平化为 locals 的顶层 key
 * （如 locals.title、locals.content），而不是放在 locals.page 下。
 * hexo-renderer-pug 的 pug.compile() 生成的函数需要 locals.page 对象。
 * 此 patch 在编译函数调用前，检测并重建 page 对象。
 */
hexo.on('ready', () => {
  const fs = require('fs');
  const path = require('path');

  // 重写 hexo-renderer-pug 的 compile 函数，在调用前注入 page 对象
  try {
    const pugDir = path.dirname(require.resolve('hexo-renderer-pug'));
    const pugPath = path.join(pugDir, 'lib/pug.js');
    const newContent = `'use strict';
const path = require('path');
const pug = require('pug');

const configPath = path.join(process.cwd(), 'pug.config');
const defaultConfig = { compile: {} };

let hasConfig = true;
try {
  require.resolve(configPath);
} catch {
  hasConfig = false;
}

const config = hasConfig ? require(configPath) : defaultConfig;

const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
const invalidKeys = Object.keys(config).filter(k => !hasProp(defaultConfig, k));
if (invalidKeys.length > 0) {
  throw Error('Unsupported PUG config keys: ' + invalidKeys.join(', '));
}

function pugCompile(data) {
  const opts = {
    ...config.compile,
    filename: data.path
  };
  return pug.compile(data.text, opts);
}

function pugRenderer(data, locals) {
  // 注入 page 对象：Hexo 7 frontmatter 扁平化，重建 page
  if (!locals.page || typeof locals.page !== 'object') {
    const page = {};
    for (const key of Object.keys(locals)) {
      if (typeof locals[key] !== 'function') {
        page[key] = locals[key];
      }
    }
    locals.page = page;
  }
  return pugCompile(data)(locals);
}

pugRenderer.compile = (data) => {
  const fn = pugCompile(data);
  return (locals) => {
    // 同上，compile 路径也需要注入 page
    if (!locals.page || typeof locals.page !== 'object') {
      const page = {};
      for (const key of Object.keys(locals)) {
        if (typeof locals[key] !== 'function') {
          page[key] = locals[key];
        }
      }
      locals.page = page;
    }
    return fn(locals);
  };
};

module.exports = pugRenderer;
`;
    fs.writeFileSync(pugPath, newContent);
    console.log('[hexo7-pug-fix] hexo-renderer-pug/lib/pug.js rewritten (page injection)');
  } catch(e) {
    console.error('[hexo7-pug-fix] pug.js rewrite failed:', e.message);
  }
});
