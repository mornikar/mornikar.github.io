const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('http://localhost:4002/login/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // 等待背景效果加载
  await page.waitForTimeout(3000);

  // 检查页面元素
  const checks = await page.evaluate(() => {
    const bg = document.getElementById('wiki-login-bg');
    const card = document.querySelector('.wiki-login-card');
    const canvas = document.querySelectorAll('#wiki-login-bg canvas');
    const corners = document.querySelectorAll('.wiki-card-corner');
    const grid = document.querySelector('.wiki-login-grid');
    const wikiJsLoaded = document.querySelector('script[src*="wiki-login"]') !== null;

    // 检查 wiki-login-bg 的 HTML
    const bgHTML = bg ? bg.innerHTML : 'NOT FOUND';

    // 检查 JS 是否定义
    const hasInitBackground = typeof window.initBackground === 'function';

    // 检查脚本加载
    const scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.includes('wiki'));

    return {
      hasWikiLoginBg: !!bg,
      hasWikiLoginCard: !!card,
      canvasCount: canvas.length,
      cornerCount: corners.length,
      hasGrid: !!grid,
      bgChildren: bg ? bg.children.length : 0,
      bgHTML: bgHTML.substring(0, 200),
      scripts,
      wikiJsLoaded,
      hasInitBackground
    };
  });

  console.log('=== 页面元素检查 ===');
  console.log(JSON.stringify(checks, null, 2));

  // 检查网络请求
  const responses = [];
  page.on('response', r => { if (r.url().includes('wiki')) responses.push(r.url() + ' -> ' + r.status()); });
  await page.reload({ waitUntil: 'domcontentloaded', url: 'http://localhost:4002/login/' });
  await page.waitForTimeout(1000);
  console.log('=== 网络请求 ===');
  responses.forEach(r => console.log(r));

  console.log('=== 页面元素检查 ===');
  console.log(JSON.stringify(checks, null, 2));

  // 截图
  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/login-test2.png', fullPage: false });
  console.log('截图已保存到 public/login-test.png');

  await browser.close();
})();
