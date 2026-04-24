/**
 * Wiki 工具函数库
 * 从 wiki-compile.js 和 wiki-to-hexo.js 中提取的共享函数
 * 供测试和复用使用
 */

'use strict';

/**
 * 解析 YAML frontmatter
 * @param {string} content - Markdown 文件内容
 * @returns {{ frontmatter: object, body: string }}
 */
function parseFrontmatter(content) {
  const trimmed = content.trimStart();
  const firstDash = trimmed.indexOf('---');
  if (firstDash !== 0) return { frontmatter: {}, body: content };

  const secondDash = trimmed.indexOf('---', 3);
  if (secondDash === -1) return { frontmatter: {}, body: content };

  const yamlStr = trimmed.slice(3, secondDash).trim();
  let body = trimmed.slice(secondDash + 3).trim();

  // 跳过第二个 frontmatter 块（wiki 层）
  if (body.startsWith('---')) {
    const wikiEnd = body.indexOf('---', 3);
    if (wikiEnd !== -1) body = body.slice(wikiEnd + 3).trim();
  }

  const frontmatter = {};
  yamlStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim()).filter(v => v);
      }
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

/**
 * 标题 → URL 安全文件名
 * @param {string} title
 * @returns {string}
 */
function slugify(title) {
  return title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * raw 子目录到目标 layer 的映射
 */
const RAW_TO_LAYER = {
  'AI_Agent': 'concepts',
  'articles/AI产品方案': 'entities',
  'articles/AI行业分析': 'concepts',
  'articles/AI部署': 'concepts',
  'articles/多模态': 'concepts',
  'articles/随笔': 'entities',
  'ML': 'concepts',
  'PM': 'entities',
  'OS': 'entities',
  'skills': 'entities',
  'snippets': 'entities',
};

const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];

/**
 * 确定一个 raw 文件应该编译到哪个 layer
 * @param {string} rawRelPath - 相对于 .wiki/ 的路径
 * @param {object} frontmatter
 * @returns {string}
 */
function determineTargetLayer(rawRelPath, frontmatter) {
  const path = require('path');
  const parts = rawRelPath.split(path.sep);

  // raw/articles/SUBDIR/file.md → 用 articles/SUBDIR 映射
  if (parts.length >= 3 && parts[0] === 'raw' && parts[1] === 'articles') {
    const subKey = `articles/${parts[2]}`;
    if (RAW_TO_LAYER[subKey]) return RAW_TO_LAYER[subKey];
  }
  // raw/SUBDIR/file.md → 用 SUBDIR 映射
  if (parts.length >= 2 && parts[0] === 'raw') {
    if (RAW_TO_LAYER[parts[1]]) return RAW_TO_LAYER[parts[1]];
  }

  // frontmatter.type 作为 fallback
  if (frontmatter.type && LAYER_DIRS.includes(frontmatter.type)) {
    return frontmatter.type;
  }

  return 'concepts';
}

/**
 * 从内容推断标签
 * @param {string} content - 文本内容
 * @param {object} frontmatter
 * @param {string} layer
 * @returns {string[]}
 */
function inferTags(content, frontmatter, layer) {
  const tags = new Set();

  // 从 frontmatter 继承标签
  if (frontmatter.tags) {
    const existingTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
    existingTags.forEach(t => tags.add(t));
  }

  // 基于内容关键词推断
  const keywordMap = {
    'AI': ['ai', '人工智能', '大模型', 'AIGC'],
    'LLM': ['llm', '大语言模型', '语言模型', 'gpt', 'claude', 'glm'],
    'RAG': ['rag', '检索增强', '知识库'],
    'Agent': ['agent', '代理', '智能体'],
    '机器学习': ['ml', '机器学习', '深度学习', '神经网络', '训练'],
    'Python': ['python', 'conda', 'pip', 'numpy', 'pandas'],
    'Flask': ['flask', 'web框架'],
    'Git': ['git', '版本控制'],
    'MySQL': ['mysql', '数据库', 'sql'],
    'Docker': ['docker', '容器', '部署'],
    '部署': ['部署', 'deploy', '上线', '私有化'],
    '产品': ['产品', 'prd', '需求', 'pm'],
    '开发': ['开发', '编程', '代码', 'api'],
  };

  const lowerContent = content.toLowerCase();
  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      tags.add(tag);
    }
  }

  if (layer === 'concepts') tags.add('wiki');
  if (layer === 'entities') tags.add('wiki');

  return [...tags].slice(0, 8);
}

/**
 * 提取所有 [[WikiLink]] 目标
 * @param {string} body - Markdown body
 * @returns {string[]} WikiLink 目标列表
 */
function extractWikiLinks(body) {
  const targets = [];
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}

/**
 * WikiLink 转换为 Hexo 内链
 * @param {string} body - Markdown body
 * @param {object} wikiMeta - { title: { hexoDate, title, titleLower } }
 * @returns {string} 转换后的 body
 */
function convertWikiLinks(body, wikiMeta) {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, label) => {
    const display = label || target.trim();
    const slug = target.trim();

    let meta = wikiMeta[slug];

    // 忽略大小写
    if (!meta) {
      const lower = slug.toLowerCase();
      meta = Object.values(wikiMeta).find(m => m.titleLower === lower);
    }

    // 模糊匹配：WikiLink 是 title 的前缀
    if (!meta) {
      const lower = slug.toLowerCase();
      meta = Object.values(wikiMeta).find(m => m.titleLower.startsWith(lower));
    }

    if (meta) {
      const hexoPath = `${meta.hexoDate}/${meta.title}`;
      return `[${display}](/${hexoPath}/)`;
    }

    return `[${display}](/${slug}/)`;
  });
}

/**
 * 审计文件名格式验证
 * @param {string} filename
 * @returns {boolean}
 */
function isValidAuditFilename(filename) {
  return /^AUDIT-\d{4}-\d{3}\.md$/.test(filename);
}

/**
 * 审计 frontmatter 必填字段验证
 * @param {object} frontmatter
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateAuditFrontmatter(frontmatter) {
  const required = ['id', 'target', 'type', 'severity', 'status', 'comment', 'suggested_action', 'created'];
  const missing = required.filter(k => !frontmatter[k]);
  return { valid: missing.length === 0, missing };
}

/**
 * 审计类型白名单
 */
const AUDIT_TYPES = ['quality', 'accuracy', 'completeness', 'outdated', 'duplicate', 'structure', 'dead_link'];
const AUDIT_SEVERITIES = ['critical', 'major', 'minor', 'suggestion'];
const AUDIT_STATUSES = ['open', 'in_progress', 'resolved', 'dismissed'];
const AUDIT_ACTIONS = ['add_content', 'update', 'merge', 'split', 'delete', 'fix_link', 'recompile'];

module.exports = {
  parseFrontmatter,
  slugify,
  determineTargetLayer,
  inferTags,
  extractWikiLinks,
  convertWikiLinks,
  isValidAuditFilename,
  validateAuditFrontmatter,
  RAW_TO_LAYER,
  LAYER_DIRS,
  AUDIT_TYPES,
  AUDIT_SEVERITIES,
  AUDIT_STATUSES,
  AUDIT_ACTIONS,
};
