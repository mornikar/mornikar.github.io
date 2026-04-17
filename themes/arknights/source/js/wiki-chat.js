/**
 * Wiki AI 对话侧边栏
 * Phase 6: 问答机器人
 *
 * 检索策略（混合 B 方案）：
 *   1. 优先：Dify RAG API（语义理解）
 *   2. 兜底：Pagefind 关键词搜索（精确匹配页面）
 *
 * API 地址自动切换：
 *   - 本地开发（localhost / 127.0.0.1）→ http://localhost/v1
 *   - 公网访问 → DIFY_PUBLIC_BASE（内网穿透后的公网地址）
 *
 * 配置说明：
 *   - DIFY_PUBLIC_BASE: 填入你的内网穿透公网地址（如 localtunnel / frp / ngrok 输出地址）
 *     示例：https://abc123.loca.lt  或  https://your-vps.com/dify
 *     注意：末尾不要加 /v1，代码会自动拼接
 */

;(function () {
  'use strict'

  // ─── 配置 ────────────────────────────────────────────────
  const DIFY_API_BASE    = 'http://localhost/v1'
  // ★ 公网 API 地址：Cloudflare Workers 代理（HTTPS）
  const DIFY_PUBLIC_BASE = 'https://dify-proxy.1548324254.workers.dev'
  const DIFY_API_KEY     = 'app-JznEvGv3JlWWISRmNdjRO7yE'

  // 从 URL 参数覆盖公网地址，格式：?dify=https://xxx.loca.lt
  const urlParamDify = new URLSearchParams(location.search).get('dify')
  const difyPublicAddr = urlParamDify || DIFY_PUBLIC_BASE
  const CHAT_TITLE    = 'Wiki AI 助手'
  const CHAT_PLACEHOLDER = '问我关于 LLM Wiki 的任何问题…'
  const WELCOME_MSG   = '你好！我是基于 Wiki 知识库的 AI 助手。可以问我关于 LLM 相关知识、模型对比、RAG 等问题。'

  // 判断是否本地环境（可直连 Dify）
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)

  // 动态选择 API 地址
  const difyBase = (isLocal || !difyPublicAddr)
    ? DIFY_API_BASE
    : difyPublicAddr.replace(/\/$/, '') + '/v1'

  // Pagefind 搜索引擎（懒加载）
  let pagefindInstance = null

  // Dify 会话 ID（多轮对话保持上下文）
  let conversationId = null

  // ─── DOM 创建 ────────────────────────────────────────────
  function createWidget() {
    // 悬浮按钮
    const fab = document.createElement('button')
    fab.id = 'wiki-chat-fab'
    fab.title = CHAT_TITLE
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`

    // 侧边栏容器
    const panel = document.createElement('div')
    panel.id = 'wiki-chat-panel'
    panel.setAttribute('aria-hidden', 'true')
    panel.innerHTML = `
      <div id="wiki-chat-header">
        <span id="wiki-chat-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          ${CHAT_TITLE}
        </span>
        <div id="wiki-chat-header-actions">
          <button id="wiki-chat-clear" title="清空对话">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
          <button id="wiki-chat-close" title="关闭">✕</button>
        </div>
      </div>
      <div id="wiki-chat-messages">
        <div class="wiki-chat-msg wiki-chat-msg--bot">
          <div class="wiki-chat-bubble">${WELCOME_MSG}</div>
        </div>
      </div>
      <div id="wiki-chat-search-results" style="display:none"></div>
      <div id="wiki-chat-input-area">
        <textarea id="wiki-chat-input" placeholder="${CHAT_PLACEHOLDER}" rows="1"></textarea>
        <button id="wiki-chat-send" title="发送">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      ${!isLocal && !difyPublicAddr ? `<div id="wiki-chat-offline-tip">⚠ AI 助手需配置公网穿透地址后才能在公网使用。</div>` : ''}
      ${!isLocal && difyPublicAddr ? `<div id="wiki-chat-offline-tip">🌐 公网模式 · AI 助手已连接</div>` : ''}
    `

    document.body.appendChild(fab)
    document.body.appendChild(panel)
    return { fab, panel }
  }

  // ─── 消息渲染 ────────────────────────────────────────────
  function appendMessage(role, content, isStreaming) {
    const messages = document.getElementById('wiki-chat-messages')
    const div = document.createElement('div')
    div.className = `wiki-chat-msg wiki-chat-msg--${role}`
    const bubble = document.createElement('div')
    bubble.className = 'wiki-chat-bubble'
    // 简单 markdown：加粗、换行
    bubble.innerHTML = renderMarkdown(content)
    div.appendChild(bubble)
    if (isStreaming) div.dataset.streaming = 'true'
    messages.appendChild(div)
    messages.scrollTop = messages.scrollHeight
    return bubble
  }

  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
  }

  // ─── 预热：页面加载时静默 ping Dify ─────────────────────
  let isWarmedUp = false
  let warmUpTimer = null

  function warmUp() {
    if (!isWarmedUp && (isLocal || DIFY_PUBLIC_BASE)) {
      warmUpTimer = setTimeout(async () => {
        try {
          const warmBody = {
            inputs: {},
            query: '.',
            response_mode: 'streaming',
            conversation_id: '',
            user: 'wiki-warmup'
          }
          const resp = await fetch(`${difyBase}/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DIFY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(warmBody)
          })
          if (resp.ok) {
            // 消费掉流，不展示
            resp.body.getReader().cancel()
            isWarmedUp = true
            console.log('[WikiChat] 预热完成，模型已就绪')
          }
        } catch (e) {
          console.warn('[WikiChat] 预热失败:', e.message)
        }
      }, 2000) // 延迟2秒，等页面渲染完再预热
    }
  }

  // ─── 加载状态文案 ─────────────────────────────────────────
  const LOADING_MSGS = [
    '正在思考…',
    'AI 正在思考…',
    '请稍候…',
    '正在唤醒模型…',
    '模型加载中，请稍候…',
  ]

  function getLoadingMsg() {
    return LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)]
  }

  // ─── Dify 流式对话 ───────────────────────────────────────
  async function askDify(query, timeoutMs = 30000) {
    const body = {
      inputs: {},
      query,
      response_mode: 'streaming',
      conversation_id: conversationId || '',
      user: 'wiki-visitor'
    }

    console.log('[WikiChat] 发送请求到:', `${difyBase}/chat-messages`)

    // 带超时的 fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const resp = await fetch(`${difyBase}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    console.log('[WikiChat] 响应状态:', resp.status)
    console.log('[WikiChat] Content-Type:', resp.headers.get('content-type'))

    if (!resp.ok) {
      const text = await resp.text()
      console.error('[WikiChat] API 错误:', text)
      throw new Error(`Dify API 错误 ${resp.status}: ${text}`)
    }

    const bubble = appendMessage('bot', '', true)
    let fullText = ''

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() // 保留不完整的行

        for (const line of lines) {
          if (!line.trim()) continue
          console.log('[WikiChat] 收到数据:', line.substring(0, 100))
          
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            if (json.event === 'message') {
              fullText += json.answer || ''
              bubble.innerHTML = renderMarkdown(fullText)
              bubble.closest('.wiki-chat-msg').scrollIntoView({ block: 'end', behavior: 'smooth' })
            }
            if (json.event === 'message_end') {
              conversationId = json.conversation_id || conversationId
              console.log('[WikiChat] 对话结束, conversationId:', conversationId)
            }
          } catch (_) { /* 跳过非 JSON 行 */ }
        }
      }
    } catch (e) {
      console.error('[WikiChat] 读取流错误:', e)
    }

    bubble.closest('.wiki-chat-msg').removeAttribute('data-streaming')
    return fullText
  }

  // ─── Pagefind 兜底搜索 ───────────────────────────────────
  async function searchPagefind(query) {
    try {
      if (!pagefindInstance) {
        // Pagefind 懒加载（需要先 hexo generate + pagefind 索引）
        // @ts-ignore
        const pf = await import('/pagefind/pagefind.js')
        await pf.init()
        pagefindInstance = pf
      }
      const results = await pagefindInstance.search(query)
      const data = await Promise.all(results.results.slice(0, 5).map(r => r.data()))
      return data
    } catch (e) {
      console.warn('[WikiChat] Pagefind 不可用:', e.message)
      return []
    }
  }

  function renderSearchResults(results, container) {
    if (!results.length) {
      container.style.display = 'none'
      return
    }
    container.style.display = 'block'
    container.innerHTML = `
      <div class="wiki-search-label">📄 相关页面</div>
      <ul class="wiki-search-list">
        ${results.map(r => `
          <li>
            <a href="${r.url}" target="_blank">${r.meta?.title || r.url}</a>
            ${r.excerpt ? `<p>${r.excerpt}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    `
  }

  // ─── 发送逻辑 ────────────────────────────────────────────
  async function handleSend() {
    const input = document.getElementById('wiki-chat-input')
    const sendBtn = document.getElementById('wiki-chat-send')
    const searchContainer = document.getElementById('wiki-chat-search-results')
    const query = input.value.trim()
    if (!query) return

    input.value = ''
    input.style.height = 'auto'
    sendBtn.disabled = true

    // 用户消息
    appendMessage('user', query)

    // 同步触发 Pagefind 搜索（不等 AI，立即展示页面链接）
    searchPagefind(query).then(results => renderSearchResults(results, searchContainer))

    // AI 回答（需要本地 Dify 或已配置公网穿透地址）
    if (isLocal || DIFY_PUBLIC_BASE) {
      const typingDiv = document.createElement('div')
      typingDiv.className = 'wiki-chat-msg wiki-chat-msg--bot wiki-chat-typing'
      typingDiv.innerHTML = `<div class="wiki-chat-bubble">${getLoadingMsg()}</div>`
      document.getElementById('wiki-chat-messages').appendChild(typingDiv)

      try {
        await askDify(query)
      } catch (e) {
        if (e.name === 'AbortError') {
          appendMessage('bot', `⏳ AI 响应超时（>${timeoutMs/1000}秒），可能是模型正在加载中。请稍后重试，或查看下方相关页面。`)
        } else {
          appendMessage('bot', `⚠ AI 暂时无法回答（${e.message}），请查看下方相关页面。`)
        }
      } finally {
        typingDiv.remove()
      }
    } else {
      appendMessage('bot', '当前为公网访问，AI 对话需在本地运行。请查看上方相关页面。')
    }

    sendBtn.disabled = false
    input.focus()
  }

  // ─── 自动调整输入框高度 ──────────────────────────────────
  function autoResize(el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ─── 初始化 ──────────────────────────────────────────────
  function init() {
    const { fab, panel } = createWidget()

    // 开关面板
    function openPanel() {
      panel.classList.add('wiki-chat-panel--open')
      panel.setAttribute('aria-hidden', 'false')
      fab.classList.add('wiki-chat-fab--active')
      document.getElementById('wiki-chat-input').focus()
    }
    function closePanel() {
      panel.classList.remove('wiki-chat-panel--open')
      panel.setAttribute('aria-hidden', 'true')
      fab.classList.remove('wiki-chat-fab--active')
    }

    fab.addEventListener('click', () => {
      panel.classList.contains('wiki-chat-panel--open') ? closePanel() : openPanel()
    })

    document.getElementById('wiki-chat-close').addEventListener('click', closePanel)

    // 清空对话
    document.getElementById('wiki-chat-clear').addEventListener('click', () => {
      conversationId = null
      const messages = document.getElementById('wiki-chat-messages')
      messages.innerHTML = ''
      appendMessage('bot', WELCOME_MSG)
      document.getElementById('wiki-chat-search-results').style.display = 'none'
    })

    // 页面加载时预热 Dify（静默 ping，不展示结果）
    warmUp()
    document.getElementById('wiki-chat-clear').addEventListener('click', () => {
      conversationId = null
      const messages = document.getElementById('wiki-chat-messages')
      messages.innerHTML = ''
      appendMessage('bot', WELCOME_MSG)
      document.getElementById('wiki-chat-search-results').style.display = 'none'
    })

    // 发送
    document.getElementById('wiki-chat-send').addEventListener('click', handleSend)
    document.getElementById('wiki-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    })
    document.getElementById('wiki-chat-input').addEventListener('input', function () {
      autoResize(this)
    })

    // ESC 关闭
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
