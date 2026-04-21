const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });

  // 清除 localStorage 确保未登录状态
  await page.goto('http://localhost:4006/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 点击悬浮按钮
  const fab = await page.locator('#wiki-chat-fab');
  await fab.click();
  await page.waitForTimeout(500);

  // 检查面板内容
  const checks = await page.evaluate(() => {
    const panel = document.getElementById('wiki-chat-panel');
    const loginBtn = document.getElementById('wiki-chat-login-btn');
    const title = document.getElementById('wiki-chat-title');
    const fab = document.getElementById('wiki-chat-fab');
    const closeBtn = document.getElementById('wiki-chat-close');
    const settingsBtn = document.getElementById('wiki-chat-settings-btn');

    return {
      panelOpen: panel ? panel.classList.contains('wiki-chat-panel--open') : false,
      loginBtnExists: !!loginBtn,
      titleText: title ? title.textContent.trim() : null,
      fabExists: !!fab,
      closeBtnExists: !!closeBtn,
      settingsBtnExists: !!settingsBtn,
      panelHasAriaHidden: panel ? panel.getAttribute('aria-hidden') : null
    };
  });

  console.log('=== 聊天面板检查 ===');
  console.log(JSON.stringify(checks, null, 2));

  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/chat-panel.png', fullPage: false });
  console.log('截图已保存');

  await browser.close();
})();
