---
title: Wiki 更新日志
date: 2026-04-24
type: wiki
wiki: true
comments: false
---

<div id="wiki-changelog-container">
  <p class="changelog-desc">Wiki 知识库的变更历史，由 wiki-to-hexo.js 自动生成。</p>
  <div id="changelog-content">加载中...</div>
</div>

<script>
(function() {
  // 读取 wiki-index.json 获取页面信息
  async function loadChangelog() {
    const container = document.getElementById('changelog-content');
    
    try {
      // 尝试从 /wiki-changelog-data.json 加载
      const resp = await fetch('/wiki-changelog-data.json');
      if (!resp.ok) throw new Error('数据加载失败');
      
      const data = await resp.json();
      renderChangelog(data, container);
    } catch (e) {
      container.innerHTML = '<p style="color: var(--color-text-muted);">暂无更新日志数据。请运行 node scripts/wiki-to-hexo.js 生成。</p>';
    }
  }
  
  function renderChangelog(data, container) {
    if (!data.entries || data.entries.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-muted);">暂无更新记录。</p>';
      return;
    }
    
    // 按日期分组
    const byDate = {};
    for (const entry of data.entries) {
      const date = entry.date || '未知日期';
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(entry);
    }
    
    // 按日期倒序
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    
    let html = '';
    for (const date of dates) {
      const entries = byDate[date];
      html += `<div class="changelog-date-group">`;
      html += `<h3 class="changelog-date">${date}</h3>`;
      html += `<ul class="changelog-list">`;
      for (const entry of entries) {
        const typeBadge = entry.type === 'concepts' 
          ? '<span class="changelog-badge concepts">概念</span>' 
          : '<span class="changelog-badge entities">随笔</span>';
        const link = entry.url 
          ? `<a href="${entry.url}">${entry.title}</a>` 
          : entry.title;
        html += `<li>${typeBadge} ${link} <span class="changelog-action">${entry.action || '转换'}</span></li>`;
      }
      html += `</ul></div>`;
    }
    
    container.innerHTML = html;
  }
  
  loadChangelog();
})();
</script>

<style>
#wiki-changelog-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 0;
}

.changelog-desc {
  color: var(--color-text-muted, #888);
  margin-bottom: 1.5rem;
}

.changelog-date-group {
  margin-bottom: 2rem;
}

.changelog-date {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-accent, #ff6b6b);
  border-bottom: 2px solid var(--color-accent, #ff6b6b);
  padding-bottom: 0.3rem;
  margin-bottom: 0.8rem;
}

.changelog-list {
  list-style: none;
  padding: 0;
}

.changelog-list li {
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.1));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.changelog-list li:last-child {
  border-bottom: none;
}

.changelog-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
}

.changelog-badge.concepts {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.changelog-badge.entities {
  background: rgba(0, 210, 211, 0.2);
  color: #00d2d3;
}

.changelog-action {
  color: var(--color-text-muted, #888);
  font-size: 0.85rem;
  margin-left: auto;
}

.changelog-list a {
  color: var(--color-link, #4ecdc4);
  text-decoration: none;
}

.changelog-list a:hover {
  text-decoration: underline;
}
</style>
