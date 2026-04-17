---
title: 故障排查
---
# 故障排查

## GitHub Pages 样式不更新

**症状**：推送了新 CSS/JS，但网站显示旧样式

**解决**：
1. 按 `Ctrl+Shift+R` 强制刷新
2. 或右键点击刷新按钮 → 清空缓存并硬性重新加载
3. 或在 DevTools Network 面板勾选 Disable cache

## Wiki 文章没出现在博客上

**排查步骤**：
1. 检查 `.wiki/` 文件的 frontmatter 是否完整（title, type, tags, created, updated）
2. 运行 `wiki-sync.bat --dry-run` 预览转换结果
3. 检查 `source/_posts/` 是否生成了对应文件
4. 检查 Hexo 是否有编译错误

## wiki-to-hexo.js 报错

**常见错误**：
- `date: 2025/09/12` — 日期格式错误，应为 `YYYY-MM-DD`
- frontmatter 缺失必填字段

## CI 构建失败

**排查**：
1. 查看 GitHub Actions 日志
2. 常见原因：npm 依赖安装失败、hexo generate 错误
3. 可手动触发 "Wiki-Hexo 自动部署" workflow 重新构建

## wiki-chat.js 没生效

**排查**：
1. 检查 GitHub Pages 上的 JS 是否是最新的
2. 在 Console 执行 `document.querySelector('.footer-credit a').innerHTML`
3. 如果返回 `<span>...</span>` 则 JS 正常；如果返回带 `<br>` 则 JS 未生效

## CSS hexo-renderer-stylus 编译失败

CI 中 hexo-renderer-stylus 无法处理多级 `@import`，CI 改用 Node.js stylus 直接编译。

本地如有同样问题，运行：
```bash
node -e "const stylus=require('stylus'),fs=require('fs');stylus(fs.readFileSync('themes/arknights/source/css/arknights.styl','utf8')).set('paths',['themes/arknights/source/css/_modules','themes/arknights/source/css/_core','themes/arknights/source/css/_custom','themes/arknights/source/css/_page']).render((e,c)=>fs.writeFileSync('public/css/arknights.css',c))"
```

## Hexo pug 渲染错误

Hexo 7 的 `_buildLocals` 将 frontmatter 字段扁平化，pug-runtime 的 compile() 需要 `locals.page` 对象。修复 patch 位于 `node_modules/hexo-renderer-pug/lib/pug.js` 的 `scripts/hexo7-pug-fix.js`。
