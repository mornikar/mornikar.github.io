const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('http://localhost:4005/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  const checks = await page.evaluate(() => {
    const wikiChatScript = Array.from(document.scripts).some(s => s.src && s.src.includes('wiki-chat.js'));
    const loginBtn = document.querySelector('.wiki-login-btn');
    const wikiChatWidget = document.querySelector('#wiki-chat-widget, .wiki-chat-widget, [class*="wiki-chat"]');

    return {
      wikiChatScriptLoaded: wikiChatScript,
      loginBtnExists: !!loginBtn,
      loginBtnText: loginBtn ? loginBtn.textContent.trim() : null,
      loginBtnHref: loginBtn ? loginBtn.href : null,
      wikiChatWidgetExists: !!wikiChatWidget,
      widgetClass: wikiChatWidget ? wikiChatWidget.className : null
    };
  });

  console.log('=== 导航栏检查 ===');
  console.log(JSON.stringify(checks, null, 2));

  await page.screenshot({ path: 'D:/Auxiliary_means/Git/mornikar.github.io/Hexo/public/nav-check.png', fullPage: false });
  console.log('截图已保存');

  await browser.close();
})();
