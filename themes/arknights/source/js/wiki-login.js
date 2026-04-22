/**
 * Wiki AI 登录页 — 赛博雨幕 + Arknights 战术面板
 * 
 * 背景效果：
 *   1. 赛博雨幕（Cyber Rain）— 垂直下落的字符流，带尾迹拖影
 *   2. 粒子星云 — 青/品红粒子，鼠标引力交互
 *   3. 扫描线 — CRT 显示器横线扫描
 * 
 * 切换动画：
 *   登录成功 → 白色闪光 → 扫描线收缩 → 页面跳转
 */

;(function () {
  'use strict'

  const STORAGE_KEY = 'wiki-chat-settings'

  const DEFAULT_DIFY = {
    baseUrl: 'https://dify-proxy.1548324254.workers.dev',
    apiKey: 'app-JznEvGv3JlWWISRmNdjRO7yE'
  }

  const DEFAULT_PROMPT = '你是一个基于 Wiki 知识库的猫女仆助手，性格傲娇。回答会以"喵"结尾。非工作状态要称呼我为主人。擅长回答关于编程、AI、LLM、RAG 等技术问题。请用中文回答，保持简洁准确。'

  // ═══════════════════════════════════════════════════════════
  //  多层 Canvas 背景系统
  // ═══════════════════════════════════════════════════════════

  function initBackground() {
    const container = document.getElementById('wiki-login-bg')
    if (!container) return

    const layers = [
      { id: 'wiki-bg-rain',    z: 0, init: initCyberRain },
      { id: 'wiki-bg-particles', z: 1, init: initParticleField },
      { id: 'wiki-bg-scanlines', z: 2, init: initScanlines }
    ]

    layers.forEach(layer => {
      const canvas = document.createElement('canvas')
      canvas.id = layer.id
      canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;z-index:${layer.z};pointer-events:none;`
      container.appendChild(canvas)
      layer.init(canvas)
    })
  }

  // ─── 赛博雨幕（Cyber Rain）───────────────────────────────
  function initCyberRain(canvas) {
    const ctx = canvas.getContext('2d')
    let W, H, columns, drops
    const fontSize = 16
    const chars = '0123456789ABCDEF<>{}[]|/\\=+-_*&^%$#@!~`;:,.?'.split('')
    const colors = ['#00ff88', '#00ccaa', '#0099cc', '#00ffcc', '#55ffaa']

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      columns = Math.floor(W / fontSize)
      drops = new Array(columns).fill(0).map(() => Math.random() * -H / fontSize)
    }

    function draw() {
      // 半透明覆盖实现尾迹拖影
      ctx.fillStyle = 'rgba(8, 8, 15, 0.08)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = 'bold ' + fontSize + 'px monospace'
      ctx.textAlign = 'center'

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize + fontSize / 2
        const y = drops[i] * fontSize

        // 头部高亮字符
        const headColor = colors[Math.floor(Math.random() * colors.length)]
        ctx.fillStyle = headColor
        ctx.shadowColor = headColor
        ctx.shadowBlur = 8
        ctx.fillText(char, x, y)
        ctx.shadowBlur = 0

        // 尾部暗色拖影
        if (drops[i] > 2) {
          for (let t = 1; t <= 3; t++) {
            const tailY = y - t * fontSize
            if (tailY < 0) break
            const tailChar = chars[Math.floor(Math.random() * chars.length)]
            const alpha = 0.3 / t
            ctx.fillStyle = `rgba(0, 200, 150, ${alpha})`
            ctx.fillText(tailChar, x, tailY)
          }
        }

        drops[i]++
        // 随机重置，形成断断续续的雨幕效果
        if (y > H && Math.random() > 0.985) {
          drops[i] = Math.random() * -10
        }
      }
      requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
  }

  // ─── 粒子星云 ────────────────────────────────────────────
  function initParticleField(canvas) {
    const ctx = canvas.getContext('2d')
    let W, H, particles = [], mouse = { x: -999, y: -999 }

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      initParticles()
    }

    class Particle {
      constructor() {
        this.x = Math.random() * W
        this.y = Math.random() * H
        this.vx = (Math.random() - 0.5) * 0.6
        this.vy = (Math.random() - 0.5) * 0.6
        this.size = Math.random() * 2 + 0.5
        this.hue = Math.random() > 0.5 ? 170 : 320
        this.alpha = Math.random() * 0.5 + 0.15
        this.pulse = Math.random() * Math.PI * 2
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulse += 0.025
        if (this.x < 0 || this.x > W) this.vx *= -1
        if (this.y < 0 || this.y > H) this.vy *= -1

        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.02
          this.vx += dx * force
          this.vy += dy * force
        }
      }
      draw() {
        const a = this.alpha + Math.sin(this.pulse) * 0.12
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2)
        ctx.fillStyle = `hsla(${this.hue}, 85%, 55%, ${Math.max(0, a)})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI*2)
        ctx.fillStyle = `hsla(${this.hue}, 85%, 55%, ${Math.max(0, a * 0.06)})`
        ctx.fill()
      }
    }

    function initParticles() {
      const count = Math.min(60, Math.floor((W * H) / 20000))
      particles = []
      for (let i = 0; i < count; i++) particles.push(new Particle())
    }

    function drawConnections() {
      const maxDist = 140
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < maxDist) {
            const alpha = (1 - dist/maxDist) * 0.1
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => { p.update(); p.draw() })
      drawConnections()
      requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    canvas.parentElement.addEventListener('mousemove', e => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    })
  }

  // ─── 扫描线效果 ──────────────────────────────────────────
  function initScanlines(canvas) {
    const ctx = canvas.getContext('2d')
    let W, H

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      // 水平扫描线
      const time = Date.now() * 0.001
      const scanY = (time * 80) % (H + 100) - 50
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.5, 'rgba(0, 255, 200, 0.03)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 20, W, 40)

      // 随机闪烁线
      if (Math.random() > 0.97) {
        const fy = Math.random() * H
        ctx.fillStyle = `rgba(0, 255, 200, ${Math.random() * 0.05})`
        ctx.fillRect(0, fy, W, 1)
      }

      requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
  }

  // ═══════════════════════════════════════════════════════════
  //  设置管理
  // ═══════════════════════════════════════════════════════════

  function loadSettings() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) } catch (_) {}
    return null
  }
  function saveSettings(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

  function getDefaultSettings() {
    return { mode: 'dify', username: '', prompt: DEFAULT_PROMPT, dify: { ...DEFAULT_DIFY }, api: { endpoint: '', apiKey: '', model: '' }, direct: { endpoint: '', apiKey: '', model: '' } }
  }
  function getSettings() { return loadSettings() || getDefaultSettings() }

  // ─── 监听输入变化，自动保存配置 ──────────────────────────
  function setupAutoSave() {
    const autoSave = () => {
      const s = getSettings()
      const mode = s.mode
      const prompt = document.getElementById('wiki-cfg-prompt')?.value.trim() || DEFAULT_PROMPT
      const partial = { mode, prompt, dify: s.dify, api: s.api, direct: s.direct }

      if (mode === 'dify') {
        partial.dify = {
          baseUrl: document.getElementById('wiki-cfg-dify-url')?.value.trim() || s.dify.baseUrl,
          apiKey: document.getElementById('wiki-cfg-dify-key')?.value.trim() || s.dify.apiKey
        }
      } else if (mode === 'api') {
        partial.api = {
          endpoint: document.getElementById('wiki-cfg-api-endpoint')?.value.trim() || '',
          apiKey: document.getElementById('wiki-cfg-api-key')?.value.trim() || '',
          model: document.getElementById('wiki-cfg-api-model')?.value.trim() || ''
        }
      } else if (mode === 'direct') {
        partial.direct = {
          endpoint: document.getElementById('wiki-cfg-direct-endpoint')?.value.trim() || '',
          apiKey: document.getElementById('wiki-cfg-direct-key')?.value.trim() || '',
          model: document.getElementById('wiki-cfg-direct-model')?.value.trim() || ''
        }
      }

      // 合并并保存（不覆盖 username）
      const merged = { ...s, ...partial }
      saveSettings(merged)
    }

    // 使用事件委托，监听配置区域内所有输入
    const container = document.getElementById('wiki-login-config-area')
    if (!container) return

    // 输入时延迟保存（避免频繁写入）
    let saveTimer = null
    container.addEventListener('input', () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(autoSave, 500)
    })

    // 模式切换时立即保存
    document.querySelectorAll('.wiki-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setTimeout(autoSave, 50)
      })
    })

    // 用户名输入时也自动保存
    const usernameInput = document.getElementById('wiki-login-username')
    if (usernameInput) {
      usernameInput.addEventListener('input', () => {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          const s = getSettings()
          saveSettings({ ...s, username: usernameInput.value.trim() })
        }, 500)
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  模式配置渲染
  // ═══════════════════════════════════════════════════════════

  function renderModeConfig(mode) {
    const settings = getSettings()
    const container = document.getElementById('wiki-login-config-area')
    if (!container) return

    const fieldCls = 'wiki-login-field'
    const labelCls = 'wiki-login-label'

    if (mode === 'dify') {
      container.innerHTML = `
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Dify API 地址
          </label>
          <input type="text" id="wiki-cfg-dify-url" placeholder="Cloudflare Worker 地址" value="${settings.dify.baseUrl}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Dify API Key
          </label>
          <input type="password" id="wiki-cfg-dify-key" placeholder="app-xxx" value="${settings.dify.apiKey}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            System Prompt
          </label>
          <textarea id="wiki-cfg-prompt" rows="3" placeholder="输入自定义 system prompt…">${settings.prompt || DEFAULT_PROMPT}</textarea>
          <div class="wiki-login-field-line"></div>
        </div>`
    } else if (mode === 'api') {
      container.innerHTML = `
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            API 端点
          </label>
          <input type="text" id="wiki-cfg-api-endpoint" placeholder="https://api.openai.com/v1" value="${settings.api.endpoint}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            API Key
          </label>
          <input type="password" id="wiki-cfg-api-key" placeholder="sk-xxx" value="${settings.api.apiKey}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            模型名称
          </label>
          <input type="text" id="wiki-cfg-api-model" placeholder="gpt-3.5-turbo" value="${settings.api.model}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            System Prompt
          </label>
          <textarea id="wiki-cfg-prompt" rows="3" placeholder="输入自定义 system prompt…">${settings.prompt || DEFAULT_PROMPT}</textarea>
          <div class="wiki-login-field-line"></div>
        </div>`
    } else if (mode === 'direct') {
      container.innerHTML = `
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            模型端点
          </label>
          <input type="text" id="wiki-cfg-direct-endpoint" placeholder="http://localhost:1234/v1" value="${settings.direct.endpoint}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            API Key <span style="opacity:0.5">（可选）</span>
          </label>
          <input type="password" id="wiki-cfg-direct-key" placeholder="本地模型可留空" value="${settings.direct.apiKey}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            模型名称
          </label>
          <input type="text" id="wiki-cfg-direct-model" placeholder="qwen/qwen3.5-9b" value="${settings.direct.model}" autocomplete="off">
          <div class="wiki-login-field-line"></div>
        </div>
        <div class="${fieldCls}">
          <label class="${labelCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            System Prompt
          </label>
          <textarea id="wiki-cfg-prompt" rows="3" placeholder="输入自定义 system prompt…">${settings.prompt || DEFAULT_PROMPT}</textarea>
          <div class="wiki-login-field-line"></div>
        </div>`
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  登录成功 — 炫酷切换动画
  // ═══════════════════════════════════════════════════════════

  function playLoginTransition(callback) {
    const page = document.getElementById('wiki-login-page')
    if (!page) { callback(); return }

    const scanW = 90
    const travel = window.innerWidth + scanW * 2

    // ─── 1. 扫描线容器 ───
    const container = document.createElement('div')
    container.id = 'wiki-scan-transition'
    document.body.appendChild(container)

    // ─── 2. 扫描线条带（内含目标页面预览） ───
    const scanline = document.createElement('div')
    scanline.className = 'wiki-scan-line'
    container.appendChild(scanline)

    // ─── 3. 目标页面预览（微型聊天界面） ───
    const preview = document.createElement('div')
    preview.className = 'wiki-scan-preview'

    // 模拟消息气泡
    for (let i = 0; i < 7; i++) {
      const msg = document.createElement('div')
      msg.className = 'wiki-scan-msg'
      msg.style.cssText = `--d:${(i * 0.25).toFixed(2)}s;--w:${(25 + Math.random() * 55).toFixed(0)}%;--a:${i % 2 === 0 ? 'flex-end' : 'flex-start'}`
      preview.appendChild(msg)
    }

    // 输入框 + 闪烁光标
    const inputArea = document.createElement('div')
    inputArea.className = 'wiki-scan-input'
    const cursor = document.createElement('div')
    cursor.className = 'wiki-scan-cursor'
    inputArea.appendChild(cursor)
    preview.appendChild(inputArea)

    // 数据流装饰线
    for (let i = 0; i < 3; i++) {
      const stream = document.createElement('div')
      stream.className = 'wiki-scan-datastream'
      stream.style.cssText = `--top:${(15 + i * 28).toFixed(0)}%;--delay:${(i * 0.4).toFixed(1)}s`
      preview.appendChild(stream)
    }

    scanline.appendChild(preview)

    // ─── 4. 启动扫描线动画（从右到左） ───
    requestAnimationFrame(() => {
      container.classList.add('active')
    })

    // ─── 5. 扫描过程中：登录页逐渐变暗+模糊 ───
    setTimeout(() => {
      page.style.transition = 'filter 2.5s ease, opacity 2.5s ease'
      page.style.filter = 'brightness(0.2) blur(3px) saturate(0.3)'
      page.style.opacity = '0.5'
    }, 400)

    // ─── 6. 扫描完成后：白色闪光切换 ───
    setTimeout(() => {
      // 闪光层
      const flash = document.createElement('div')
      flash.style.cssText = `
        position:fixed;inset:0;z-index:9999;background:#e0fffa;
        opacity:0;pointer-events:none;transition:opacity 0.15s ease;
      `
      document.body.appendChild(flash)

      requestAnimationFrame(() => {
        flash.style.opacity = '0.85'
      })

      setTimeout(() => {
        flash.style.opacity = '0'
        container.remove()
        page.style.display = 'none'

        setTimeout(() => {
          flash.remove()
          callback()
        }, 350)
      }, 200)
    }, 3600)
  }

  // ═══════════════════════════════════════════════════════════
  //  初始化
  // ═══════════════════════════════════════════════════════════

  function init() {
    initBackground()

    const settings = getSettings()
    let currentMode = settings.mode

    // 用户名回填
    const usernameInput = document.getElementById('wiki-login-username')
    if (usernameInput && settings.username) usernameInput.value = settings.username

    // 模式标签
    const modeTabs = document.querySelectorAll('.wiki-mode-tab')
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === currentMode)
      tab.addEventListener('click', () => {
        currentMode = tab.dataset.mode
        modeTabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        renderModeConfig(currentMode)
      })
    })

    renderModeConfig(currentMode)

    // 启用自动保存
    setupAutoSave()

    // 提交登录
    const submitBtn = document.getElementById('wiki-login-submit')
    submitBtn.addEventListener('click', () => {
      const username = document.getElementById('wiki-login-username').value.trim()
      const errorDiv = document.getElementById('wiki-login-error')
      errorDiv.textContent = ''

      if (!username) { errorDiv.textContent = '请输入用户名'; return }

      const prompt = document.getElementById('wiki-cfg-prompt')?.value.trim() || DEFAULT_PROMPT
      const newSettings = { ...getDefaultSettings(), username, mode: currentMode, prompt }

      if (currentMode === 'dify') {
        const url = document.getElementById('wiki-cfg-dify-url')?.value.trim()
        const key = document.getElementById('wiki-cfg-dify-key')?.value.trim()
        if (!key) { errorDiv.textContent = '请输入 Dify API Key'; return }
        newSettings.dify = { baseUrl: url || DEFAULT_DIFY.baseUrl, apiKey: key }
      } else if (currentMode === 'api') {
        const endpoint = document.getElementById('wiki-cfg-api-endpoint')?.value.trim()
        const key = document.getElementById('wiki-cfg-api-key')?.value.trim()
        const model = document.getElementById('wiki-cfg-api-model')?.value.trim()
        if (!endpoint || !key || !model) { errorDiv.textContent = '请填写完整的 API 配置'; return }
        newSettings.api = { endpoint, apiKey: key, model }
      } else if (currentMode === 'direct') {
        const endpoint = document.getElementById('wiki-cfg-direct-endpoint')?.value.trim()
        const key = document.getElementById('wiki-cfg-direct-key')?.value.trim()
        const model = document.getElementById('wiki-cfg-direct-model')?.value.trim()
        if (!endpoint || !model) { errorDiv.textContent = '请填写端点和模型名称'; return }
        newSettings.direct = { endpoint, apiKey: key, model }
      }

      saveSettings(newSettings)

      const rootPath = document.querySelector('meta[name="wiki-root"]')?.content || '/'
      playLoginTransition(() => {
        window.location.href = rootPath
      })
    })

    // Enter 提交
    document.getElementById('wiki-login-username').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitBtn.click()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
