/**
 * Wiki 工具函数单元测试
 * 覆盖 parseFrontmatter / slugify / determineTargetLayer / inferTags / extractWikiLinks / convertWikiLinks
 */

const {
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
} = require('../scripts/wiki-utils');

// ============ parseFrontmatter ============

describe('parseFrontmatter', () => {
  test('解析标准 wiki 格式', () => {
    const result = parseFrontmatter('---\ntitle: 测试\ntype: concepts\ntags: [AI, LLM]\n---\n内容');
    expect(result.frontmatter.title).toBe('测试');
    expect(result.frontmatter.type).toBe('concepts');
    expect(result.frontmatter.tags).toEqual(['AI', 'LLM']);
    expect(result.body).toBe('内容');
  });

  test('无 frontmatter 时返回空对象', () => {
    const result = parseFrontmatter('纯文本内容');
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('纯文本内容');
  });

  test('只有一对 --- 时返回空对象', () => {
    const result = parseFrontmatter('---\ntitle: 测试');
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('---\ntitle: 测试');
  });

  test('跳过第二个 frontmatter 块（wiki 层）', () => {
    const content = '---\ntitle: 外层\n---\n---\ntype: concepts\n---\n正文';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.title).toBe('外层');
    expect(result.body).toBe('正文');
  });

  test('多值字段解析', () => {
    const result = parseFrontmatter('---\ntags: [AI, LLM, RAG, Agent]\n---\n内容');
    expect(result.frontmatter.tags).toEqual(['AI', 'LLM', 'RAG', 'Agent']);
  });

  test('单值字段不转数组', () => {
    const result = parseFrontmatter('---\ntitle: 测试\nsummary: 一句话\n---\n内容');
    expect(result.frontmatter.title).toBe('测试');
    expect(result.frontmatter.summary).toBe('一句话');
  });

  test('空 frontmatter 块', () => {
    const result = parseFrontmatter('---\n---\n内容');
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('内容');
  });
});

// ============ slugify ============

describe('slugify', () => {
  test('特殊字符清理', () => {
    expect(slugify('AI/模型*测试?')).toBe('AI-模型-测试-');
  });

  test('空格替换为连字符', () => {
    expect(slugify('RAG 检索增强')).toBe('RAG-检索增强');
  });

  test('中文保留', () => {
    expect(slugify('大语言模型')).toBe('大语言模型');
  });

  test('混合字符', () => {
    expect(slugify('AI Agent: 智能体')).toBe('AI-Agent--智能体');
  });

  test('空字符串', () => {
    expect(slugify('')).toBe('');
  });
});

// ============ determineTargetLayer ============

describe('determineTargetLayer', () => {
  test('AI_Agent → concepts', () => {
    expect(determineTargetLayer('raw\\AI_Agent\\test.md', {})).toBe('concepts');
  });

  test('articles/随笔 → entities', () => {
    expect(determineTargetLayer('raw\\articles\\随笔\\test.md', {})).toBe('entities');
  });

  test('ML → concepts', () => {
    expect(determineTargetLayer('raw\\ML\\test.md', {})).toBe('concepts');
  });

  test('PM → entities', () => {
    expect(determineTargetLayer('raw\\PM\\test.md', {})).toBe('entities');
  });

  test('frontmatter.type 作为 fallback', () => {
    expect(determineTargetLayer('raw\\unknown_dir\\test.md', { type: 'entities' })).toBe('entities');
  });

  test('目录映射优先于 frontmatter.type', () => {
    // ML 目录映射到 concepts，即使 frontmatter 说 entities
    expect(determineTargetLayer('raw\\ML\\test.md', { type: 'entities' })).toBe('concepts');
  });

  test('无映射无 type → 默认 concepts', () => {
    expect(determineTargetLayer('raw\\unknown\\test.md', {})).toBe('concepts');
  });

  test('articles/AI产品方案 → entities', () => {
    expect(determineTargetLayer('raw\\articles\\AI产品方案\\test.md', {})).toBe('entities');
  });
});

// ============ inferTags ============

describe('inferTags', () => {
  test('AI 关键词匹配', () => {
    const tags = inferTags('这是一篇关于AI大模型的文章', {}, 'concepts');
    expect(tags).toContain('AI');
  });

  test('LLM 关键词匹配', () => {
    const tags = inferTags('GPT和Claude都是大语言模型', {}, 'concepts');
    expect(tags).toContain('LLM');
  });

  test('继承 frontmatter 标签', () => {
    const tags = inferTags('内容', { tags: ['RAG', '检索增强'] }, 'concepts');
    expect(tags).toContain('RAG');
    expect(tags).toContain('检索增强');
  });

  test('concepts 层自动添加 wiki 标签', () => {
    const tags = inferTags('内容', {}, 'concepts');
    expect(tags).toContain('wiki');
  });

  test('entities 层自动添加 wiki 标签', () => {
    const tags = inferTags('内容', {}, 'entities');
    expect(tags).toContain('wiki');
  });

  test('标签上限为 8', () => {
    const tags = inferTags('AI LLM RAG Agent Python Flask Git MySQL Docker 部署', {}, 'concepts');
    expect(tags.length).toBeLessThanOrEqual(8);
  });

  test('空内容无额外标签', () => {
    const tags = inferTags('', {}, 'concepts');
    expect(tags).toEqual(['wiki']);
  });
});

// ============ extractWikiLinks ============

describe('extractWikiLinks', () => {
  test('提取单个 WikiLink', () => {
    expect(extractWikiLinks('参见 [[RAG检索增强生成]] 了解更多')).toEqual(['RAG检索增强生成']);
  });

  test('提取多个 WikiLink', () => {
    const body = '[[RAG]] 和 [[LLM]] 是相关技术';
    expect(extractWikiLinks(body)).toEqual(['RAG', 'LLM']);
  });

  test('提取带别名的 WikiLink（只取目标）', () => {
    expect(extractWikiLinks('[[RAG检索增强生成|更简洁的理解]]')).toEqual(['RAG检索增强生成']);
  });

  test('无 WikiLink 时返回空数组', () => {
    expect(extractWikiLinks('普通文本无链接')).toEqual([]);
  });

  test('重复 WikiLink 全部提取', () => {
    expect(extractWikiLinks('[[RAG]] 和 [[RAG]] 重复')).toEqual(['RAG', 'RAG']);
  });
});

// ============ convertWikiLinks ============

describe('convertWikiLinks', () => {
  const wikiMeta = {
    'RAG检索增强生成': {
      title: 'RAG检索增强生成',
      titleLower: 'rag检索增强生成',
      hexoDate: '2025/09/12',
    },
    'LLM': {
      title: 'LLM',
      titleLower: 'llm',
      hexoDate: '2025/09/13',
    },
  };

  test('标准 WikiLink 转换', () => {
    const result = convertWikiLinks('参见 [[RAG检索增强生成]]', wikiMeta);
    expect(result).toBe('参见 [RAG检索增强生成](/2025/09/12/RAG检索增强生成/)');
  });

  test('带别名的 WikiLink 转换', () => {
    const result = convertWikiLinks('[[RAG检索增强生成|更简洁的理解]]', wikiMeta);
    expect(result).toBe('[更简洁的理解](/2025/09/12/RAG检索增强生成/)');
  });

  test('大小写不敏感匹配', () => {
    const result = convertWikiLinks('[[rag检索增强生成]]', wikiMeta);
    expect(result).toContain('/2025/09/12/RAG检索增强生成/');
  });

  test('未匹配时降级为相对路径', () => {
    const result = convertWikiLinks('[[未知页面]]', wikiMeta);
    expect(result).toBe('[未知页面](/未知页面/)');
  });

  test('普通 Markdown 链接不转换', () => {
    const result = convertWikiLinks('[普通链接](https://example.com)', wikiMeta);
    expect(result).toBe('[普通链接](https://example.com)');
  });
});

// ============ 审计格式验证 ============

describe('审计格式验证', () => {
  test('有效审计文件名', () => {
    expect(isValidAuditFilename('AUDIT-2026-001.md')).toBe(true);
    expect(isValidAuditFilename('AUDIT-2026-123.md')).toBe(true);
  });

  test('无效审计文件名', () => {
    expect(isValidAuditFilename('audit-2026-001.md')).toBe(false);
    expect(isValidAuditFilename('AUDIT-26-001.md')).toBe(false);
    expect(isValidAuditFilename('AUDIT-2026-01.md')).toBe(false);
    expect(isValidAuditFilename('README.md')).toBe(false);
  });

  test('有效审计 frontmatter', () => {
    const fm = {
      id: 'AUDIT-2026-001',
      target: '[[RAG]]',
      type: 'quality',
      severity: 'major',
      status: 'open',
      comment: '内容质量需改善',
      suggested_action: 'recompile',
      created: '2026-04-24',
    };
    const result = validateAuditFrontmatter(fm);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test('缺失必填字段', () => {
    const fm = { id: 'AUDIT-2026-001', target: '[[RAG]]' };
    const result = validateAuditFrontmatter(fm);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('type');
    expect(result.missing).toContain('severity');
  });

  test('审计类型白名单完整性', () => {
    expect(AUDIT_TYPES).toEqual(expect.arrayContaining(['quality', 'dead_link', 'duplicate', 'structure']));
    expect(AUDIT_TYPES.length).toBe(7);
  });

  test('审计建议操作白名单完整性', () => {
    expect(AUDIT_ACTIONS).toEqual(expect.arrayContaining(['recompile', 'merge', 'split', 'fix_link']));
    expect(AUDIT_ACTIONS.length).toBe(7);
  });
});
