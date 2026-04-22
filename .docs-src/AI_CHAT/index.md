---
title: Wiki AI 助手
---
# 🤖 Wiki AI 助手

> 基于 Wiki 知识库的 AI 对话助手，由 Wiki 聊天面板 + Live2D 看板娘 + 登录页三模块组成

---

## 一、功能特性

| 特性 | 说明 |
|------|------|
| 📚 **知识库问答** | 基于 Wiki 内容进行 RAG 检索增强回答 |
| 🔗 **多接入方式** | 支持 Dify / 在线 API / 直连模型三种模式 |
| 🐱 **Live2D 看板娘** | 页面左侧阿丽露模型，可对话、换装、换音色 |
| 🎙️ **TTS 朗读** | AI 回复自动朗读，支持多种音色切换 |
| 🎨 **Arknights 风格** | 与网站主题一致的 UI 设计 |
| ⚙️ **灵活配置** | 支持自定义 System Prompt（猫女仆人设） |
| 📱 **响应式布局** | 适配桌面端和移动端 |

---

## 二、系统架构

### 2.1 模块关系

```
┌──────────────────────────────────────────────────────────────┐
│                       AI 助手系统                              │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────┐                │
│  │  Wiki 聊天面板    │    │  Live2D 看板娘     │                │
│  │  (wiki-chat.js) │    │  (waifu-chat.js)  │                │
│  │                 │    │                    │                │
│  │  · 右下角悬浮按钮 │    │  · 左侧看板娘       │                │
│  │  · 设置面板      │    │  · 对话气泡         │                │
│  │  · Markdown 渲染 │    │  · 工具栏操作       │                │
│  │  · TTS 朗读     │    │  · TTS 朗读        │                │
│  └───────┬─────────┘    └────────┬──────────┘                │
│          │                       │                           │
│          │  共享 localStorage     │                           │
│          │  waifu_tts_settings   │                           │
│          └───────────┬───────────┘                           │
│                      │                                       │
│  ┌───────────────────▼──────────────────┐                   │
│  │           三模式 API 接入               │                   │
│  │  · Dify → 本地 Dify RAG              │                   │
│  │  · 在线 API → CF Worker → 远程模型    │                   │
│  │  · 直连 → 本地 LM Studio             │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │         登录页 (/login/)              │                   │
│  │  · 赛博雨幕 + 粒子星云 + 扫描线特效    │                   │
│  │  · 接入方式配置                       │                   │
│  │  · System Prompt 配置                 │                   │
│  └──────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 两套 TTS 系统

Wiki 面板和 Live2D 看板娘各自有独立的 `speakText()` 实现，但共享 localStorage 中的 TTS 设置：

| 存储键 | 内容 | 读写方 |
|--------|------|--------|
| `waifu_tts_settings` | `{ enabled, voice }` | 两套 TTS 均读写 |
| `wiki-chat-settings` | 完整配置（含 TTS） | Wiki 面板读写 |

**同步策略**：每次 `speakText()` 调用前，从 localStorage 重新读取最新设置，确保两端切换音色后立即生效。

**音色匹配规则**：
- 存储简短关键字（如 `Yunxi`、`Xiaoxiao`）
- 匹配时用 `includes()` 包含匹配，而非精确匹配
- 优先选择 Online Natural 版本的音色
- Chrome `speechSynthesis.cancel()` 后需 ≥100ms 延迟再 `speak()`

---

## 三、接入方式

### 3.1 三种模式对比

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **Dify** | 连接本地 Dify RAG 应用 | 需要知识库检索增强 |
| **在线 API** | 通过 Cloudflare Worker 代理访问远程 API | 公网部署，访问内网模型 |
| **直连模型** | 直接连接本地 LM Studio | 本地开发测试 |

### 3.2 Dify 模式

**配置要求**：
- Dify 本地部署（Docker Desktop）
- 配置好的 RAG 知识库应用
- Dify API 地址和应用密钥

**配置项**：
```yaml
wiki_chat:
  mode: dify
  dify:
    api_url: http://localhost/v1
    app_key: app-xxxxxxxxxxxxx
```

### 3.3 在线 API 模式

**配置要求**：
- 可访问的远程 API 地址
- API 密钥（可选）

**配置项**：
```yaml
wiki_chat:
  mode: online_api
  online_api:
    api_url: https://your-api.com/v1/chat/completions
    api_key: sk-xxxxxxxxxxxxx
    model: qwen3.5-9b
```

**代理服务**：
使用 Cloudflare Worker 作为代理，解决跨域问题：
- 代理地址：`dify-proxy.1548324254.workers.dev`
- 支持 Dify 和 OpenAI 兼容 API

### 3.4 直连模型模式

**配置要求**：
- 本地运行 LM Studio
- 启用 "Enable API" 选项

**配置项**：
```yaml
wiki_chat:
  mode: direct
  direct:
    api_url: http://localhost:1234/v1/chat/completions
    model: qwen3.5-9b
```

---

## 四、System Prompt 配置

### 4.1 默认 Prompt（猫女仆人设）

```
你是一个基于 Wiki 知识库的猫女仆助手，性格傲娇。回答会以"喵"结尾。
非工作状态要称呼我为主人。擅长回答关于编程、AI、LLM、RAG 等技术问题。
请用中文回答，保持简洁准确。
```

### 4.2 自定义配置

在设置面板或登录页中修改 System Prompt，支持：

- 自定义角色设定
- 特定领域知识注入
- 回复风格约束

### 4.3 Prompt 生效条件

| 模式 | System Prompt |
|------|---------------|
| Dify | 由 Dify 应用端控制（前端保存备用） |
| 在线 API | ✅ 自动注入 |
| 直连模型 | ✅ 自动注入 |

---

## 五、访问方式

### 5.1 浮动按钮

- **位置**：页面右下角
- **图标**：🔵 蓝色按钮
- **点击**：展开 AI 对话界面

### 5.2 Live2D 看板娘

- **位置**：页面左侧
- **模型**：阿丽露（Ariu）
- **功能**：
  - 点击对话气泡进行 AI 聊天
  - 工具栏操作：隐藏/显示、换模型、换装、音色切换
  - AI 回复自动 TTS 朗读
  - 支持拖拽移动位置

### 5.3 登录页面

- **地址**：`/login/`
- **视觉特效**：
  - 🌧️ 赛博雨幕 — 垂直下落的字符流，带尾迹拖影
  - ✨ 粒子星云 — 青/品红粒子，鼠标引力交互
  - 📺 扫描线 — CRT 显示器横线扫描
  - 🔲 网格线 — 赛博朋克风格网格
  - 🏷️ 战术卡片 — 四角装饰 + 赛博风 UI
- **功能**：配置接入方式、System Prompt、用户名
- **登录动画**：白色闪光 → 扫描线收缩 → 页面跳转

### 5.4 设置面板

- **入口**：登录页面 / Wiki 聊天面板右上角设置按钮
- **功能**：
  - 选择接入方式
  - 配置各模式参数
  - 自定义 System Prompt
  - 切换 TTS 音色
  - 保存/重置配置

---

## 六、TTS 朗读

### 6.1 支持的音色

基于浏览器 `speechSynthesis.getVoices()` 返回的音色列表，预设以下中文音色：

| 预设 | 关键字 | 说明 |
|------|--------|------|
| 云希 | Yunxi | 微软在线自然语音，推荐 |
| 晓晓 | Xiaoxiao | 微软在线自然语音 |
| 晓辰 | Xiaochen | 微软在线自然语音 |
| 云扬 | Yunyang | 微软在线自然语音 |

> 音色列表取决于操作系统和浏览器。Windows 11 + Chrome 可获得最丰富的中文自然语音。

### 6.2 切换音色

两种方式切换 TTS 音色，效果实时同步：

1. **Live2D 工具栏**：点击音色按钮，选择音色后立即试听
2. **Wiki 聊天设置面板**：点击音色按钮，选择音色

### 6.3 注意事项

- Chrome 中 `speechSynthesis.cancel()` 后需等待 ≥100ms 才能再次 `speak()`，否则后续朗读会被吞
- TTS 音色列表在 Chrome 中异步加载，首次使用时可能有短暂延迟
- 两套 TTS 系统（Wiki 面板 + Live2D）共享 localStorage 设置，切换即时生效

---

## 七、CORS 代理配置

### 7.1 Cloudflare Worker 代理

用于解决在线 API 模式的跨域问题：

```javascript
// dify-proxy-worker.js 核心功能
- OPTIONS 预检请求处理
- 智能路由（Dify / OpenAI 兼容）
- 请求头转发
- 错误处理
```

### 7.2 本地代理（开发模式）

开发环境下可直接连接本地服务，无需代理。

### 7.3 开机自启

Windows 开机自启脚本：
```powershell
# dify-proxy-start.vbs
wscript.CreateObject("WScript.Shell").Run "启动命令", 0
```

---

## 八、文件结构

```
themes/arknights/
├── layout/
│   ├── includes/layout.pug       # 主布局（所有 script 集中在 body 尾部加载）
│   ├── login.pug                 # 登录页路由
│   └── custom/
│       ├── wiki-login.ejs        # 登录页内容模板（纯 HTML + CSS，不含 script）
│       └── wiki-chat-btn.ejs     # AI 对话按钮模板
├── source/
│   ├── css/_custom/
│   │   ├── wiki-chat.styl        # AI 对话面板样式
│   │   └── wiki-login.styl       # 登录页样式（赛博雨幕 + 战术面板）
│   ├── js/
│   │   ├── wiki-chat.js          # AI 对话面板逻辑 + TTS 朗读
│   │   └── wiki-login.js         # 登录页逻辑（特效 + 配置，IIFE 封装）
│   └── live2d/
│       ├── live2d.js             # Live2D 主入口
│       ├── Core/
│       │   ├── live2d-sdk.js     # Live2D SDK
│       │   ├── live2dcubismcore.js # Cubism Core
│       │   └── waifu-tips.js     # 工具栏逻辑（换模型、换音色、换装）
│       ├── chatCore/
│       │   ├── waifu-chat.js     # AI 对话核心 + TTS 朗读
│       │   └── waifu-chat.css    # 对话 UI 样式
│       ├── config/
│       │   ├── model_list.json   # 模型列表
│       │   ├── waifu-chat.json   # 对话配置
│       │   └── waifu-tips.json   # 工具栏配置
│       └── model/
│           └── ariu/             # 阿丽露模型资源
└── _config.yml                   # 主题配置
```

> ⚠️ **Script 加载注意事项**：
> - 所有 JS 在 `layout.pug` 的 body 尾部加载，**不要**在 EJS 模板（`<article>` 内）中放置 `<script>` 标签
> - Pjax 切换页面时不执行 `<article>` 内的 script
> - `wiki-login.js` 通过条件加载（`if page.path.indexOf('login') === 0`），避免其他页面加载

---

## 九、常见问题

### Q1: AI 助手没有出现？

1. 检查浏览器 Console 是否有报错（特别是 SyntaxError）
2. 确认 JS 文件是否加载成功（Network 面板查看）
3. 检查 `layout.pug` 中的 script 加载配置
4. 清除浏览器缓存后重试

### Q2: API 请求失败？

1. 确认对应服务是否运行（Dify / LM Studio）
2. 检查 API 地址和密钥配置
3. 查看浏览器 Network 面板的具体错误

### Q3: CORS 错误？

1. 在线 API 模式：确认 Cloudflare Worker 代理地址正确
2. 直连模式：确保 LM Studio 启用了 CORS

### Q4: TTS 朗读没有声音？

1. 确认 TTS 开关已开启
2. 检查浏览器是否允许自动播放音频
3. Chrome 中首次使用 TTS 可能需要用户交互触发
4. 尝试切换音色后再试

### Q5: 切换 TTS 音色后仍然用旧音色？

1. 两套 TTS 系统共享设置，但需刷新页面才能完全同步
2. Chrome 的 `speechSynthesis.cancel()` 后需要 ≥100ms 延迟
3. 清除 localStorage 后重新配置

### Q6: 登录页特效不显示？

1. 检查浏览器 Console 是否有 JS 语法错误
2. 确认 `wiki-login.js` 在 body 尾部加载（不在 `<article>` 内）
3. 清除浏览器缓存后重试

### Q7: 如何关闭 AI 助手？

在 `_config.yml` 中设置：
```yaml
wiki_chat:
  enable: false
```

---

## 十、相关链接

| 资源 | 链接 |
|------|------|
| Dify 官网 | https://dify.ai/ |
| LM Studio | https://lmstudio.ai/ |
| Cloudflare Workers | https://workers.cloudflare.com/ |
| Live2D Cubism | https://www.live2d.com/ |
| Web Speech API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
