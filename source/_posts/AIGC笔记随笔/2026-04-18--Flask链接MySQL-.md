---
title : "Flask链接MySQL"
date: 2026-04-18 08:00:00
updated: 2026-04-18 08:00:00
tags: wiki, Flask, Python, Web
category : AIGC笔记随笔
source: LLM Wiki
source_path: raw\\skills\\flask\\Flask链接MySQL.md
---

<!-- 此文章来自 LLM Wiki: raw\skills\flask\Flask链接MySQL.md -->

在Mysql命令行中更改时区
# 点开最右侧 Advanced，找到 serverTimezone，在右侧value处填写 GMT，保存即可！(或填写 Asia/Shanghai)

Copy
mysql > SET time_zone = '+8:00'; # 此为北京时，我们所在东8区
Copy
mysql> flush privileges; # 立即生效
<div class="wiki-backlinks">
<h4 class="wiki-backlinks-title">🔗 反向链接</h4>
<p class="wiki-backlinks-desc">以下页面引用了本文：</p>
<ul class="wiki-backlinks-list">
  <li><a href="/2026/04/23/log/">log</a></li>
</ul>
</div>