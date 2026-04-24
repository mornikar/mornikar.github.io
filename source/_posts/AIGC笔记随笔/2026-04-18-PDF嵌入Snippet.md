---
title : PDF嵌入Snippet
date: 2026-04-18 08:00:00
updated: 2026-04-18 08:00:00
tags: PDF, 嵌入, Snippet, wiki
category : AIGC笔记随笔
source: LLM Wiki
source_path: raw\\snippets\\PDF嵌入Snippet.md
---

<!-- 此文章来自 LLM Wiki: raw\snippets\PDF嵌入Snippet.md -->

## 使用方法

在 wiki 文章中粘贴以下 HTML 块，将 `xxx.pdf` 替换为你的 PDF 文件路径（相对于 `assets/` 目录）。

## 完整嵌入模板

```html
<div class="pdf-embed-wrapper" data-pdf="assets/你的PDF文件名.pdf" data-title="PDF标题" style="margin: 16px 0;">
  <div class="pdf-embed-toolbar">
    <button onclick="pdfZoom(this, -0.2)">➖ 缩小</button>
    <button onclick="pdfReset(this)">🔄 重置</button>
    <button onclick="pdfZoom(this, 0.2)">➕ 放大</button>
    <span class="pdf-page-info">第 <span class="pdf-cur">1</span> / <span class="pdf-total">?</span> 页</span>
  </div>
  <canvas class="pdf-canvas" style="width:100%;border:1px solid #ddd;background:#f5f5f5;"></canvas>
</div>

<script src="/lib/pdfjs/pdf.min.mjs" type="module"></script>
<script type="module">
  document.querySelectorAll('.pdf-embed-wrapper').forEach(async wrapper => {
    const pdfUrl = wrapper.dataset.pdf;
    const canvas = wrapper.querySelector('.pdf-canvas');
    const totalSpan = wrapper.querySelector('.pdf-page-info .pdf-total');
    const curSpan = wrapper.querySelector('.pdf-page-info .pdf-cur');
    let scale = 1.2, currentPage = 1;

    const pdfjsLib = await import('/lib/pdfjs/pdf.min.mjs');
    await pdfjsLib.GlobalWorkerOptions.verbosity;
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    totalSpan.textContent = pdf.numPages;

    async function renderPage(num) {
      const page = await pdf.getPage(num);
      const vp = page.getViewport({ scale });
      canvas.height = vp.height;
      canvas.width = vp.width;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      curSpan.textContent = num;
    }
    await renderPage(1);

    wrapper._renderPage = renderPage;
    wrapper._setScale = s => { scale = s; renderPage(currentPage); };
  });
</script>
<script>
  function pdfZoom(btn, delta) {
    const w = btn.closest('.pdf-embed-wrapper');
    w._setScale(Math.max(0.3, Math.min(5, 1.2 + delta)));
  }
  function pdfReset(btn) {
    const w = btn.closest('.pdf-embed-wrapper');
    w._setScale(1.2);
  }
</script>
```

## 简化版（无控制栏）

```html
<div class="pdf-embed-wrapper" data-pdf="assets/你的PDF.pdf" data-title="文档标题">
  <canvas class="pdf-canvas" style="width:100%;border:1px solid #ddd;"></canvas>
</div>
<script src="/lib/pdfjs/pdf.min.mjs" type="module"></script>
<script type="module">
  document.querySelectorAll('.pdf-embed-wrapper').forEach(async wrapper => {
    const canvas = wrapper.querySelector('.pdf-canvas');
    const pdfjsLib = await import('/lib/pdfjs/pdf.min.mjs');
    const pdf = await pdfjsLib.getDocument(wrapper.dataset.pdf).promise;
    const page = await pdf.getPage(1);
    const vp = page.getViewport({ scale: 1.5 });
    canvas.height = vp.height; canvas.width = vp.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  });
</script>
```

## 放置 PDF 文件

将 PDF 文件复制到以下目录：

```
.wiki/raw/assets/
```

转换后 Hexo 会把它放到博客的 `public/assets/` 目录，可直接通过 `/assets/xxx.pdf` 访问。

## 注意事项

- PDF 文件建议 **< 20MB**，GitHub 单文件限制 100MB
- PDF.js **完全本地运行**，无需服务器端处理
- 手机端也可正常查看
- 首次加载 PDF.js（约 1.6MB）后会被浏览器缓存
<div class="wiki-backlinks">
<h4 class="wiki-backlinks-title">🔗 反向链接</h4>
<p class="wiki-backlinks-desc">以下页面引用了本文：</p>
<ul class="wiki-backlinks-list">
  <li><a href="/2026/04/23/log/">log</a></li>
</ul>
</div>