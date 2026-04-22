/**
 * Wiki AI 对话侧边栏
 * Phase 7: 多模型接入 + 设置面板
 *
 * 接入模式：
 *   1. Dify（RAG 知识库） — 通过 Cloudflare Worker 代理
 *   2. 在线 API（OpenAI 兼容）— 直接调用商家 API
 *   3. 直连模型地址 — 连接本地/远程 OpenAI 兼容端点
 *
 * 登录页面：/login（独立页面）
 * 数据存储：localStorage（wiki-chat-settings）
 */

;(function () {
  'use strict'

  // ─── 常量 ────────────────────────────────────────────────
  const STORAGE_KEY = 'wiki-chat-settings'

  const DEFAULT_DIFY = {
    baseUrl: 'https://dify-proxy.1548324254.workers.dev',
    apiKey: 'app-JznEvGv3JlWWISRmNdjRO7yE'
  }

  const CHAT_TITLE    = 'Wiki AI Mornikar'
  const CHAT_PLACEHOLDER = '向猫女仆助手提问喵…'
  const WELCOME_MSG   = '喵～主人好！我是 Wiki 知识库的猫女仆助手。有什么编程或 AI 相关的问题，尽管问本喵就好喵～'

  const DEFAULT_PROMPT = '你是一个基于 Wiki 知识库的猫女仆助手，性格傲娇。回答会以"喵"结尾。非工作状态要称呼我为主人。擅长回答关于编程、AI、LLM、RAG 等技术问题。请用中文回答，保持简洁准确。'

  const LOADING_MSGS = [
    '喵…等本喵想想…',
    '唔…正在思考中喵…',
    '主人请稍候喵～',
    '正在唤醒猫女仆模式…',
    '喵喵喵？稍等一下下喵…',
  ]

  // ─── TTS 状态管理 ────────────────────────────────────────
  const TTS_STORAGE_KEY = 'wiki_tts_settings'
  let ttsEnabled = true
  let ttsVoice = ''
  let ttsSpeaking = false

  function loadTtsSettings() {
    try {
      // 与 Live2D 工具栏共享 TTS 设置
      const raw = localStorage.getItem('waifu_tts_settings')
      if (raw) {
        const s = JSON.parse(raw)
        ttsEnabled = s.enabled !== false
        ttsVoice = s.voice || ''
      }
    } catch (_) {}
  }

  function saveTtsSettings() {
    try {
      localStorage.setItem('waifu_tts_settings', JSON.stringify({
        enabled: ttsEnabled,
        voice: ttsVoice
      }))
    } catch (_) {}
  }

  async function speakText(text) {
    // 每次朗读前重新读取设置，确保与 Live2D 工具栏同步
    loadTtsSettings()
    if (!ttsEnabled || !text || !window.speechSynthesis) return
    // Chrome bug: cancel() 后立即 speak() 会导致后续播放失败
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel()
      await new Promise(r => setTimeout(r, 100))
    } else {
      speechSynthesis.cancel()
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'zh-CN'
    utter.rate = 1.0
    utter.pitch = 1.0
    if (ttsVoice) {
      const voices = speechSynthesis.getVoices()
      // 先尝试精确匹配（兼容完整 voiceURI 格式）
      let matched = voices.find(v =>
        (v.voiceURI || v.name) === ttsVoice || v.name === ttsVoice
      )
      // 精确匹配失败时，用关键字包含匹配（兼容 Live2D 工具栏保存的简短关键字如 "Yunxi"）
      if (!matched) {
        const matches = voices.filter(v =>
          (v.voiceURI && v.voiceURI.includes(ttsVoice)) ||
          (v.name && v.name.includes(ttsVoice))
        )
        // 优先级：Online (Natural) > Online > 其他
        matched = matches.find(v => /online.*natural|natural.*online/i.test(v.voiceURI || v.name))
        if (!matched) matched = matches.find(v => /online/i.test(v.voiceURI || v.name))
        if (!matched && matches.length > 0) matched = matches[0]
      }
      if (matched) utter.voice = matched
    }
    utter.onend = utter.onerror = () => {
      ttsSpeaking = false
      updateTtsUi()
    }
    ttsSpeaking = true
    updateTtsUi()
    speechSynthesis.speak(utter)
  }

  function updateTtsUi() {
    const toggle = document.getElementById('wiki-tts-toggle')
    const voiceName = document.getElementById('wiki-tts-voice-name')
    if (toggle) {
      toggle.classList.toggle('on', ttsEnabled)
      toggle.textContent = ttsEnabled ? '🔊' : '🔇'
      if (voiceName && ttsEnabled) {
        const label = getVoiceLabel(ttsVoice)
        voiceName.textContent = label ? ' ' + label : ''
      } else if (voiceName) {
        voiceName.textContent = ''
      }
    }
  }

  function getVoiceLabel(voiceId) {
    const labels = { Xiaoxiao: '晓晓', Yunxi: '云希', Yunyang: '云扬', Yunxia: '云夏', Yunjian: '云健', Xiaoyi: '小艺' }
    return labels[voiceId] || ''
  }

  const VOICE_PRESETS = [
    { id: 'Xiaoxiao', label: '晓晓' },
    { id: 'Yunxi',    label: '云希' },
    { id: 'Yunyang',  label: '云扬' },
    { id: 'Yunxia',  label: '云夏' },
    { id: 'Yunjian', label: '云健' },
    { id: 'Xiaoyi',  label: '小艺' },
  ]

  let voiceMap = {}  // id -> SpeechSynthesisVoice

  function buildVoicePopup() {
    const list = document.getElementById('wiki-tts-voice-list')
    if (!list) return
    list.innerHTML = ''
    const popup = document.getElementById('wiki-tts-popup')
    VOICE_PRESETS.forEach(p => {
      const btn = document.createElement('button')
      btn.className = 'wiki-tts-voice-item'
      btn.dataset.voice = p.id
      btn.textContent = p.label
      if (voiceMap[p.id]) btn.classList.add('available')
      btn.addEventListener('click', () => {
        // 统一存简短关键字（如 "Yunxi"），与 Live2D 工具栏一致
        // speakText 中会用关键字包含匹配找到完整 voiceURI
        ttsVoice = p.id
        ttsEnabled = true
        saveTtsSettings()
        updateTtsUi()
        hideVoicePopup()
      })
      list.appendChild(btn)
    })
  }

  function showVoicePopup() {
    const popup = document.getElementById('wiki-tts-popup')
    if (!popup) return
    buildVoicePopup()
    popup.style.display = 'block'
  }

  function hideVoicePopup() {
    const popup = document.getElementById('wiki-tts-popup')
    if (popup) popup.style.display = 'none'
  }

  function initTts() {
    loadTtsSettings()
    const toggle = document.getElementById('wiki-tts-toggle')
    if (!toggle) return

    // 加载可用音色
    const applyVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (!voices.length) return
      VOICE_PRESETS.forEach(p => {
        const matched = voices.find(v =>
          v.lang && v.lang.startsWith('zh') &&
          (v.name.toLowerCase().includes(p.id.toLowerCase()) ||
           v.localService)
        )
        if (matched) voiceMap[p.id] = matched
      })
      if (!ttsVoice && VOICE_PRESETS.length) {
        // 统一存简短关键字
        ttsVoice = VOICE_PRESETS[0].id
        saveTtsSettings()
      }
      updateTtsUi()
    }

    const vs = speechSynthesis.getVoices()
    if (vs.length) applyVoices()
    else {
      speechSynthesis.onvoiceschanged = applyVoices
      setTimeout(applyVoices, 500)
    }

    // 点击切换开关 / 弹出音色列表
    toggle.addEventListener('click', () => {
      const popup = document.getElementById('wiki-tts-popup')
      if (popup && popup.style.display === 'block') {
        hideVoicePopup()
        return
      }
      showVoicePopup()
    })

    // 点击其他地方关闭弹窗
    document.addEventListener('click', e => {
      const popup = document.getElementById('wiki-tts-popup')
      const toggle = document.getElementById('wiki-tts-toggle')
      if (popup && popup.style.display === 'block' &&
          !popup.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
        hideVoicePopup()
      }
    })

    updateTtsUi()
  }

  // ─── 用户设置管理 ────────────────────────────────────────
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return null
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  function getDefaultSettings() {
    return {
      mode: 'dify',
      username: '',
      prompt: DEFAULT_PROMPT,
      dify: { ...DEFAULT_DIFY },
      api: { endpoint: '', apiKey: '', model: '' },
      direct: { endpoint: '', apiKey: '', model: '' }
    }
  }

  function getSettings() {
    return loadSettings() || getDefaultSettings()
  }

  // ═══════════════════════════════════════════════════════════
  // Phase 8.5: RAG 页面上下文 + 全局知识库检索
  // ═══════════════════════════════════════════════════════════

  const RAG_CONFIG = {
    pageContextSelector: '#post-content',
    pageContextMaxLength: 3000,
    searchXmlPath: '/search.xml',
    includeCodeBlocks: false,
    contextTemplate: {
      pageContextTitle: '=== 用户当前阅读的页面 ===',
      searchContextTitle: '=== 博客全局检索结果 ===',
      instruction: '基于"当前阅读页面"或"全局检索"作答。补充上下文：',
      userQuestion: '用户实际提问:',
      truncateMsg: '[系统提示：页面内容过长已截断。请礼貌告知用户文章太长，未尽的信息需自行阅读原文。]'
    }
  }

  let blogIndex = []
  let blogIndexLoaded = false

  // 初始化博客索引（异步加载 search.xml）
  async function initBlogIndex() {
    if (blogIndexLoaded) return
    try {
      const res = await fetch(RAG_CONFIG.searchXmlPath)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xmlText = await res.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml')
      const entries = xmlDoc.querySelectorAll('entry')
      blogIndex = Array.from(entries).map(entry => {
        const titleNode = entry.querySelector('title')
        const contentNode = entry.querySelector('content')
        const urlNode = entry.querySelector('url')
        let pureText = ''
        if (contentNode) {
          const rawHtml = contentNode.textContent || ''
          const tempDoc = parser.parseFromString(rawHtml, 'text/html')
          let noise = 'script, style, noscript, link, iframe, svg'
          if (!RAG_CONFIG.includeCodeBlocks) noise += ', pre, figure.highlight, div.highlight'
          tempDoc.querySelectorAll(noise).forEach(el => el.remove())
          pureText = cleanTextContent(tempDoc.body.textContent)
        }
        return {
          title: titleNode ? titleNode.textContent.trim() : '',
          url: (() => {
            let raw = urlNode ? urlNode.textContent.trim() : ''
            if (!raw) return ''
            return raw.startsWith('/') ? window.location.origin + raw : raw
          })(),
          content: pureText
        }
      })
      blogIndexLoaded = true
      console.log('[WikiChat] 博客索引加载完成:', blogIndex.length, '篇文章')
    } catch (e) {
      console.warn('[WikiChat] 无法加载 search.xml，RAG 全局检索降级:', e)
    }
  }

  // 本地搜索博客索引
  function searchLocalBlog(keyword) {
    if (!blogIndex.length) return ''
    let terms = keyword
    const titleMatch = keyword.match(/\[(.*?)\]/)
    if (titleMatch && titleMatch[1]) {
      terms = titleMatch[1].trim()
    } else {
      terms = keyword.replace(/(帮我|找下|寻找|搜索|博客|中|有关|关于|的|文章|内容|请问|什么是|怎么)/g, '').trim() || keyword
    }
    const matched = blogIndex.filter(post =>
      (post.title && post.title.includes(terms)) ||
      (post.content && post.content.includes(terms))
    )
    if (!matched.length) return ''
    return matched.slice(0, 15).map(p =>
      `[标题: ${p.title}]\n[链接: ${p.url}]\n内容: ${p.content.substring(0, 300)}...`
    ).join('\n\n')
  }

  // 获取当前页面上下文
  function getCurrentPageContext() {
    const articleDOM = document.querySelector(RAG_CONFIG.pageContextSelector)
    if (!articleDOM) return ''
    const titleDOM = document.querySelector('#post-title') || document.querySelector('h1') || document.querySelector('title')
    const title = titleDOM ? titleDOM.innerText.trim() : '当前页面'
    const cloneDOM = articleDOM.cloneNode(true)
    let noise = 'script, style, noscript, iframe, svg, .post-outdate-notice, .clipboard-btn'
    if (!RAG_CONFIG.includeCodeBlocks) noise += ', pre, figure.highlight, div.highlight'
    cloneDOM.querySelectorAll(noise).forEach(el => el.remove())
    let pureText = cleanTextContent(cloneDOM.textContent)
    const maxLen = RAG_CONFIG.pageContextMaxLength
    if (pureText.length > maxLen) {
      pureText = pureText.substring(0, maxLen) + '\n\n' + RAG_CONFIG.contextTemplate.truncateMsg
    }
    return `[当前页面标题: ${title}]\n[页面纯净正文]: ${pureText}`
  }

  function cleanTextContent(text) {
    return (text || '').replace(/[\n\r\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  }

  // ─── 判断是否已登录配置 ──────────────────────────────────
  function isConfigured() {
    const s = getSettings()
    if (!s.username) return false
    if (s.mode === 'dify') return !!s.dify.apiKey
    if (s.mode === 'api') return !!(s.api.endpoint && s.api.apiKey && s.api.model)
    if (s.mode === 'direct') return !!(s.direct.endpoint && s.direct.model)
    return false
  }

  // ─── 未登录跳转 ──────────────────────────────────────────
  function redirectToLogin() {
    const root = document.querySelector('meta[name="wiki-root"]')?.content || '/'
    window.location.href = root + 'login/'
  }

  // ─── 消息渲染 ────────────────────────────────────────────
  function appendMessage(role, content, isStreaming) {
    const messages = document.getElementById('wiki-chat-messages')
    const div = document.createElement('div')
    div.className = `wiki-chat-msg wiki-chat-msg--${role}`
    const bubble = document.createElement('div')
    bubble.className = 'wiki-chat-bubble'
    bubble.innerHTML = renderMarkdown(content)
    div.appendChild(bubble)
    if (isStreaming) div.dataset.streaming = 'true'
    messages.appendChild(div)
    messages.scrollTop = messages.scrollHeight
    return bubble
  }

  function renderMarkdown(text) {
    if (!text) return ''
    // 优先使用 marked.js（CDN 加载）
    if (typeof marked !== 'undefined' && marked.parse) {
      try {
        let html = marked.parse(text, { breaks: true, gfm: true })
        // 清理空段落和多余换行
        html = html.replace(/>\n+</g, '><').replace(/\n+$/g, '')
        html = html.replace(/<p>[\s\u200B-\u200D\uFEFF\xA0]*<\/p>/gi, '')
                   .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
        // 链接新窗口打开
        const temp = document.createElement('div')
        temp.innerHTML = html
        temp.querySelectorAll('a').forEach(a => {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        })
        return temp.innerHTML
      } catch (e) {
        console.warn('[WikiChat] marked.js 解析失败，降级到正则:', e)
      }
    }
    // 降级方案
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
  }

  // ─── Pagefind 兜底搜索 ───────────────────────────────────
  let pagefindInstance = null

  async function searchPagefind(query) {
    try {
      if (!pagefindInstance) {
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

  // ─── 对话状态 ────────────────────────────────────────────
  let conversationId = null
  let chatHistory = []
  let turnCount = 0
  const MAX_TURNS = 4

  function resetConversation() {
    conversationId = null
    chatHistory = []
    turnCount = 0
  }

  // ─── Dify 模式对话 ──────────────────────────────────────
  async function askDify(query, settings, ragContext = '', timeoutMs = 60000) {
    const difyBase = settings.dify.baseUrl.replace(/\/$/, '') + '/v1'
    // 如果有 RAG 上下文，拼接到 query 前面
    const enrichedQuery = ragContext ? ragContext + '\n\n' + query : query
    const body = {
      inputs: {},
      query: enrichedQuery,
      response_mode: 'streaming',
      conversation_id: conversationId || '',
      user: settings.username || 'wiki-visitor'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const resp = await fetch(`${difyBase}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.dify.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Dify API 错误 ${resp.status}: ${text}`)
    }

    return resp
  }

  // ─── OpenAI 兼容模式对话（API / Direct 共用）────────────
  async function askOpenAI(query, settings, ragContext = '', timeoutMs = 60000) {
    const cfg = settings.mode === 'api' ? settings.api : settings.direct
    let endpoint = cfg.endpoint.replace(/\/$/, '')
    const model = cfg.model

    // 自动修复常见 endpoint 配置错误
    // 如果以模型名结尾（如 /glm-4.5-air），截掉模型名
    if (endpoint.split('/').pop() === model) {
      console.warn('[WikiChat] 检测到 endpoint 末尾包含模型名，自动修正:', endpoint)
      endpoint = endpoint.replace(new RegExp(`/${model}$`), '')
    }

    chatHistory.push({ role: 'user', content: query })

    if (chatHistory.length > MAX_TURNS * 2 + 1) {
      chatHistory = chatHistory.slice(-(MAX_TURNS * 2 + 1))
    }

    // 注入 system prompt（如果用户配置了自定义 prompt）
    let systemPrompt = settings.prompt || DEFAULT_PROMPT
    // 追加 RAG 上下文到 system prompt
    if (ragContext) {
      systemPrompt = systemPrompt + '\n\n' + ragContext
    }
    const messagesWithSystem = [{ role: 'system', content: systemPrompt }, ...chatHistory]

    const body = {
      model,
      messages: messagesWithSystem,
      stream: true
    }

    const headers = {
      'Content-Type': 'application/json'
    }
    if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const resp = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`API 错误 ${resp.status}: ${text}`)
    }

    return resp
  }

  // ─── 统一发送入口 ────────────────────────────────────────
  async function sendMessage(query) {
    const settings = getSettings()

    // 构建 RAG 上下文
    const pageContext = getCurrentPageContext()
    const searchContext = searchLocalBlog(query)
    let ragContext = ''
    const ct = RAG_CONFIG.contextTemplate
    if (pageContext) ragContext += `${ct.pageContextTitle}\n${pageContext}\n\n`
    if (searchContext) ragContext += `${ct.searchContextTitle}\n${searchContext}\n\n`
    if (ragContext) {
      ragContext = `${ct.instruction}\n${ragContext}${ct.userQuestion} ${query}`
    }

    let resp
    if (settings.mode === 'dify') {
      resp = await askDify(query, settings, ragContext)
    } else {
      resp = await askOpenAI(query, settings, ragContext)
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
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue

          if (settings.mode === 'dify') {
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
                turnCount++
                if (turnCount >= MAX_TURNS) {
                  conversationId = null
                  turnCount = 0
                  console.log('[WikiChat] 已达到最大轮数，自动重置对话')
                } else {
                  conversationId = json.conversation_id || conversationId
                }
              }
            } catch (_) {}
          } else {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content || ''
              if (delta) {
                fullText += delta
                bubble.innerHTML = renderMarkdown(fullText)
                bubble.closest('.wiki-chat-msg').scrollIntoView({ block: 'end', behavior: 'smooth' })
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.error('[WikiChat] 读取流错误:', e)
    }

    bubble.closest('.wiki-chat-msg').removeAttribute('data-streaming')

    // 自动 TTS 朗读 AI 回复
    const plainText = fullText
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/#{1,6}\s[^\n]*/g, '')
      .replace(/[*_~[\]()#>|]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    if (plainText) speakText(plainText)

    if (settings.mode !== 'dify' && fullText) {
      chatHistory.push({ role: 'assistant', content: fullText })
    }

    return fullText
  }

  // ─── 设置面板 ────────────────────────────────────────────
  function createSettingsPanel() {
    const settings = getSettings()
    const div = document.createElement('div')
    div.id = 'wiki-chat-settings'
    div.innerHTML = `
      <div class="wiki-settings-header">
        <span class="wiki-settings-title">⚙ 设置</span>
        <button id="wiki-settings-close" title="关闭">✕</button>
      </div>
      <div class="wiki-settings-body">
        <div class="wiki-login-field">
          <label>用户名</label>
          <input type="text" id="wiki-set-username" value="${settings.username}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>接入方式</label>
          <div class="wiki-login-mode-btns">
            <button class="wiki-mode-btn${settings.mode === 'dify' ? ' active' : ''}" data-mode="dify">Dify</button>
            <button class="wiki-mode-btn${settings.mode === 'api' ? ' active' : ''}" data-mode="api">在线 API</button>
            <button class="wiki-mode-btn${settings.mode === 'direct' ? ' active' : ''}" data-mode="direct">直连</button>
          </div>
        </div>
        <div id="wiki-settings-config-area"></div>
        <div class="wiki-login-field">
          <label>System Prompt</label>
          <textarea id="wiki-set-prompt" rows="4" placeholder="输入自定义 system prompt…">${settings.prompt || DEFAULT_PROMPT}</textarea>
        </div>
        <div class="wiki-settings-actions">
          <button id="wiki-settings-save" class="wiki-login-submit">保存</button>
          <button id="wiki-settings-logout" class="wiki-login-submit wiki-btn-danger">退出登录</button>
        </div>
      </div>
    `
    return div
  }

  function renderModeConfig(container, mode) {
    const settings = getSettings()
    if (mode === 'dify') {
      container.innerHTML = `
        <div class="wiki-login-field">
          <label>Dify API 地址</label>
          <input type="text" id="wiki-cfg-dify-url" placeholder="Cloudflare Worker 地址" value="${settings.dify.baseUrl}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>Dify API Key</label>
          <input type="password" id="wiki-cfg-dify-key" placeholder="app-xxx" value="${settings.dify.apiKey}" autocomplete="off">
        </div>
      `
    } else if (mode === 'api') {
      container.innerHTML = `
        <div class="wiki-login-field">
          <label>API 端点</label>
          <input type="text" id="wiki-cfg-api-endpoint" placeholder="https://api.openai.com/v1" value="${settings.api.endpoint}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>API Key</label>
          <input type="password" id="wiki-cfg-api-key" placeholder="sk-xxx" value="${settings.api.apiKey}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>模型名称</label>
          <input type="text" id="wiki-cfg-api-model" placeholder="gpt-3.5-turbo" value="${settings.api.model}" autocomplete="off">
        </div>
      `
    } else if (mode === 'direct') {
      container.innerHTML = `
        <div class="wiki-login-field">
          <label>模型端点</label>
          <input type="text" id="wiki-cfg-direct-endpoint" placeholder="http://localhost:1234/v1" value="${settings.direct.endpoint}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>API Key <span class="wiki-field-optional">（可选）</span></label>
          <input type="password" id="wiki-cfg-direct-key" placeholder="本地模型可留空" value="${settings.direct.apiKey}" autocomplete="off">
        </div>
        <div class="wiki-login-field">
          <label>模型名称</label>
          <input type="text" id="wiki-cfg-direct-model" placeholder="qwen/qwen3.5-9b" value="${settings.direct.model}" autocomplete="off">
        </div>
      `
    }
  }

  // ─── DOM 创建 ────────────────────────────────────────────
  function createWidget() {
    const fab = document.createElement('button')
    fab.id = 'wiki-chat-fab'
    fab.title = CHAT_TITLE
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`

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
          <button id="wiki-chat-login-btn" title="登录">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </button>
          <button id="wiki-chat-settings-btn" title="设置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button id="wiki-chat-clear" title="清空对话">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
          <button id="wiki-chat-close" title="关闭">✕</button>
        </div>
      </div>
      <div id="wiki-chat-content"></div>
      <div id="wiki-chat-input-area">
        <textarea id="wiki-chat-input" placeholder="${CHAT_PLACEHOLDER}" rows="1"></textarea>
        <button id="wiki-chat-send" title="发送">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(fab)
    document.body.appendChild(panel)
    return { fab, panel }
  }

  // ─── 切换到聊天视图 ──────────────────────────────────────
  function showChatView() {
    const content = document.getElementById('wiki-chat-content')
    const inputArea = document.getElementById('wiki-chat-input-area')
    const panel = document.getElementById('wiki-chat-panel')
    inputArea.style.display = 'flex'
    content.innerHTML = `
      <div id="wiki-chat-messages">
        <div class="wiki-chat-msg wiki-chat-msg--bot">
          <div class="wiki-chat-bubble">${WELCOME_MSG}</div>
        </div>
      </div>
      <div id="wiki-chat-search-results" style="display:none"></div>
    `
    resetConversation()
    showLive2DArea(panel, inputArea)
  }

  // ─── 显示/创建 Live2D 区域 ───────────────────────────────
  function showLive2DArea(panel, inputArea) {
    let area = document.getElementById('wiki-live2d-area')
    if (!area) {
      area = document.createElement('div')
      area.id = 'wiki-live2d-area'
      area.innerHTML = '<div class="wiki-live2d-loading">正在加载看板娘...</div>'
      panel.insertBefore(area, inputArea)
    }
    area.style.display = 'flex'
    waitAndMoveWaifu(area, 0)
  }

  // ─── 等待 waifu 初始化完成后移入对话窗口 ─────────────────
  function waitAndMoveWaifu(container, attempt) {
    const waifu = document.getElementById('waifu')
    if (waifu) {
      moveWaifuIntoChat(container)
      const hint = container.querySelector('.wiki-live2d-loading')
      if (hint) hint.remove()
      return
    }
    if (attempt < 50) {
      setTimeout(() => waitAndMoveWaifu(container, attempt + 1), 200)
    } else {
      const hint = container.querySelector('.wiki-live2d-loading')
      if (hint) hint.textContent = '看板娘加载超时，请刷新页面重试'
    }
  }

  // ─── 隐藏 Live2D 区域 ────────────────────────────────────
  function hideLive2DArea() {
    const area = document.getElementById('wiki-live2d-area')
    if (area) area.style.display = 'none'
    moveWaifuOutOfChat()
  }

  // ─── 把全局 waifu 移入对话窗口 ────────────────────────────
  function moveWaifuIntoChat(container) {
    const waifu = document.getElementById('waifu')
    if (!waifu) return
    if (waifu.parentElement !== container) {
      container.appendChild(waifu)
    }
    // 清除可能干扰的内联样式，让 CSS 控制显示
    waifu.style.display = ''
    waifu.style.opacity = ''
    waifu.style.pointerEvents = ''
    bindLive2DTools()
  }

  // ─── 绑定 Live2D 工具栏按钮到 Wiki Chat ──────────────────
  function bindLive2DTools() {
    // 聊天按钮 → 打开/聚焦 Wiki Chat
    const chatBtn = document.getElementById('waifu-tool-chat')
    if (chatBtn && !chatBtn.dataset.wikiBound) {
      chatBtn.dataset.wikiBound = 'true'
      chatBtn.addEventListener('click', () => {
        const panel = document.getElementById('wiki-chat-panel')
        if (!panel.classList.contains('wiki-chat-panel--open')) {
          document.getElementById('wiki-chat-fab').click()
        }
        setTimeout(() => {
          const input = document.getElementById('wiki-chat-input')
          if (input) input.focus()
        }, 100)
      })
    }

    // 一言按钮 → 从 Wiki Chat 说出来
    const hitokotoBtn = document.getElementById('waifu-tool-hitokoto')
    if (hitokotoBtn && !hitokotoBtn.dataset.wikiBound) {
      hitokotoBtn.dataset.wikiBound = 'true'
      hitokotoBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('https://v1.hitokoto.cn')
          const data = await res.json()
          const msg = `${data.hitokoto} —— 「${data.from}」`
          appendBotMessage(msg)
        } catch (e) {
          appendBotMessage('一言服务暂时不可用')
        }
      })
    }
  }

  // ─── 在 Wiki Chat 中追加一条 Bot 消息 ─────────────────────
  function appendBotMessage(text) {
    const panel = document.getElementById('wiki-chat-panel')
    const fab = document.getElementById('wiki-chat-fab')
    // 如果面板未打开，先打开
    if (!panel.classList.contains('wiki-chat-panel--open') && fab) {
      fab.click()
    }
    // 如果当前不在聊天视图（如在设置页），切回聊天视图
    const messages = document.getElementById('wiki-chat-messages')
    if (!messages) {
      showChatView()
    }
    const msgContainer = document.getElementById('wiki-chat-messages')
    if (!msgContainer) return
    const div = document.createElement('div')
    div.className = 'wiki-chat-msg wiki-chat-msg--bot'
    div.innerHTML = `<div class="wiki-chat-bubble">${escapeHtml(text)}</div>`
    msgContainer.appendChild(div)
    msgContainer.scrollTop = msgContainer.scrollHeight
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  // ─── 把 waifu 移回 body 隐藏 ─────────────────────────────
  function moveWaifuOutOfChat() {
    const waifu = document.getElementById('waifu')
    if (!waifu) return
    if (waifu.parentElement !== document.body) {
      document.body.appendChild(waifu)
    }
    // 清除内联样式，让 CSS #waifu { opacity: 0 } 接管隐藏
    waifu.style.display = ''
    waifu.style.opacity = ''
    waifu.style.pointerEvents = ''
  }

  // ─── 显示设置面板 ────────────────────────────────────────
  function showSettings() {
    hideLive2DArea()
    const panel = document.getElementById('wiki-chat-panel')
    const existing = document.getElementById('wiki-chat-settings')
    if (existing) existing.remove()

    const settingsPanel = createSettingsPanel()
    panel.appendChild(settingsPanel)

    const settings = getSettings()
    const configArea = document.getElementById('wiki-settings-config-area')
    renderModeConfig(configArea, settings.mode)

    let currentMode = settings.mode
    settingsPanel.querySelectorAll('.wiki-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode
        settingsPanel.querySelectorAll('.wiki-mode-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        renderModeConfig(configArea, currentMode)
      })
    })

    document.getElementById('wiki-settings-close').addEventListener('click', () => {
      settingsPanel.remove()
    })

    // ─── 自动保存配置 ────────────────────────────────────────
    const autoSaveConfig = () => {
      const s = getSettings()
      const prompt = document.getElementById('wiki-set-prompt')?.value.trim() || DEFAULT_PROMPT
      const partial = { mode: currentMode, prompt, username: s.username, dify: s.dify, api: s.api, direct: s.direct }

      if (currentMode === 'dify') {
        partial.dify = {
          baseUrl: document.getElementById('wiki-cfg-dify-url')?.value.trim() || s.dify.baseUrl,
          apiKey: document.getElementById('wiki-cfg-dify-key')?.value.trim() || s.dify.apiKey
        }
      } else if (currentMode === 'api') {
        partial.api = {
          endpoint: document.getElementById('wiki-cfg-api-endpoint')?.value.trim() || '',
          apiKey: document.getElementById('wiki-cfg-api-key')?.value.trim() || '',
          model: document.getElementById('wiki-cfg-api-model')?.value.trim() || ''
        }
      } else if (currentMode === 'direct') {
        partial.direct = {
          endpoint: document.getElementById('wiki-cfg-direct-endpoint')?.value.trim() || '',
          apiKey: document.getElementById('wiki-cfg-direct-key')?.value.trim() || '',
          model: document.getElementById('wiki-cfg-direct-model')?.value.trim() || ''
        }
      }

      const merged = { ...s, ...partial }
      saveSettings(merged)
    }

    // 监听配置区域输入变化
    let saveTimer = null
    settingsPanel.addEventListener('input', () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(autoSaveConfig, 500)
    })

    // 模式切换时保存
    settingsPanel.querySelectorAll('.wiki-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(autoSaveConfig, 50)
      })
    })

    // 保存按钮
    document.getElementById('wiki-settings-save').addEventListener('click', () => {
      const username = document.getElementById('wiki-set-username').value.trim()
      if (!username) { alert('用户名不能为空'); return }

      const prompt = document.getElementById('wiki-set-prompt').value.trim() || DEFAULT_PROMPT

      const newSettings = { ...getDefaultSettings(), username, mode: currentMode, prompt }

      if (currentMode === 'dify') {
        const url = document.getElementById('wiki-cfg-dify-url')?.value.trim()
        const key = document.getElementById('wiki-cfg-dify-key')?.value.trim()
        newSettings.dify = { baseUrl: url || DEFAULT_DIFY.baseUrl, apiKey: key || DEFAULT_DIFY.apiKey }
      } else if (currentMode === 'api') {
        const endpoint = document.getElementById('wiki-cfg-api-endpoint')?.value.trim()
        const key = document.getElementById('wiki-cfg-api-key')?.value.trim()
        const model = document.getElementById('wiki-cfg-api-model')?.value.trim()
        if (!endpoint || !key || !model) { alert('请填写完整的 API 配置'); return }
        newSettings.api = { endpoint, apiKey: key, model }
      } else if (currentMode === 'direct') {
        const endpoint = document.getElementById('wiki-cfg-direct-endpoint')?.value.trim()
        const key = document.getElementById('wiki-cfg-direct-key')?.value.trim()
        const model = document.getElementById('wiki-cfg-direct-model')?.value.trim()
        if (!endpoint || !model) { alert('请填写端点和模型名称'); return }
        newSettings.direct = { endpoint, apiKey: key, model }
      }

      saveSettings(newSettings)
      resetConversation()
      showChatView()
      settingsPanel.remove()
    })

    document.getElementById('wiki-settings-logout').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY)
      resetConversation()
      settingsPanel.remove()
      redirectToLogin()
    })
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

    appendMessage('user', query)

    searchPagefind(query).then(results => renderSearchResults(results, searchContainer))

    const typingDiv = document.createElement('div')
    typingDiv.className = 'wiki-chat-msg wiki-chat-msg--bot wiki-chat-typing'
    typingDiv.innerHTML = `<div class="wiki-chat-bubble">${LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)]}</div>`
    document.getElementById('wiki-chat-messages').appendChild(typingDiv)

    try {
      await sendMessage(query)
    } catch (e) {
      if (e.name === 'AbortError') {
        appendMessage('bot', '⏳ AI 响应超时，请稍后重试。')
      } else {
        appendMessage('bot', `⚠ AI 暂时无法回答（${e.message}）`)
      }
    } finally {
      typingDiv.remove()
    }

    sendBtn.disabled = false
    input.focus()
  }

  function autoResize(el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ─── footer-credit OpenClaw 链接居中处理 ──────────────────
  function fixFooterCreditLinks() {
    const footerLinks = document.querySelectorAll('.footer-credit a')
    footerLinks.forEach(link => {
      const br = link.querySelector('br')
      if (!br) return
      const parts = link.innerHTML.split(/<br\s*\/?>/i)
      if (parts.length >= 2) {
        link.innerHTML = `<span>${parts[0]}</span><span>${parts[1]}</span>`
      }
    })
  }

  // ─── 初始化 ──────────────────────────────────────────────
  function init() {
    // 异步初始化博客索引（RAG 全局检索）
    initBlogIndex()
    fixFooterCreditLinks()

    // ─── 未登录时：创建面板，点击登录按钮跳转 ───
    if (!isConfigured()) {
      const fab = document.createElement('button')
      fab.id = 'wiki-chat-fab'
      fab.title = CHAT_TITLE
      fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`

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
            <button id="wiki-chat-login-btn" title="登录">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </button>
            <button id="wiki-chat-close" title="关闭">✕</button>
          </div>
        </div>
        <div id="wiki-chat-content">
          <div id="wiki-chat-messages">
            <div class="wiki-chat-msg wiki-chat-msg--bot">
              <div class="wiki-chat-bubble">${WELCOME_MSG}</div>
            </div>
            <div class="wiki-chat-msg wiki-chat-msg--bot">
              <div class="wiki-chat-bubble">👉 点击右上角的 <strong>登录</strong> 按钮进入配置页面，连接你的 AI 模型。</div>
            </div>
          </div>
        </div>
        <div id="wiki-chat-input-area">
          <textarea id="wiki-chat-input" placeholder="请先登录后再提问…" rows="1" disabled></textarea>
          <button id="wiki-chat-send" title="发送" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      `

      document.body.appendChild(fab)
      document.body.appendChild(panel)

      function openPanel() {
        panel.classList.add('wiki-chat-panel--open')
        panel.setAttribute('aria-hidden', 'false')
        fab.classList.add('wiki-chat-fab--active')
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
      document.getElementById('wiki-chat-login-btn').addEventListener('click', redirectToLogin)

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePanel()
      })
      return
    }

    const { fab, panel } = createWidget()

    function openPanel() {
      panel.classList.add('wiki-chat-panel--open')
      panel.setAttribute('aria-hidden', 'false')
      fab.classList.add('wiki-chat-fab--active')
      showChatView()
      setTimeout(() => {
        const input = document.getElementById('wiki-chat-input')
        if (input) input.focus()
      }, 350)
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
    document.getElementById('wiki-chat-settings-btn').addEventListener('click', showSettings)
    document.getElementById('wiki-chat-login-btn').addEventListener('click', redirectToLogin)
    document.getElementById('wiki-chat-clear').addEventListener('click', () => {
      resetConversation()
      const messages = document.getElementById('wiki-chat-messages')
      if (messages) {
        messages.innerHTML = ''
        appendMessage('bot', WELCOME_MSG)
      }
      const searchContainer = document.getElementById('wiki-chat-search-results')
      if (searchContainer) searchContainer.style.display = 'none'
    })

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

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel()
    })

    // TTS 设置由 Live2D 工具栏统一控制，此处仅同步读取
    loadTtsSettings()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
