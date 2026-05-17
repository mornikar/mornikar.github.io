/**
 * 将 .docs-src/ 的 markdown 文件转换为 HTML
 * 输出到 public/docs/，与 Hexo 生成的文章保持一致的 URL 结构
 *
 * 输入结构：
 *   .docs-src/
 *     index.md              → public/docs/index.html
 *     PROJECT/index.md      → public/docs/PROJECT/index.html
 *     MAINTENANCE/index.md  → public/docs/MAINTENANCE/index.html
 *     ...
 */

const fs = require('fs');
const path = require('path');
const marked = require('marked');

const SRC_DIR = path.join(__dirname, '..', '.docs-src');
const DST_DIR = path.join(__dirname, '..', 'public', 'docs');
const SITE_ROOT = '/Mornikar/';

// 统一用正斜杠（兼容 Windows）
const SEP = '/';

function withSiteRoot(urlPath) {
  return SITE_ROOT + urlPath.replace(/^\/+/, '');
}

function toUnixPath(p) {
  return p.replace(/\\/g, SEP);
}

// 读取全部 .md 文件
function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

const files = walkDir(SRC_DIR);
if (files.length === 0) {
  console.log('docs: 无 markdown 文件，跳过');
  process.exit(0);
}

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

// 生成每个 HTML 文件
for (const srcFile of files) {
  // 计算相对路径（统一用正斜杠）
  const rel = toUnixPath(path.relative(SRC_DIR, srcFile)); // e.g. "PROJECT/index.md"
  const relNoExt = rel.replace(/\.md$/, '');                // e.g. "PROJECT/index"

  // 确定输出路径
  let dstDir, dstName;
  const parts = relNoExt.split(SEP);

  if (parts.length === 1 && parts[0] === 'index') {
    // 顶级 index.md → docs/index.html
    dstDir = DST_DIR;
    dstName = 'index.html';
  } else if (parts[parts.length - 1] === 'index') {
    // 子目录 index.md → docs/SUBDIR/index.html
    const subdir = parts.slice(0, -1).join(SEP); // e.g. "PROJECT"
    dstDir = path.join(DST_DIR, subdir);
    dstName = 'index.html';
  } else {
    // 其他文件 → docs/SUBDIR/file.html
    dstDir = path.join(DST_DIR, parts.slice(0, -1).join(SEP));
    dstName = parts[parts.length - 1] + '.html';
  }

  fs.mkdirSync(dstDir, { recursive: true });

  // 读取 markdown 内容，去掉 frontmatter
  let md = fs.readFileSync(srcFile, 'utf8');
  md = stripFrontmatter(md);
  const body = marked.parse(md);

  // 生成完整 HTML
  const title = extractTitle(srcFile, parts);
  const html = buildHTML({ title, body, parts });

  fs.writeFileSync(path.join(dstDir, dstName), html, 'utf8');
  console.log(`docs: ${rel} → ${path.join(dstDir, dstName).replace(DST_DIR, 'docs')}`);
}

function stripFrontmatter(md) {
  // 去掉 YAML frontmatter（支持 --- 后紧跟内容或空行）
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function extractTitle(filePath, parts) {
  const name = parts.length === 1 && parts[0] === 'index'
    ? '文档首页'
    : parts[parts.length - 1] === 'index'
      ? parts[parts.length - 2]
      : parts[parts.length - 1];
  const labels = {
    PROJECT: '系统架构', MAINTENANCE: '维护指南',
    TROUBLESHOOTING: '故障排查', MIGRATION: '迁移规范',
  };
  return labels[name] || name;
}

function buildHTML({ title, body, parts }) {
  const breadcrumbs = [
    `<a href="${withSiteRoot('docs/')}">文档</a>`,
    ...parts.slice(0, -1).map((p, i, arr) => {
      const labels = { PROJECT: '系统架构', MAINTENANCE: '维护指南', TROUBLESHOOTING: '故障排查', MIGRATION: '迁移规范' };
      const label = labels[p] || p;
      const href = withSiteRoot('docs/' + arr.slice(0, i + 1).join('/') + '/');
      return `<a href="${href}">${label}</a>`;
    }),
    parts[parts.length - 1] !== 'index' ? `<span>${parts[parts.length - 1]}</span>` : '',
  ].filter(Boolean).join(' &raquo; ');

  // 计算当前路径（去掉末尾 index，用作高亮匹配）
  const currentKey = parts.length === 1 && parts[0] === 'index'
    ? 'index'
    : parts.filter(p => p !== 'index').join(SEP);

  const navItems = [
    { href: withSiteRoot('docs/'), label: '文档首页', key: 'index' },
    { href: withSiteRoot('docs/PROJECT/'), label: '系统架构', key: 'PROJECT' },
    { href: withSiteRoot('docs/MAINTENANCE/'), label: '维护指南', key: 'MAINTENANCE' },
    { href: withSiteRoot('docs/TROUBLESHOOTING/'), label: '故障排查', key: 'TROUBLESHOOTING' },
    { href: withSiteRoot('docs/MIGRATION/'), label: '迁移规范', key: 'MIGRATION' },
  ].map(l => {
    const active = l.key === currentKey ? ' class="active"' : '';
    return `      <a href="${l.href}"${active}>${l.label}</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - LLM Wiki 文档</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.7;
    color: #e0e0e0;
    background: #1a1a2e;
    min-height: 100vh;
  }
  a { color: #4fc3f7; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .topbar {
    background: #16213e;
    border-bottom: 1px solid #0f3460;
    padding: 0.8rem 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .topbar .brand { font-weight: 700; font-size: 1.1rem; color: #e94560; }
  .topbar .brand:hover { text-decoration: none; }
  .breadcrumb { color: #888; font-size: 0.9rem; }
  .breadcrumb span { color: #ccc; }
  .layout { display: flex; max-width: 1200px; margin: 0 auto; padding: 2rem; gap: 2rem; }
  .sidebar { width: 200px; flex-shrink: 0; }
  .sidebar h3 { color: #e94560; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .sidebar nav a {
    display: block;
    padding: 0.3rem 0.5rem;
    color: #a0a0a0;
    font-size: 0.9rem;
    border-radius: 4px;
    margin-bottom: 2px;
  }
  .sidebar nav a:hover { color: #4fc3f7; background: rgba(79,195,247,0.1); text-decoration: none; }
  .sidebar nav a.active { color: #e94560; background: rgba(233,69,96,0.1); }
  .main { flex: 1; min-width: 0; }
  .main h1 { color: #e94560; font-size: 1.8rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #333; }
  .main h2 { color: #4fc3f7; font-size: 1.3rem; margin: 1.8rem 0 0.8rem; }
  .main h3 { color: #80cbc4; font-size: 1.1rem; margin: 1.5rem 0 0.6rem; }
  .main h4 { color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem; }
  .main p { margin: 0.8rem 0; color: #d0d0d0; }
  .main ul, .main ol { margin: 0.8rem 0; padding-left: 1.5rem; }
  .main li { margin: 0.3rem 0; color: #d0d0d0; }
  .main code {
    background: #0f3460;
    color: #e94560;
    padding: 0.15em 0.4em;
    border-radius: 3px;
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 0.88em;
  }
  .main pre {
    background: #0f3460;
    border: 1px solid #1a4a7a;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  .main pre code { background: none; color: #e0e0e0; padding: 0; font-size: 0.85rem; }
  .main blockquote {
    border-left: 3px solid #e94560;
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    background: rgba(233,69,96,0.05);
    color: #a0a0a0;
  }
  .main table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  .main th { background: #0f3460; color: #4fc3f7; padding: 0.6rem 1rem; text-align: left; }
  .main td { padding: 0.5rem 1rem; border-bottom: 1px solid #2a2a4a; color: #d0d0d0; }
  .main tr:hover td { background: rgba(79,195,247,0.05); }
  .main hr { border: none; border-top: 1px solid #333; margin: 2rem 0; }
  .main img { max-width: 100%; border-radius: 4px; }
  .main a { color: #4fc3f7; }
  .main strong { color: #fff; }
  .main em { color: #a0a0a0; }
  .footer {
    text-align: center;
    padding: 2rem;
    color: #555;
    font-size: 0.8rem;
    border-top: 1px solid #222;
    margin-top: 3rem;
  }
  @media (max-width: 768px) {
    .layout { flex-direction: column; padding: 1rem; }
    .sidebar { width: 100%; }
    .topbar { padding: 0.8rem 1rem; }
  }
</style>
</head>
<body>
<header class="topbar">
  <a class="brand" href="${SITE_ROOT}">🌸 LLM Wiki</a>
  <span class="breadcrumb">&raquo; ${breadcrumbs}</span>
</header>
<div class="layout">
  <aside class="sidebar">
    <h3>📄 文档导航</h3>
    <nav>
${navItems}
    </nav>
  </aside>
  <main class="main">
${body.split('\n').map(l => '    ' + l).join('\n')}
  </main>
</div>
<footer class="footer">
  由 LLM Wiki 文档系统生成 &middot; <a href="${SITE_ROOT}">返回博客</a>
</footer>
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
