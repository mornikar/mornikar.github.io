/**
 * Wiki Live2D - 简化的 Live2D 嵌入组件
 * 用于在 Wiki AI 对话窗口底部显示 Live2D 模型
 * Phase 8: 集成到 Wiki Chat
 */

;(function () {
  'use strict'

  const LIVE2D_CONFIG = {
    modelPath: '/live2d/',
    cdnPath: 'https://cdn.jsdelivr.net/gh/LuoTian001/live2d-widget-AIChat@main/',
    modelFile: 'model/ariu/ariu.model3.json'
  }

  // Live2D 全局实例
  let live2dInstance = null
  let isInitialized = false

  // 初始化 Live2D
  async function initLive2D(containerId) {
    if (isInitialized) return
    isInitialized = true

    const container = document.getElementById(containerId)
    if (!container) {
      console.error('[WikiLive2D] 容器不存在:', containerId)
      return
    }

    // 创建画布
    const canvas = document.createElement('canvas')
    canvas.id = 'wiki-live2d-canvas'
    canvas.width = 280
    canvas.height = 280
    container.appendChild(canvas)

    try {
      // 加载 Live2D SDK
      await loadScript(LIVE2D_CONFIG.cdnPath + 'Core/live2dcubismcore.js')
      await loadScript(LIVE2D_CONFIG.cdnPath + 'Core/live2d-sdk.js')

      // 初始化 Live2D
      const app = new PIXI.Application({
        view: canvas,
        width: 280,
        height: 280,
        transparent: true,
        autoDensity: true,
        antialias: true
      })

      live2dInstance = app

      // 加载模型
      const modelUrl = LIVE2D_CONFIG.modelPath + LIVE2D_CONFIG.modelFile
      const model = await Live2DHub.loadModel(modelUrl)
      app.stage.addChild(model)

      // 添加鼠标交互 - 模型跟随鼠标
      enableMouseInteraction(app, model, canvas)

      console.log('[WikiLive2D] 初始化完成')
    } catch (e) {
      console.error('[WikiLive2D] 初始化失败:', e)
    }
  }

  // 加载脚本
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // 鼠标交互
  function enableMouseInteraction(app, model, canvas) {
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      targetX = (e.clientX - centerX) / rect.width * 0.3
      targetY = (e.clientY - centerY) / rect.height * 0.3
    })

    canvas.addEventListener('mouseleave', () => {
      targetX = 0
      targetY = 0
    })

    // 平滑跟随动画
    function animate() {
      currentX += (targetX - currentX) * 0.1
      currentY += (targetY - currentY) * 0.1
      model.rotation.y = currentX
      model.rotation.x = -currentY
      requestAnimationFrame(animate)
    }
    animate()
  }

  // 公开 API
  window.WikiLive2D = {
    init: initLive2D,
    getInstance: () => live2dInstance
  }
})()
