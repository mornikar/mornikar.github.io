/**
 * Wiki Compile 脚本 v1.0 (Phase 1: 编译式知识库)
 *
 * 核心理念（参照 llm-wiki-skill）：
 *   raw/ 中的原始素材 → AI 编译 → concepts/entities/ 结构化 wiki 页面
 *   知识随 compile 次数复合增长
 *
 * 功能：
 *   1. 扫描 raw/ 中新增/变更的 md 文件
 *   2. 调用 AI（OpenAI 兼容接口）编译 raw 内容为结构化 wiki 页面
 *   3. 自动生成 frontmatter（title, type, tags, summary）
 *   4. 自动插入 [[WikiLink]] 交叉引用
 *   5. 输出到 concepts/ 或 entities/ 目录
 *   6. 增量编译：只处理新增/变更的 raw 文件
 *
 * 用法：
 *   node wiki-compile.js                # 增量编译
 *   node wiki-compile.js --force        # 强制全量编译
 *   node wiki-compile.js --dry-run      # 预览，不写入文件
 *   node wiki-compile.js --file <path>  # 编译指定 raw 文件
 *   node wiki-compile.js --test         # 运行内置测试
 *
 * 环境变量（必需）：
 *   WIKI_COMPILE_API_KEY   - AI API Key
 *   WIKI_COMPILE_ENDPOINT  - AI API 端点（OpenAI 兼容）
 *   WIKI_COMPILE_MODEL     - 模型名称
 *
 *   或使用 .wiki/compile-config.json 配置文件
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

// ============ 配置 ============
const WIKI_DIR = path.join(__dirname, '..', '.wiki');
const RAW_DIR = path.join(WIKI_DIR, 'raw');
const CONCEPTS_DIR = path.join(WIKI_DIR, 'concepts');
const ENTITIES_DIR = path.join(WIKI_DIR, 'entities');
const COMPILE_META_FILE = path.join(__dirname, '.wiki-compile-meta.json');
const CONFIG_FILE = path.join(WIKI_DIR, 'compile-config.json');

// 已编译的 wiki 页面索引（用于交叉引用）
const LAYER_DIRS = ['concepts', 'entities', 'comparisons', 'queries'];

// raw/ 子目录到目标 layer 的映射
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

// ============ 参数解析 ============
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const RUN_TEST = args.includes('--test');
const FILE_INDEX = args.indexOf('--file');
const TARGET_FILE = FILE_INDEX !== -1 && args[FILE_INDEX + 1] ? args[FILE_INDEX + 1] : null;

// ============ AI 配置 ============
function loadAIConfig() {
    // 1. 优先读配置文件
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            if (cfg.apiKey && cfg.endpoint && cfg.model) {
                return cfg;
            }
        } catch (e) {
            console.warn(`⚠️ 配置文件解析失败: ${e.message}`);
        }
    }

    // 2. 读环境变量
    const apiKey = process.env.WIKI_COMPILE_API_KEY;
    const endpoint = process.env.WIKI_COMPILE_ENDPOINT;
    const model = process.env.WIKI_COMPILE_MODEL;

    if (apiKey && endpoint && model) {
        return { apiKey, endpoint, model };
    }

    // 3. 尝试从 wiki-chat 的 localStorage 配置中读取（读取 settings 文件）
    // 这在 CI 环境不可用，但本地开发时可以作为 fallback
    return null;
}

// ============ 工具函数 ============
function md5File(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
}

function loadCompileMeta() {
    try {
        return JSON.parse(fs.readFileSync(COMPILE_META_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveCompileMeta(meta) {
    if (!DRY_RUN) fs.writeFileSync(COMPILE_META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

function slugify(title) {
    return title
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '-')
        .trim();
}

/** 解析 YAML frontmatter */
function parseFrontmatter(content) {
    const trimmed = content.trimStart();
    if (trimmed.indexOf('---') !== 0) return { frontmatter: {}, body: content };

    const secondDash = trimmed.indexOf('---', 3);
    if (secondDash === -1) return { frontmatter: {}, body: content };

    const yamlStr = trimmed.slice(3, secondDash).trim();
    let body = trimmed.slice(secondDash + 3).trim();

    // 跳过第二个 frontmatter 块
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

/** 确定一个 raw 文件应该编译到哪个 layer */
function determineTargetLayer(rawRelPath, frontmatter) {
    // 1. 根据 raw 子目录映射（编译架构下，目录映射优先）
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

    // 2. frontmatter.type 作为 fallback
    if (frontmatter.type && LAYER_DIRS.includes(frontmatter.type)) {
        return frontmatter.type;
    }

    // 3. 默认 → concepts
    return 'concepts';
}

/** 获取目标目录 */
function getTargetDir(layer) {
    return layer === 'entities' ? ENTITIES_DIR : CONCEPTS_DIR;
}

// ============ AI 调用 ============

/**
 * 调用 OpenAI 兼容接口
 * @param {string} prompt - 用户 prompt
 * @param {object} config - AI 配置
 * @returns {Promise<string>} AI 回复
 */
async function callAI(prompt, config) {
    const endpoint = config.endpoint.replace(/\/$/, '');
    const body = JSON.stringify({
        model: config.model,
        messages: [
            {
                role: 'system',
                content: `你是一个专业的知识库编译器。你的任务是将原始笔记素材编译为结构化的 wiki 页面。

编译规则：
1. 提取核心概念和关键信息
2. 用清晰的标题层级组织内容
3. 为每个知识点生成准确的标签（从已有标签体系中选择）
4. 生成一句话摘要
5. 用 [[双括号]] 链接相关的 wiki 页面
6. 保持内容简洁，单页控制在 200 行内
7. 输出必须是纯 Markdown 格式

已有标签体系：AI, LLM, RAG, Prompt, Agent, 机器学习, 产品, 开发, 学习, wiki, Hexo, 博客, 训练优化, 检索增强, Docker, Python, Flask, JavaScript, MySQL, Ubuntu, Git, 版本控制, 云环境, OS, ML, 数据分析, 产品经理, PRD, AIGC, 部署, 多模态, PDF, 嵌入, Snippet`
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
    });

    return new Promise((resolve, reject) => {
        const url = new URL(`${endpoint}/chat/completions`);
        const lib = url.protocol === 'https:' ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 120000, // 2分钟超时
        };

        if (config.apiKey) {
            options.headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`API 错误 ${res.statusCode}: ${data.slice(0, 500)}`));
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content || '';
                    resolve(content);
                } catch (e) {
                    reject(new Error(`解析 AI 回复失败: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('AI 请求超时')); });
        req.write(body);
        req.end();
    });
}

// ============ Wiki 页面索引 ============

/** 扫描现有 wiki 页面，构建标题索引（用于交叉引用） */
function buildWikiIndex() {
    const index = {}; // title → { layer, file, tags }

    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                scan(full);
            } else if (item.endsWith('.md')) {
                const { frontmatter, body } = parseFrontmatter(fs.readFileSync(full, 'utf-8'));
                const title = frontmatter.title || path.basename(item, '.md');
                index[title] = {
                    layer: path.basename(dir),
                    file: full,
                    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
                    summary: frontmatter.summary || '',
                };
            }
        }
    }

    scan(WIKI_DIR);
    return index;
}

/** 构建交叉引用上下文（告知 AI 有哪些已有页面可链接） */
function buildWikiLinkContext(wikiIndex) {
    const entries = Object.entries(wikiIndex);
    if (entries.length === 0) return '';

    const lines = ['\n## 已有 wiki 页面（可使用 [[页面标题]] 链接）\n'];
    for (const [title, info] of entries) {
        const tagStr = info.tags.length > 0 ? ` [${info.tags.join(',')}]` : '';
        lines.push(`- [[${title}]]${tagStr}`);
    }
    return lines.join('\n');
}

// ============ 编译核心逻辑 ============

/**
 * 编译单个 raw 文件
 * @param {string} rawPath - raw 文件的完整路径
 * @param {string} rawRelPath - 相对于 .wiki/ 的路径
 * @param {object} wikiIndex - 现有 wiki 页面索引
 * @param {object} config - AI 配置
 * @returns {object} 编译结果
 */
async function compileSingle(rawPath, rawRelPath, wikiIndex, config) {
    const content = fs.readFileSync(rawPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const title = frontmatter.title || path.basename(rawPath, '.md');
    const targetLayer = determineTargetLayer(rawRelPath, frontmatter);
    const targetDir = getTargetDir(targetLayer);

    // 检查是否已有对应的编译页面
    const existingCompiled = findExistingCompiled(title, targetDir);
    const wikiLinkCtx = buildWikiLinkContext(wikiIndex);

    // 构建编译 prompt
    let prompt = '';
    if (existingCompiled) {
        // 增量编译：已有页面，合并新内容
        const existingContent = fs.readFileSync(existingCompiled, 'utf-8');
        prompt = `请将以下新的原始素材合并到已有的 wiki 页面中。

## 已有 wiki 页面内容

${existingContent}

## 新的原始素材

${body || content}
${wikiLinkCtx}

请输出合并后的完整 wiki 页面（纯 Markdown，不要包含 frontmatter，我会自动生成）。`;
    } else {
        // 首次编译
        prompt = `请将以下原始笔记编译为结构化的 wiki 页面。

## 原始素材

${body || content}
${wikiLinkCtx}

请输出编译后的 wiki 页面（纯 Markdown，不要包含 frontmatter，我会自动生成）。`;
    }

    console.log(`  🤖 调用 AI 编译: ${title}...`);

    let aiContent;
    try {
        aiContent = await callAI(prompt, config);
    } catch (e) {
        console.log(`  ❌ AI 编译失败: ${title} - ${e.message}`);
        return null;
    }

    // 清理 AI 输出（移除可能的 markdown 代码块包裹）
    aiContent = aiContent.trim();
    if (aiContent.startsWith('```markdown')) {
        aiContent = aiContent.slice('```markdown'.length);
    }
    if (aiContent.startsWith('```')) {
        aiContent = aiContent.slice(3);
    }
    if (aiContent.endsWith('```')) {
        aiContent = aiContent.slice(0, -3);
    }
    aiContent = aiContent.trim();

    // 从 AI 内容中提取标题和标签（如果 AI 在内容中包含了一级标题）
    let extractedTitle = title;
    let extractedSummary = '';
    const titleMatch = aiContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        extractedTitle = titleMatch[1].trim();
    }

    // 提取第一段作为摘要候选
    const firstParagraph = aiContent.replace(/^#.*$/gm, '').trim().split('\n\n')[0];
    if (firstParagraph && firstParagraph.length < 200) {
        extractedSummary = firstParagraph.replace(/\n/g, ' ').trim();
    }

    // 推断标签
    const tags = inferTags(body || content, frontmatter, targetLayer);

    // 生成 frontmatter
    const today = new Date().toISOString().split('T')[0];
    const created = frontmatter.created || today;
    const wikiFrontmatter = [
        '---',
        `title: ${extractedTitle}`,
        `type: ${targetLayer}`,
        `tags: [${tags.join(', ')}]`,
        `created: ${created}`,
        `updated: ${today}`,
        `source: ${rawRelPath.replace(/\\/g, '/')}`,
    ];
    if (extractedSummary) {
        wikiFrontmatter.push(`summary: ${extractedSummary}`);
    }
    wikiFrontmatter.push('---');

    const wikiContent = wikiFrontmatter.join('\n') + '\n\n' + aiContent;

    // 确定输出路径
    const safeName = slugify(extractedTitle) + '.md';
    const outputPath = path.join(targetDir, safeName);

    return {
        title: extractedTitle,
        layer: targetLayer,
        outputPath,
        wikiContent,
        rawPath,
        rawRelPath,
        tags,
    };
}

/** 在目标目录中查找已有的编译页面 */
function findExistingCompiled(title, targetDir) {
    if (!fs.existsSync(targetDir)) return null;

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
        const full = path.join(targetDir, file);
        const { frontmatter } = parseFrontmatter(fs.readFileSync(full, 'utf-8'));
        if (frontmatter.title === title) return full;
        // 也检查 source 字段（同源文件）
    }
    return null;
}

/** 从内容推断标签 */
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

    // 根据 layer 添加基础标签
    if (layer === 'concepts') tags.add('wiki');
    if (layer === 'entities') tags.add('wiki');

    return [...tags].slice(0, 8); // 最多8个标签
}

// ============ 主逻辑 ============

async function main() {
    console.log('\n🔧 Wiki Compile 脚本 v1.0 (Phase 1)\n');
    if (DRY_RUN) console.log('🔍 [Dry-run 模式] 仅预览，不写入文件\n');

    const config = loadAIConfig();
    if (!config && !DRY_RUN) {
        console.error('❌ 未找到 AI 配置。请设置以下方式之一：');
        console.error('   1. 创建 .wiki/compile-config.json（推荐）');
        console.error('   2. 设置环境变量 WIKI_COMPILE_API_KEY / WIKI_COMPILE_ENDPOINT / WIKI_COMPILE_MODEL');
        console.error('\ncompile-config.json 示例：');
        console.error(JSON.stringify({
            apiKey: 'your-api-key',
            endpoint: 'https://open.bigmodel.cn/api/paas/v4',
            model: 'glm-4-flash'
        }, null, 2));
        process.exit(1);
    }

    if (config) {
        console.log(`📡 AI 模型: ${config.model}`);
        console.log(`📡 API 端点: ${config.endpoint}\n`);
    } else if (DRY_RUN) {
        console.log('📡 [Dry-run] 未配置 AI，仅预览待编译文件列表\n');
    }

    // 确保目标目录存在
    [CONCEPTS_DIR, ENTITIES_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 创建目录: ${dir}`);
        }
    });

    const prevMeta = loadCompileMeta();
    const wikiIndex = buildWikiIndex();
    console.log(`📚 已有 wiki 页面: ${Object.keys(wikiIndex).length} 个\n`);

    // 扫描 raw/ 目录，收集需要编译的文件
    const rawFiles = [];
    function scanRaw(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanRaw(full);
            } else if (item.name.endsWith('.md')) {
                const relPath = path.relative(WIKI_DIR, full);
                rawFiles.push({ fullPath: full, relPath });
            }
        }
    }

    // 如果指定了文件，只编译该文件
    if (TARGET_FILE) {
        const resolved = path.resolve(TARGET_FILE);
        if (!fs.existsSync(resolved)) {
            console.error(`❌ 文件不存在: ${resolved}`);
            process.exit(1);
        }
        const relPath = path.relative(WIKI_DIR, resolved);
        rawFiles.push({ fullPath: resolved, relPath });
    } else {
        scanRaw(RAW_DIR);
    }

    // 过滤：增量编译只处理新增/变更的文件
    const toCompile = [];
    let skippedCount = 0;

    for (const file of rawFiles) {
        if (FORCE) {
            toCompile.push(file);
            continue;
        }

        const contentMd5 = md5File(file.fullPath);
        const prev = prevMeta[file.fullPath];

        if (prev && prev.md5 === contentMd5 && prev.compiledAt) {
            skippedCount++;
            continue;
        }

        toCompile.push(file);
    }

    console.log(`📄 扫描到 ${rawFiles.length} 个 raw 文件`);
    console.log(`   需要编译: ${toCompile.length}`);
    console.log(`   跳过(未变): ${skippedCount}\n`);

    if (toCompile.length === 0) {
        console.log('✅ 没有需要编译的文件');
        return;
    }

    // 如果没有 AI 配置，只显示待编译文件列表
    if (!config) {
        console.log('\n📋 待编译文件列表：');
        toCompile.forEach((file, i) => {
            const { frontmatter } = parseFrontmatter(fs.readFileSync(file.fullPath, 'utf-8'));
            const title = frontmatter.title || path.basename(file.fullPath, '.md');
            const layer = determineTargetLayer(file.relPath, frontmatter);
            console.log(`  ${i + 1}. ${title} → ${layer}/ (${file.relPath.replace(/\\/g, '/')})`);
        });
        console.log(`\n共 ${toCompile.length} 个文件等待编译。配置 AI 后即可开始编译。`);
        return;
    }

    // 逐个编译
    const compiled = [];
    const errors = [];

    for (const file of toCompile) {
        try {
            const result = await compileSingle(file.fullPath, file.relPath, wikiIndex, config);
            if (result) {
                if (DRY_RUN) {
                    console.log(`  📝 [预览] ${result.title} → ${result.layer}/${path.basename(result.outputPath)}`);
                    console.log(`     标签: ${result.tags.join(', ')}`);
                } else {
                    // 写入文件
                    fs.writeFileSync(result.outputPath, result.wikiContent, 'utf-8');
                    console.log(`  ✅ ${result.title} → ${result.layer}/${path.basename(result.outputPath)}`);
                }

                compiled.push(result);

                // 更新 meta
                const contentMd5 = md5File(file.fullPath);
                prevMeta[file.fullPath] = {
                    md5: contentMd5,
                    compiledAt: new Date().toISOString(),
                    outputPath: result.outputPath,
                    layer: result.layer,
                };
            }
        } catch (e) {
            errors.push({ file: file.relPath, error: e.message });
            console.log(`  ❌ 编译失败: ${file.relPath} - ${e.message}`);
        }
    }

    // 更新 index.md
    if (!DRY_RUN && compiled.length > 0) {
        updateWikiIndex(wikiIndex, compiled);
    }

    // 打印统计
    console.log('\n========================================');
    console.log('📊 编译统计');
    console.log('========================================');
    console.log(`  编译成功: ${compiled.length}`);
    console.log(`  编译失败: ${errors.length}`);
    console.log(`  跳过(未变): ${skippedCount}`);

    if (compiled.length > 0) {
        const byLayer = {};
        compiled.forEach(r => { byLayer[r.layer] = (byLayer[r.layer] || 0) + 1; });
        Object.entries(byLayer).forEach(([layer, count]) => {
            console.log(`  → ${layer}: ${count}`);
        });
    }

    if (!DRY_RUN && compiled.length > 0) {
        saveCompileMeta(prevMeta);
        appendCompileLog(compiled);
    }

    // Phase 2: 生成 wiki-index.json（供 wiki-chat 检索使用）
    if (!DRY_RUN) {
        generateWikiSearchIndex();
    }

    console.log('\n✨ ' + (DRY_RUN ? 'Dry-run 完成！' : '编译完成！'));
    if (!DRY_RUN && compiled.length > 0) {
        console.log('   运行 node scripts/wiki-to-hexo.js 将编译结果同步到 Hexo');
    }
}

/** 更新 wiki index.md */
function updateWikiIndex(wikiIndex, compiled) {
    const INDEX_FILE = path.join(WIKI_DIR, 'index.md');
    if (!fs.existsSync(INDEX_FILE)) return;

    // 刷新索引
    for (const result of compiled) {
        wikiIndex[result.title] = {
            layer: result.layer,
            file: result.outputPath,
            tags: result.tags,
        };
    }

    // 重建统计
    const counts = {};
    LAYER_DIRS.forEach(dir => {
        const dirPath = path.join(WIKI_DIR, dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
            counts[dir] = files.length;
        }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // 读取并清理旧 index
    let content = fs.readFileSync(INDEX_FILE, 'utf-8');
    // 移除重复的统计块
    const statsRegex = /## 统计\n\n(- .+\n)+- 总计: \d+\n*/g;
    content = content.replace(statsRegex, '');

    // 重建统计块
    const statsBlock = [
        '',
        '## 统计',
        '',
        ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`),
        `- 总计: ${total}`,
        '',
    ].join('\n');

    // 在"最近更新"前插入
    if (content.includes('## 最近更新')) {
        content = content.replace('## 最近更新', statsBlock + '## 最近更新');
    } else {
        content = content.trimEnd() + '\n' + statsBlock;
    }

    fs.writeFileSync(INDEX_FILE, content, 'utf-8');
    console.log('\n  📑 更新了 index.md 统计');
}

/** 追加编译日志 */
function appendCompileLog(compiled) {
    const LOG_FILE = path.join(WIKI_DIR, 'log.md');
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const entries = compiled.map(r =>
        `- ${timestamp} | compile | [[${r.title}]] ← ${r.rawRelPath.replace(/\\/g, '/')} → ${r.layer}/`
    ).join('\n');

    if (fs.existsSync(LOG_FILE)) {
        let logContent = fs.readFileSync(LOG_FILE, 'utf-8');
        // 在文件开头插入（log 是 append-only，最新在前）
        const insertAfter = logContent.indexOf('\n', logContent.indexOf('\n') + 1);
        if (insertAfter !== -1) {
            logContent = logContent.slice(0, insertAfter + 1) + entries + '\n' + logContent.slice(insertAfter + 1);
        } else {
            logContent = entries + '\n' + logContent;
        }
        fs.writeFileSync(LOG_FILE, logContent, 'utf-8');
    }
}

// ============ 单元测试 ============

function runTests() {
    console.log('\n🧪 Wiki Compile 单元测试\n');
    console.log('========================================');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ ${name}`);
            passed++;
        } catch (e) {
            console.log(`  ❌ ${name}`);
            console.log(`     错误: ${e.message}`);
            failed++;
        }
    }

    function assertEqual(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`${msg} 期望: ${expected}, 实际: ${actual}`);
        }
    }

    // 测试 1: determineTargetLayer
    test('determineTargetLayer: AI_Agent → concepts', () => {
        assertEqual(determineTargetLayer('raw\\AI_Agent\\test.md', {}), 'concepts');
    });

    test('determineTargetLayer: articles/随笔 → entities', () => {
        assertEqual(determineTargetLayer('raw\\articles\\随笔\\test.md', {}), 'entities');
    });

    test('determineTargetLayer: frontmatter.type 作为 fallback', () => {
        // 当目录映射匹配不到时，才用 frontmatter.type
        assertEqual(determineTargetLayer('raw\\unknown_dir\\test.md', { type: 'entities' }), 'entities');
    });

    test('determineTargetLayer: 目录映射优先于 frontmatter.type', () => {
        // ML 目录映射到 concepts，即使 frontmatter 说 entities
        assertEqual(determineTargetLayer('raw\\ML\\test.md', { type: 'entities' }), 'concepts');
    });

    // 测试 2: inferTags
    test('inferTags: AI 关键词', () => {
        const tags = inferTags('这是一篇关于AI大模型的文章', {}, 'concepts');
        assertEqual(tags.includes('AI'), true, '应包含 AI 标签');
    });

    test('inferTags: 继承 frontmatter 标签', () => {
        const tags = inferTags('内容', { tags: ['RAG', '检索增强'] }, 'concepts');
        assertEqual(tags.includes('RAG'), true, '应继承 RAG 标签');
        assertEqual(tags.includes('检索增强'), true, '应继承 检索增强 标签');
    });

    // 测试 3: parseFrontmatter
    test('parseFrontmatter: 解析 wiki 格式', () => {
        const result = parseFrontmatter('---\ntitle: 测试\ntype: concepts\ntags: [AI, LLM]\n---\n内容');
        assertEqual(result.frontmatter.title, '测试');
        assertEqual(result.body, '内容');
    });

    // 测试 4: slugify
    test('slugify: 特殊字符清理', () => {
        assertEqual(slugify('AI/模型*测试?'), 'AI-模型-测试-');
    });

    console.log('========================================');
    console.log(`结果: ${passed} 通过, ${failed} 失败\n`);
    return failed === 0;
}

// ============ 启动 ============

if (RUN_TEST) {
    const success = runTests();
    process.exit(success ? 0 : 1);
} else {
    main().catch(e => {
        console.error('❌ 编译失败:', e.message);
        process.exit(1);
    });
}
