/**
 * Wiki 目录树组件
 * 在 Wiki 文章页面的侧边栏显示目录树
 * 数据来源：/wiki-index.json
 *
 * Phase 3.A 新增
 */

(function() {
  'use strict';

  // 只在 Wiki 文章页面显示
  const isWikiPage = document.querySelector('.wiki-badge') || 
                     document.querySelector('.wiki-source-info') ||
                     (document.querySelector('#post-content') && document.querySelector('meta[name="source"][content="LLM Wiki"]'));

  if (!isWikiPage) return;

  // 查找或创建侧边栏容器
  const asideBlock = document.getElementById('aside-block');
  if (!asideBlock) return;

  // 创建目录树容器
  const treeContainer = document.createElement('div');
  treeContainer.id = 'wiki-tree';
  treeContainer.innerHTML = '<h3 class="wiki-tree-title">📚 Wiki 目录</h3><div class="wiki-tree-content">加载中...</div>';

  // 在 TOC 之后插入（如果有的话）
  const tocDiv = document.getElementById('toc-div');
  if (tocDiv && tocDiv.nextSibling) {
    asideBlock.insertBefore(treeContainer, tocDiv.nextSibling);
  } else if (tocDiv) {
    asideBlock.appendChild(treeContainer);
  } else {
    asideBlock.insertBefore(treeContainer, asideBlock.firstChild);
  }

  // 加载并渲染
  loadAndRenderTree();

  async function loadAndRenderTree() {
    try {
      const resp = await fetch('/wiki-index.json');
      if (!resp.ok) throw new Error('加载失败');
      const index = await resp.json();
      renderTree(index);
    } catch (e) {
      const content = treeContainer.querySelector('.wiki-tree-content');
      content.textContent = '目录加载失败';
    }
  }

  function renderTree(index) {
    const content = treeContainer.querySelector('.wiki-tree-content');

    // 获取当前页面标题
    const currentTitle = document.querySelector('#post-title h1')?.textContent?.replace('Wiki', '').trim() || '';

    // 按层级分组
    const groups = {
      'concepts': { label: '📖 概念', items: [] },
      'entities': { label: '✍️ 随笔', items: [] },
    };

    // 其他层级归入"其他"
    const otherItems = [];

    for (const item of index) {
      const group = groups[item.layer];
      if (group) {
        group.items.push(item);
      } else {
        otherItems.push(item);
      }
    }

    if (otherItems.length > 0) {
      groups['other'] = { label: '📋 其他', items: otherItems };
    }

    let html = '';
    for (const [key, group] of Object.entries(groups)) {
      if (group.items.length === 0) continue;

      html += `<div class="wiki-tree-group">`;
      html += `<div class="wiki-tree-group-title" onclick="this.parentElement.classList.toggle('collapsed')">${group.label}<span class="wiki-tree-toggle">▼</span></div>`;
      html += `<ul class="wiki-tree-list">`;

      // 按标题排序
      group.items.sort((a, b) => a.title.localeCompare(b.title, 'zh'));

      for (const item of group.items) {
        const isCurrent = item.title === currentTitle;
        const itemClass = isCurrent ? 'wiki-tree-item current' : 'wiki-tree-item';
        const link = item.url || '#';
        html += `<li class="${itemClass}">`;
        html += `<a href="${link}" title="${item.summary || item.title}">${item.title}</a>`;
        if (item.tags && item.tags.length > 0) {
          html += `<span class="wiki-tree-tag">${item.tags[0]}</span>`;
        }
        html += `</li>`;
      }

      html += `</ul></div>`;
    }

    content.innerHTML = html;
  }
})();
