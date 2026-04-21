const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('http://localhost:4003/login/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // 输入用户名并点击登录
  await page.fill('#wiki-login-username', 'TestUser');
  await page.click('#wiki-login-submit');

  // 等待扫描线动画开始
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/scan-step1.png' });

  // 扫描线移动到中间
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/scan-step2.png' });

  // 扫描线移动到左侧
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/scan-step3.png' });

  // 扫描完成后闪光
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/scan-step4.png' });

  console.log('扫描线动画截图完成');
  await browser.close();
})();
