#!/usr/bin/env node
/**
 * sync-wiki-to-dify.js
 * Phase 6: 将 .wiki/ 目录下的 Markdown 文件同步到 Dify 知识库
 *
 * 使用方式：
 *   node scripts/sync-wiki-to-dify.js [--dry-run]
 *
 * 环境变量（或直接修改下方 CONFIG）：
 *   DIFY_DATASET_API_KEY  - Dify 知识库 API Key（Settings → API Keys → Dataset API）
 *   DIFY_DATASET_ID       - 知识库 ID（可从 Dify URL 或 API 获取）
 *   DIFY_API_BASE         - Dify API 地址（默认 http://localhost/v1）
 *
 * 获取 Dataset API Key 步骤：
 *   1. 打开 Dify → 右上角头像 → Settings → API Keys
 *   2. 切换到 "Dataset API" 标签
 *   3. 生成新 Key（以 "dataset-" 开头）
 *
 * 获取 Dataset ID 步骤：
 *   1. 打开 Dify → 知识库 → 选中你的知识库
 *   2. URL 中最后一段即为 Dataset ID
 *      例如：http://localhost/datasets/abc123  →  ID = abc123
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const https = require('https')
const http  = require('http')

// ─── 配置 ─────────────────────────────────────────────────
const CONFIG = {
  apiBase:      process.env.DIFY_API_BASE      || 'http://localhost/v1',
  datasetApiKey: process.env.DIFY_DATASET_API_KEY || 'dataset-REPLACE_ME',
  datasetId:    process.env.DIFY_DATASET_ID    || 'REPLACE_ME',
  wikiDir:      path.resolve(__dirname, '../.wiki'),
  // 同步的子目录（留空则同步全部 .md 文件）
  syncDirs:     ['concepts', 'entities', 'comparisons', 'queries'],
  dryRun:       process.argv.includes('--dry-run'),
}

// ─── HTTP 工具 ────────────────────────────────────────────
function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url)
    const lib      = parsed.protocol === 'https:' ? https : http
    const options  = {
      method,
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      headers,
    }
    const req = lib.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body))
    req.end()
  })
}

function authHeaders(extra) {
  return {
    'Authorization': `Bearer ${CONFIG.datasetApiKey}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

// ─── 获取知识库现有文档列表 ────────────────────────────────
async function listDocuments() {
  const url = `${CONFIG.apiBase}/datasets/${CONFIG.datasetId}/documents?page=1&limit=100`
  const res = await request('GET', url, authHeaders())
  if (res.status !== 200) throw new Error(`获取文档列表失败: ${res.status} ${JSON.stringify(res.body)}`)
  return res.body.data || []
}

// ─── 删除文档 ─────────────────────────────────────────────
async function deleteDocument(docId) {
  const url = `${CONFIG.apiBase}/datasets/${CONFIG.datasetId}/documents/${docId}`
  const res = await request('DELETE', url, authHeaders())
  if (res.status !== 204 && res.status !== 200) {
    console.warn(`  ⚠ 删除失败 ${docId}: ${res.status}`)
  }
}

// ─── 上传/更新文档 ────────────────────────────────────────
async function upsertDocument(name, content) {
  const body = {
    name,
    text: content,
    indexing_technique: 'high_quality',
    process_rule: {
      mode: 'automatic',
    },
  }
  const url = `${CONFIG.apiBase}/datasets/${CONFIG.datasetId}/document/create-by-text`
  const res = await request('POST', url, authHeaders(), body)
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`上传文档失败 ${name}: ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body
}

// ─── 收集本地 Wiki 文件 ───────────────────────────────────
function collectWikiFiles() {
  const files = []
  for (const dir of CONFIG.syncDirs) {
    const dirPath = path.join(CONFIG.wikiDir, dir)
    if (!fs.existsSync(dirPath)) continue
    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith('.md')) continue
      const fullPath = path.join(dirPath, file)
      const content  = fs.readFileSync(fullPath, 'utf-8')
      files.push({
        name: `${dir}/${file}`,
        content,
        size: content.length,
      })
    }
  }
  return files
}

// ─── 主逻辑 ──────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════')
  console.log('  Wiki → Dify 知识库同步')
  if (CONFIG.dryRun) console.log('  [DRY-RUN 模式，不会实际修改]')
  console.log('═══════════════════════════════════')

  // 检查配置
  if (CONFIG.datasetApiKey === 'dataset-REPLACE_ME' || CONFIG.datasetId === 'REPLACE_ME') {
    console.error('\n❌ 请先配置 DIFY_DATASET_API_KEY 和 DIFY_DATASET_ID')
    console.error('   参见文件顶部注释获取方法')
    process.exit(1)
  }

  // 收集本地文件
  const localFiles = collectWikiFiles()
  console.log(`\n📁 本地 Wiki 文件: ${localFiles.length} 个`)
  localFiles.forEach(f => console.log(`   ${f.name} (${f.size} bytes)`))

  if (CONFIG.dryRun) {
    console.log('\n✅ DRY-RUN 完成，未做任何修改')
    return
  }

  // 获取远程文档
  console.log('\n📡 获取 Dify 知识库现有文档...')
  const remoteDocs = await listDocuments()
  console.log(`   远程文档: ${remoteDocs.length} 个`)

  // 删除所有旧文档（全量替换策略，保证内容一致）
  if (remoteDocs.length > 0) {
    console.log('\n🗑  清空旧文档...')
    for (const doc of remoteDocs) {
      process.stdout.write(`   删除: ${doc.name} ... `)
      await deleteDocument(doc.id)
      console.log('✓')
    }
  }

  // 上传新文档
  console.log('\n⬆  上传 Wiki 文件...')
  let success = 0, fail = 0
  for (const file of localFiles) {
    process.stdout.write(`   ${file.name} ... `)
    try {
      await upsertDocument(file.name, file.content)
      console.log('✓')
      success++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      fail++
    }
  }

  console.log('\n═══════════════════════════════════')
  console.log(`✅ 同步完成: ${success} 成功 / ${fail} 失败`)
  console.log('═══════════════════════════════════')
}

main().catch(e => {
  console.error('\n❌ 同步失败:', e.message)
  process.exit(1)
})
