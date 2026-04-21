---
title: Wiki AI 助手
---
# 🤖 Wiki AI 助手

> 基于 Wiki 知识库的 AI 对话助手，支持多种接入方式

---

## 一、功能特性

| 特性 | 说明 |
|------|------|
| 📚 **知识库问答** | 基于 Wiki 内容进行 RAG 检索增强回答 |
| 🔗 **多接入方式** | 支持 Dify / 在线 API / 直连模型三种模式 |
| 🎨 **Arknights 风格** | 与网站主题一致的 UI 设计 |
| ⚙️ **灵活配置** | 支持自定义 System Prompt |
| 📱 **响应式布局** | 适配桌面端和移动端 |

---

## 二、接入方式

### 2.1 三种模式对比

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **Dify** | 连接本地 Dify RAG 应用 | 需要知识库检索增强 |
| **在线 API** | 通过 Cloudflare Worker 代理访问远程 API | 公网部署，访问内网模型 |
| **直连模型** | 直接连接本地 LM Studio | 本地开发测试 |

### 2.2 Dify 模式

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

### 2.3 在线 API 模式

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

### 2.4 直连模型模式

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

## 三、System Prompt 配置

### 3.1 默认 Prompt

```
你是一个基于 Wiki 知识库的 AI 助手，擅长回答关于编程、AI、LLM、RAG 等技术问题。请用中文回答，保持简洁准确。
```

### 3.2 自定义配置

在设置面板中修改 System Prompt，支持：

- 自定义角色设定
- 特定领域知识注入
- 回复风格约束

### 3.3 Prompt 生效条件

| 模式 | System Prompt |
|------|---------------|
| Dify | 由 Dify 应用端控制（前端保存备用） |
| 在线 API | ✅ 自动注入 |
| 直连模型 | ✅ 自动注入 |

---

## 四、访问方式

### 4.1 浮动按钮

- **位置**：页面右下角
- **图标**：🔵 蓝色按钮
- **点击**：展开 AI 对话界面

### 4.2 登录页面

- **地址**：`/login/`
- **功能**：配置接入方式和 System Prompt
- **访问**：点击浮动按钮或直接访问 URL

### 4.3 设置面板

- **入口**：登录页面
- **功能**：
  - 选择接入方式
  - 配置各模式参数
  - 自定义 System Prompt
  - 保存/重置配置

---

## 五、工作流程

```
用户点击按钮
     │
     ▼
展开对话界面 ←─── 读取配置（localStorage）
     │
     ▼
用户输入问题
     │
     ▼
根据配置选择接入方式
     │
     ├──→ Dify ─────→ 本地 Dify API
     │
     ├──→ 在线 API ─→ Cloudflare Worker 代理 → 远程 API
     │
     └──→ 直连 ─────→ 本地 LM Studio
     │
     ▼
返回 AI 回复
     │
     ▼
显示在对话界面
```

---

## 六、CORS 代理配置

### 6.1 Cloudflare Worker 代理

用于解决在线 API 模式的跨域问题：

```javascript
// dify-proxy-worker.js 核心功能
- OPTIONS 预检请求处理
- 智能路由（Dify / OpenAI 兼容）
- 请求头转发
- 错误处理
```

### 6.2 本地代理（开发模式）

开发环境下可直接连接本地服务，无需代理。

### 6.3 开机自启

Windows 开机自启脚本：
```powershell
# dify-proxy-start.vbs
wscript.CreateObject("WScript.Shell").Run "启动命令", 0
```

---

## 七、文件结构

```
themes/arknights/
├── layout/
│   └── login.pug           # 登录页面模板
├── source/
│   ├── css/
│   │   ├── wiki-chat.styl  # AI 对话样式
│   │   └── wiki-login.styl # 登录页样式
│   └── js/
│       └── wiki-chat.js    # AI 对话逻辑
└── _config.yml             # 主题配置
```

---

## 八、常见问题

### Q1: AI 助手没有出现？

1. 检查浏览器 Console 是否有报错
2. 确认 `footer.pug` 中的触发标记是否正确
3. 检查 JS 文件是否加载成功

### Q2: API 请求失败？

1. 确认对应服务是否运行（Dify / LM Studio）
2. 检查 API 地址和密钥配置
3. 查看浏览器 Network 面板的具体错误

### Q3: CORS 错误？

1. 在线 API 模式：确认 Cloudflare Worker 代理地址正确
2. 直连模式：确保 LM Studio 启用了 CORS

### Q4: 如何关闭 AI 助手？

在 `_config.yml` 中设置：
```yaml
wiki_chat:
  enable: false
```

---

## 九、相关链接

| 资源 | 链接 |
|------|------|
| Dify 官网 | https://dify.ai/ |
| LM Studio | https://lmstudio.ai/ |
| Cloudflare Workers | https://workers.cloudflare.com/ |
