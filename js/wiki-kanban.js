/**
 * Wiki AI 看板娘 - Arknights 主题集成版
 * 基于 AI场景感知助手 改造
 * 
 * 功能：
 * - 俏皮伴侣模式：对选中文本、悬停内容、页面主题进行 AI 吐槽
 * - 学习监督模式：智能判断摸鱼网站，全屏警句提醒
 * - 文字转语音：调用 Edge TTS 播报 AI 回复
 * 
 * 使用方式：直接引入 <script src="/js/wiki-kanban.js"></script>
 */

// ==== 全局状态 ====
const WikiKanban = {
    config: {
        // API 配置
        apiEndpoint: 'https://dify-proxy.1548324254.workers.dev/v1/chat/completions',
        model: 'qwen3.5-9b',
        apiKey: '',
        // 看板娘配置
        bubbleDuration: 6000,
        triggerCooldown: 2000,
        isEnabled: true,
        // 学习提醒配置
        learningReminderEnabled: true,
        forcedNonLearningSites: ['weibo.com', 'douyin.com', 'bilibili.com', 'twitter.com', 'reddit.com'],
        maxStayDuration: 5,
        maxHourlyDuration: 15,
        // TTS 配置
        ttsEnabled: false,
        ttsVoice: 'zh-CN-XiaoxiaoNeural',
        ttsRate: 1.0,
        ttsPitch: 1.0,
    },
    state: {
        isThinking: false,
        isBubbleVisible: false,
        lastTriggerTime: 0,
        isDragging: false,
        didMove: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        lastHoveredElement: null,
        isTimerRunning: false,
        isLearningSite: false,
        typingTimer: null,
        hideBubbleTimer: null,
        synth: null,
        speakingUtterance: null,
    },
    ui: {
        container: null,
        character: null,
        characterStatus: null,
        bubbleWrapper: null,
        bubble: null,
        bubbleContent: null,
        settingsPanel: null,
        fullScreenOverlay: null,
    }
};

// ==== 工具函数 ====
function $get(key, defaultVal) {
    try {
        const val = localStorage.getItem('wiki_kanban_' + key);
        return val !== null ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
}
function $set(key, val) {
    try { localStorage.setItem('wiki_kanban_' + key, JSON.stringify(val)); } catch {}
}
function $del(key) {
    try { localStorage.removeItem('wiki_kanban_' + key); } catch {}
}

// ==== 配置管理 ====
function loadConfig() {
    WikiKanban.config.apiEndpoint = $get('apiEndpoint', WikiKanban.config.apiEndpoint);
    WikiKanban.config.model = $get('model', WikiKanban.config.model);
    WikiKanban.config.apiKey = $get('apiKey', WikiKanban.config.apiKey);
    WikiKanban.config.isEnabled = $get('isEnabled', WikiKanban.config.isEnabled);
    WikiKanban.config.learningReminderEnabled = $get('learningReminderEnabled', WikiKanban.config.learningReminderEnabled);
    WikiKanban.config.forcedNonLearningSites = $get('forcedNonLearningSites', WikiKanban.config.forcedNonLearningSites);
    WikiKanban.config.maxStayDuration = $get('maxStayDuration', WikiKanban.config.maxStayDuration);
    WikiKanban.config.maxHourlyDuration = $get('maxHourlyDuration', WikiKanban.config.maxHourlyDuration);
    WikiKanban.config.ttsEnabled = $get('ttsEnabled', WikiKanban.config.ttsEnabled);
    WikiKanban.config.ttsVoice = $get('ttsVoice', WikiKanban.config.ttsVoice);
    WikiKanban.config.ttsRate = $get('ttsRate', WikiKanban.config.ttsRate);
    WikiKanban.config.ttsPitch = $get('ttsPitch', WikiKanban.config.ttsPitch);
}

function saveConfig() {
    $set('apiEndpoint', WikiKanban.config.apiEndpoint);
    $set('model', WikiKanban.config.model);
    $set('apiKey', WikiKanban.config.apiKey);
    $set('isEnabled', WikiKanban.config.isEnabled);
    $set('learningReminderEnabled', WikiKanban.config.learningReminderEnabled);
    $set('forcedNonLearningSites', WikiKanban.config.forcedNonLearningSites);
    $set('maxStayDuration', WikiKanban.config.maxStayDuration);
    $set('maxHourlyDuration', WikiKanban.config.maxHourlyDuration);
    $set('ttsEnabled', WikiKanban.config.ttsEnabled);
    $set('ttsVoice', WikiKanban.config.ttsVoice);
    $set('ttsRate', WikiKanban.config.ttsRate);
    $set('ttsPitch', WikiKanban.config.ttsPitch);
}

// ==== Edge TTS 文字转语音 ====
function initTTS() {
    if (!('speechSynthesis' in window)) {
        console.log('TTS: 当前浏览器不支持语音合成');
        return;
    }
    WikiKanban.state.synth = window.speechSynthesis;
}

async function speakText(text) {
    if (!WikiKanban.config.ttsEnabled || !WikiKanban.state.synth) return;
    
    // 停止之前的朗读
    WikiKanban.state.synth.cancel();
    
    return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语音参数
        utterance.rate = WikiKanban.config.ttsRate;
        utterance.pitch = WikiKanban.config.ttsPitch;
        utterance.lang = 'zh-CN';
        
        // 尝试选择中文语音
        const voices = WikiKanban.state.synth.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.includes('zh') && v.lang.includes('CN')
        ) || voices.find(v => v.lang.includes('zh')) || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);
        
        WikiKanban.state.speakingUtterance = utterance;
        WikiKanban.state.synth.speak(utterance);
    });
}

function stopSpeech() {
    if (WikiKanban.state.synth) {
        WikiKanban.state.synth.cancel();
    }
}

// ==== UI 创建 ====
function createUI() {
    WikiKanban.ui.container = document.createElement('div');
    WikiKanban.ui.container.id = 'wiki-kanban-container';
    document.body.appendChild(WikiKanban.ui.container);

    WikiKanban.ui.container.innerHTML = `
        <div id="kanban-bubble-wrapper">
            <div id="kanban-bubble">
                <div class="bubble-content"></div>
            </div>
        </div>
        <div id="kanban-character">
            <div id="kanban-character-status">😊</div>
            <div id="kanban-settings-btn" title="设置">⚙️</div>
        </div>
        
        <!-- 设置面板 -->
        <div id="kanban-settings-panel">
            <div class="settings-header">
                <span>看板娘设置</span>
                <button id="kanban-settings-close">×</button>
            </div>
            <div class="settings-content">
                <div class="settings-group">
                    <h4>API 配置</h4>
                    <label>
                        <span>API Endpoint</span>
                        <input type="text" id="kanban-api-endpoint" placeholder="https://..." />
                    </label>
                    <label>
                        <span>API Key</span>
                        <input type="password" id="kanban-api-key" placeholder="可选" />
                    </label>
                    <label>
                        <span>模型名称</span>
                        <input type="text" id="kanban-model" placeholder="模型名" />
                    </label>
                </div>
                
                <div class="settings-group">
                    <h4>功能开关</h4>
                    <label class="toggle-label">
                        <input type="checkbox" id="kanban-enabled" />
                        <span>启用看板娘</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="kanban-learning" />
                        <span>学习提醒</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="kanban-tts" />
                        <span>语音播报 (Edge TTS)</span>
                    </label>
                </div>
                
                <div class="settings-group">
                    <h4>学习提醒</h4>
                    <label>
                        <span>强制摸鱼网站 (逗号分隔)</span>
                        <input type="text" id="kanban-forced-sites" placeholder="weibo.com,douyin.com" />
                    </label>
                    <label>
                        <span>单次摸鱼时长 (分钟)</span>
                        <input type="number" id="kanban-max-stay" min="1" max="60" />
                    </label>
                    <label>
                        <span>每小时摸鱼上限 (分钟)</span>
                        <input type="number" id="kanban-max-hourly" min="1" max="60" />
                    </label>
                </div>
                
                <div class="settings-group tts-settings">
                    <h4>语音设置</h4>
                    <label>
                        <span>语速 (0.5-2.0)</span>
                        <input type="range" id="kanban-tts-rate" min="0.5" max="2" step="0.1" />
                        <span class="value-display" id="kanban-rate-value">1.0</span>
                    </label>
                    <label>
                        <span>音调 (0.5-2.0)</span>
                        <input type="range" id="kanban-tts-pitch" min="0.5" max="2" step="0.1" />
                        <span class="value-display" id="kanban-pitch-value">1.0</span>
                    </label>
                </div>
                
                <div class="settings-footer">
                    <button id="kanban-save">保存</button>
                    <button id="kanban-clear-cache">清除分类缓存</button>
                </div>
            </div>
        </div>
    `;

    WikiKanban.ui.character = document.getElementById('kanban-character');
    WikiKanban.ui.characterStatus = document.getElementById('kanban-character-status');
    WikiKanban.ui.settingsBtn = document.getElementById('kanban-settings-btn');
    WikiKanban.ui.settingsPanel = document.getElementById('kanban-settings-panel');
    WikiKanban.ui.bubbleWrapper = document.getElementById('kanban-bubble-wrapper');
    WikiKanban.ui.bubble = document.getElementById('kanban-bubble');
    WikiKanban.ui.bubbleContent = WikiKanban.ui.bubble.querySelector('.bubble-content');
}

// ==== 样式 ====
function applyStyles() {
    const styles = `
        #wiki-kanban-container {
            position: fixed;
            z-index: 99998;
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        /* 看板娘本体 */
        #kanban-character {
            width: 70px;
            height: 70px;
            background: linear-gradient(145deg, #89f7fe 0%, #66a6ff 100%);
            border-radius: 50%;
            cursor: grab;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.5);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        #kanban-character:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
        }
        #kanban-character:active {
            cursor: grabbing;
            transform: scale(1.1);
        }
        #kanban-character.thinking {
            animation: kanban-thinking 1.2s ease-in-out infinite;
        }
        @keyframes kanban-thinking {
            0%, 100% { transform: translateX(0) rotate(0); }
            25% { transform: translateX(-3px) rotate(-2deg); }
            75% { transform: translateX(3px) rotate(2deg); }
        }
        
        #kanban-character-status {
            color: white;
            font-size: 13px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            line-height: 1.2;
            text-align: center;
            padding: 2px;
            user-select: none;
        }
        
        #kanban-settings-btn {
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 16px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s, transform 0.2s;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        #kanban-settings-btn:hover {
            opacity: 1;
            transform: rotate(90deg);
        }
        
        /* 气泡 */
        #kanban-bubble-wrapper {
            position: absolute;
            width: 280px;
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            pointer-events: none;
            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #kanban-bubble-wrapper.on-right { bottom: 50%; left: 100%; transform: translate(15px, 50%); }
        #kanban-bubble-wrapper.on-left { bottom: 50%; right: 100%; transform: translate(-15px, 50%); }
        #kanban-bubble-wrapper.visible {
            opacity: 1;
            transform: translate(var(--tx, 15px), 50%) scale(1);
            animation: kanban-pop-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
        #kanban-bubble-wrapper.on-left.visible { --tx: -15px; }
        #kanban-bubble-wrapper.on-right.visible { --tx: 15px; }
        @keyframes kanban-pop-in {
            0% { transform: scale(0.8); opacity: 0; }
            70% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        #kanban-bubble {
            background: rgba(20, 25, 40, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(102, 166, 255, 0.3);
            position: relative;
        }
        #kanban-bubble::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 0;
            height: 0;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
        }
        .on-right #kanban-bubble::after {
            left: 100%;
            transform: translateY(-50%);
            border-right: 8px solid rgba(20, 25, 40, 0.95);
        }
        .on-left #kanban-bubble::after {
            right: 100%;
            transform: translateY(-50%);
            border-left: 8px solid rgba(20, 25, 40, 0.95);
        }
        .bubble-content {
            font-size: 14px;
            line-height: 1.5;
            color: #e0e8ff;
            word-wrap: break-word;
        }
        .typing-cursor {
            display: inline-block;
            width: 2px;
            height: 1em;
            background-color: #66a6ff;
            animation: kanban-blink 0.7s infinite;
            vertical-align: middle;
        }
        @keyframes kanban-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        
        /* 设置面板 */
        #kanban-settings-panel {
            position: absolute;
            top: 80px;
            right: 0;
            width: 320px;
            max-height: 500px;
            background: rgba(20, 25, 40, 0.98);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(102, 166, 255, 0.3);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            display: none;
            overflow: hidden;
            font-size: 13px;
        }
        #kanban-settings-panel.show {
            display: block;
            animation: kanban-slide-in 0.3s ease;
        }
        @keyframes kanban-slide-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: rgba(102, 166, 255, 0.1);
            border-bottom: 1px solid rgba(102, 166, 255, 0.2);
            font-weight: bold;
            color: #89f7fe;
        }
        #kanban-settings-close {
            background: none;
            border: none;
            color: #66a6ff;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        #kanban-settings-close:hover { color: #fff; }
        .settings-content {
            padding: 12px 16px;
            max-height: 420px;
            overflow-y: auto;
        }
        .settings-group {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(102, 166, 255, 0.1);
        }
        .settings-group:last-child { border-bottom: none; }
        .settings-group h4 {
            margin: 0 0 10px 0;
            color: #89f7fe;
            font-size: 13px;
        }
        .settings-group label {
            display: flex;
            flex-direction: column;
            margin-bottom: 8px;
            color: #b0c4de;
        }
        .settings-group label > span {
            font-size: 12px;
            margin-bottom: 4px;
            color: #8899aa;
        }
        .settings-group input[type="text"],
        .settings-group input[type="password"],
        .settings-group input[type="number"] {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(102, 166, 255, 0.3);
            border-radius: 8px;
            padding: 8px 10px;
            color: #e0e8ff;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }
        .settings-group input:focus {
            border-color: #66a6ff;
        }
        .toggle-label {
            flex-direction: row !important;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        .toggle-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #66a6ff;
        }
        .toggle-label span { margin-bottom: 0 !important; }
        
        /* TTS 设置 */
        .tts-settings label {
            flex-direction: row !important;
            align-items: center;
            gap: 10px;
        }
        .tts-settings input[type="range"] {
            flex: 1;
            accent-color: #66a6ff;
        }
        .tts-settings .value-display {
            min-width: 30px;
            text-align: right;
        }
        
        .settings-footer {
            display: flex;
            gap: 10px;
            padding-top: 12px;
        }
        .settings-footer button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }
        #kanban-save {
            background: linear-gradient(145deg, #66a6ff, #89f7fe);
            color: #1a1a2e;
            font-weight: bold;
        }
        #kanban-save:hover { opacity: 0.9; }
        #kanban-clear-cache {
            background: rgba(102, 166, 255, 0.2);
            color: #89f7fe;
        }
        #kanban-clear-cache:hover { background: rgba(102, 166, 255, 0.3); }
        
        /* 全屏提醒 */
        #kanban-fullscreen-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            animation: kanban-fade-in 0.5s forwards;
        }
        @keyframes kanban-fade-in { to { opacity: 1; } }
        .kanban-overlay-content {
            max-width: 500px;
            text-align: center;
            color: white;
            padding: 30px;
            background: rgba(30, 35, 50, 0.9);
            border-radius: 20px;
            border: 1px solid rgba(102, 166, 255, 0.3);
            transform: scale(0.9);
            animation: kanban-pop-in-overlay 0.5s 0.3s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes kanban-pop-in-overlay { to { transform: scale(1); } }
        .kanban-overlay-reason {
            font-size: 16px;
            margin-bottom: 16px;
            color: #ffc107;
        }
        .kanban-overlay-quote {
            font-family: 'Noto Serif SC', 'KaiTi', serif;
            font-size: 22px;
            line-height: 1.6;
            margin-bottom: 24px;
            min-height: 60px;
            color: #e0e8ff;
        }
        .kanban-overlay-close {
            background: linear-gradient(145deg, #ffc107, #ffca2c);
            color: #1a1a2e;
            border: none;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            transition: transform 0.2s, opacity 0.3s;
        }
        .kanban-overlay-close:hover:not(:disabled) {
            transform: scale(1.05);
        }
        .kanban-overlay-close:disabled {
            background: #555;
            cursor: not-allowed;
            opacity: 0.7;
        }
        
        /* 滚动条样式 */
        .settings-content::-webkit-scrollbar {
            width: 6px;
        }
        .settings-content::-webkit-scrollbar-track {
            background: transparent;
        }
        .settings-content::-webkit-scrollbar-thumb {
            background: rgba(102, 166, 255, 0.3);
            border-radius: 3px;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ==== 事件绑定 ====
function bindEvents() {
    const char = WikiKanban.ui.character;
    const settingsBtn = WikiKanban.ui.settingsBtn;
    const settingsPanel = WikiKanban.ui.settingsPanel;
    
    // 拖拽
    char.addEventListener('mousedown', (e) => {
        if (e.target === settingsBtn) return;
        e.preventDefault();
        WikiKanban.state.isDragging = true;
        WikiKanban.state.didMove = false;
        WikiKanban.state.dragOffsetX = e.clientX - WikiKanban.ui.container.offsetLeft;
        WikiKanban.state.dragOffsetY = e.clientY - WikiKanban.ui.container.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    function onMouseMove(e) {
        if (!WikiKanban.state.isDragging) return;
        WikiKanban.state.didMove = true;
        let newX = e.clientX - WikiKanban.state.dragOffsetX;
        let newY = e.clientY - WikiKanban.state.dragOffsetY;
        const rect = WikiKanban.ui.container.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));
        WikiKanban.ui.container.style.left = `${newX}px`;
        WikiKanban.ui.container.style.top = `${newY}px`;
        WikiKanban.ui.container.style.right = 'auto';
        WikiKanban.ui.container.style.bottom = 'auto';
    }
    
    function onMouseUp() {
        if (!WikiKanban.state.isDragging) return;
        WikiKanban.state.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        savePosition(WikiKanban.ui.container.offsetLeft, WikiKanban.ui.container.offsetTop);
        if (!WikiKanban.state.didMove) {
            triggerAnalysis('manual_click');
        }
    }
    
    // 设置按钮
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('show');
        if (settingsPanel.classList.contains('show')) {
            loadSettingsToUI();
        }
    });
    
    document.getElementById('kanban-settings-close').addEventListener('click', () => {
        settingsPanel.classList.remove('show');
    });
    
    // 保存设置
    document.getElementById('kanban-save').addEventListener('click', saveSettings);
    
    // 清除缓存
    document.getElementById('kanban-clear-cache').addEventListener('click', () => {
        $del('pageClassificationCache');
        showMessage('缓存已清除', true);
    });
    
    // TTS 滑块显示值
    document.getElementById('kanban-tts-rate').addEventListener('input', (e) => {
        document.getElementById('kanban-rate-value').textContent = parseFloat(e.target.value).toFixed(1);
    });
    document.getElementById('kanban-tts-pitch').addEventListener('input', (e) => {
        document.getElementById('kanban-pitch-value').textContent = parseFloat(e.target.value).toFixed(1);
    });
    
    // 随机触发
    document.addEventListener('click', (e) => {
        if (WikiKanban.ui.container.contains(e.target)) return;
        if (Math.random() < 0.15) triggerAnalysis('random_click');
    });
    
    let scrollTimeout;
    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (Math.random() < 0.1) triggerAnalysis('scroll');
        }, 500);
    });
    
    // 悬停
    document.addEventListener('mouseover', (e) => {
        WikiKanban.state.lastHoveredElement = e.target;
    });
    
    let mouseMoveTimeout;
    document.addEventListener('mousemove', () => {
        if (WikiKanban.state.isDragging) return;
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => {
            if (Math.random() < 0.2) {
                triggerAnalysis('mouse_stop');
            }
        }, 2500);
    });
    
    // 划词
    document.addEventListener('mouseup', (e) => {
        if (WikiKanban.ui.container.contains(e.target) || WikiKanban.state.isDragging) return;
        setTimeout(() => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText.length > 0) {
                triggerAnalysis('selection');
            }
        }, 500);
    });
    
    // 点击其他地方关闭设置面板
    document.addEventListener('click', (e) => {
        if (!WikiKanban.ui.container.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }
    });
}

function savePosition(x, y) {
    $set('position', { x, y });
}

function loadPosition() {
    const pos = $get('position', null);
    if (pos) {
        WikiKanban.ui.container.style.left = `${pos.x}px`;
        WikiKanban.ui.container.style.top = `${pos.y}px`;
        WikiKanban.ui.container.style.right = 'auto';
        WikiKanban.ui.container.style.bottom = 'auto';
    } else {
        WikiKanban.ui.container.style.right = '30px';
        WikiKanban.ui.container.style.bottom = '30px';
        WikiKanban.ui.container.style.left = 'auto';
        WikiKanban.ui.container.style.top = 'auto';
    }
}

// ==== 设置面板 ====
function loadSettingsToUI() {
    document.getElementById('kanban-api-endpoint').value = WikiKanban.config.apiEndpoint;
    document.getElementById('kanban-api-key').value = WikiKanban.config.apiKey;
    document.getElementById('kanban-model').value = WikiKanban.config.model;
    document.getElementById('kanban-enabled').checked = WikiKanban.config.isEnabled;
    document.getElementById('kanban-learning').checked = WikiKanban.config.learningReminderEnabled;
    document.getElementById('kanban-tts').checked = WikiKanban.config.ttsEnabled;
    document.getElementById('kanban-forced-sites').value = WikiKanban.config.forcedNonLearningSites.join(',');
    document.getElementById('kanban-max-stay').value = WikiKanban.config.maxStayDuration;
    document.getElementById('kanban-max-hourly').value = WikiKanban.config.maxHourlyDuration;
    document.getElementById('kanban-tts-rate').value = WikiKanban.config.ttsRate;
    document.getElementById('kanban-tts-pitch').value = WikiKanban.config.ttsPitch;
    document.getElementById('kanban-rate-value').textContent = WikiKanban.config.ttsRate.toFixed(1);
    document.getElementById('kanban-pitch-value').textContent = WikiKanban.config.ttsPitch.toFixed(1);
}

function saveSettings() {
    WikiKanban.config.apiEndpoint = document.getElementById('kanban-api-endpoint').value.trim() || WikiKanban.config.apiEndpoint;
    WikiKanban.config.apiKey = document.getElementById('kanban-api-key').value.trim();
    WikiKanban.config.model = document.getElementById('kanban-model').value.trim() || WikiKanban.config.model;
    WikiKanban.config.isEnabled = document.getElementById('kanban-enabled').checked;
    WikiKanban.config.learningReminderEnabled = document.getElementById('kanban-learning').checked;
    WikiKanban.config.ttsEnabled = document.getElementById('kanban-tts').checked;
    WikiKanban.config.forcedNonLearningSites = document.getElementById('kanban-forced-sites').value
        .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    WikiKanban.config.maxStayDuration = parseInt(document.getElementById('kanban-max-stay').value) || 5;
    WikiKanban.config.maxHourlyDuration = parseInt(document.getElementById('kanban-max-hourly').value) || 15;
    WikiKanban.config.ttsRate = parseFloat(document.getElementById('kanban-tts-rate').value) || 1.0;
    WikiKanban.config.ttsPitch = parseFloat(document.getElementById('kanban-tts-pitch').value) || 1.0;
    
    saveConfig();
    showMessage('设置已保存 ✓', true);
    
    // 更新看板娘可见性
    WikiKanban.ui.container.style.display = WikiKanban.config.isEnabled ? 'block' : 'none';
    WikiKanban.ui.settingsPanel.classList.remove('show');
}

// ==== 消息显示 ====
function updateCharacterStatus(text) {
    if (WikiKanban.ui.characterStatus) {
        WikiKanban.ui.characterStatus.innerHTML = text;
    }
}

function adjustBubblePosition() {
    const charRect = WikiKanban.ui.container.getBoundingClientRect();
    const screenCenter = window.innerWidth / 2;
    WikiKanban.ui.bubbleWrapper.classList.remove('on-left', 'on-right');
    if (charRect.left < screenCenter) {
        WikiKanban.ui.bubbleWrapper.classList.add('on-right');
    } else {
        WikiKanban.ui.bubbleWrapper.classList.add('on-left');
    }
}

function showMessage(message, isForce = false) {
    clearTimeout(WikiKanban.state.typingTimer);
    clearTimeout(WikiKanban.state.hideBubbleTimer);
    
    WikiKanban.ui.bubbleContent.innerHTML = '';
    adjustBubblePosition();
    WikiKanban.ui.bubbleWrapper.classList.add('visible');
    WikiKanban.state.isBubbleVisible = true;
    
    typeWriter(message, WikiKanban.ui.bubbleContent, () => {
        const duration = isForce ? WikiKanban.config.bubbleDuration * 1.5 : WikiKanban.config.bubbleDuration;
        WikiKanban.state.hideBubbleTimer = setTimeout(hideBubble, duration);
        
        // TTS 播报
        if (WikiKanban.config.ttsEnabled) {
            speakText(message).catch(() => {});
        }
    });
}

function hideBubble() {
    if (!WikiKanban.state.isBubbleVisible) return;
    WikiKanban.ui.bubbleWrapper.classList.remove('visible');
    WikiKanban.state.isBubbleVisible = false;
    clearTimeout(WikiKanban.state.typingTimer);
    clearTimeout(WikiKanban.state.hideBubbleTimer);
    stopSpeech();
}

function typeWriter(text, element, callback) {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    
    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
            i++;
            WikiKanban.state.typingTimer = setTimeout(type, Math.random() * 60 + 40);
        } else {
            cursor.remove();
            WikiKanban.state.typingTimer = null;
            if (callback) callback();
        }
    }
    type();
}

// ==== AI 调用 ====
async function triggerAnalysis(triggerType) {
    if (!WikiKanban.config.isEnabled) return;
    if (WikiKanban.state.isLearningSite) return;
    if (WikiKanban.state.isThinking || WikiKanban.state.isDragging) return;
    
    const now = Date.now();
    const isSelectionTrigger = triggerType === 'selection';
    
    if (!isSelectionTrigger && (now - WikiKanban.state.lastTriggerTime < WikiKanban.config.triggerCooldown)) return;
    
    WikiKanban.state.isThinking = true;
    WikiKanban.state.lastTriggerTime = now;
    WikiKanban.ui.character.classList.add('thinking');
    updateCharacterStatus('思考中🤔');
    
    try {
        const pageContext = extractPageContext();
        const prompt = createWittyPrompt(pageContext, triggerType);
        const wittyRemark = await callAIAPI(prompt);
        if (wittyRemark) showMessage(wittyRemark);
    } catch (error) {
        console.error('看板娘出错:', error);
        showMessage('唔...脑子卡住了...');
    } finally {
        WikiKanban.state.isThinking = false;
        WikiKanban.ui.character.classList.remove('thinking');
        updateLearningStatus();
    }
}

function extractPageContext() {
    let hoveredText = '';
    if (WikiKanban.state.lastHoveredElement && WikiKanban.state.lastHoveredElement.innerText) {
        const validTags = ['P', 'H1', 'H2', 'H3', 'H4', 'A', 'SPAN', 'DIV', 'LI', 'BUTTON', 'TD', 'BLOCKQUOTE', 'STRONG', 'EM'];
        if (validTags.includes(WikiKanban.state.lastHoveredElement.tagName.toUpperCase())) {
            hoveredText = WikiKanban.state.lastHoveredElement.innerText.trim().substring(0, 300);
        }
    }
    return {
        title: document.title,
        url: window.location.href,
        selection: window.getSelection().toString().trim(),
        hoveredText: hoveredText,
        pageText: document.body.innerText.substring(0, 3000)
    };
}

function createWittyPrompt(context, trigger) {
    let actionDescription = "正在浏览页面";
    let contextDetails = `- 页面标题: "${context.title}"`;

    if (trigger === 'selection' && context.selection) {
        actionDescription = `刚刚选择了一段文字`;
        contextDetails += `\n- 选择的文本: "${context.selection.substring(0, 300)}"`;
    } else if (trigger === 'mouse_stop' && context.hoveredText) {
        actionDescription = `的鼠标停留在了这段内容上`;
        contextDetails += `\n- 悬停处的文本: "${context.hoveredText}"`;
    }

    if (trigger !== 'selection' && trigger !== 'mouse_stop' && context.pageText) {
        contextDetails += `\n\n# 供参考的页面内容概览:\n${context.pageText.substring(0, 800)}`;
    }

    return `你是一个网站的AI看板娘，性格俏皮可爱，有点小毒舌。你的任务是观察用户的行为和当前页面内容，然后用一句简短、有趣的俏皮话来吐槽或评论，***尽量避免问句***，要正能量。

# 规则:
- 必须只回复一句话。
- 语言风格要活泼、自然，像朋友一样。
- 长度严格控制在30个字以内。
- 直接返回俏皮话，不要包含任何其他说明或符号。

# 当前情景:
- 用户行为: 用户${actionDescription}
${contextDetails}

请根据以上情景，表达你的观点（能锐评的地方锐评一下）：`;
}

async function callAIAPI(prompt, temperature = 0.8, max_tokens = 100) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (WikiKanban.config.apiKey) {
        headers['Authorization'] = `Bearer ${WikiKanban.config.apiKey}`;
    }
    
    const response = await fetch(WikiKanban.config.apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: WikiKanban.config.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: temperature,
            max_tokens: max_tokens,
        })
    });
    
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('AI返回了无效的内容');
    return content;
}

// ==== 学习提醒 ====
const TRACKING_INTERVAL = 5 * 1000;

function initLearningReminder() {
    if (!WikiKanban.config.learningReminderEnabled) return;
    
    // 检查强制摸鱼网站
    const currentHost = window.location.hostname.toLowerCase();
    const isForcedSite = WikiKanban.config.forcedNonLearningSites.some(site => 
        currentHost.includes(site) || site.includes(currentHost)
    );
    
    if (isForcedSite) {
        WikiKanban.state.isLearningSite = false;
        updateLearningStatus();
        startTracking();
        return;
    }
    
    // 检查缓存
    const cacheKey = `kanban_class_${window.location.hostname}`;
    const cached = $get(cacheKey, null);
    
    if (cached !== null) {
        WikiKanban.state.isLearningSite = cached === 'learning';
        updateLearningStatus();
        if (!WikiKanban.state.isLearningSite) startTracking();
        return;
    }
    
    // AI 判断
    updateCharacterStatus('分析中...');
    const context = extractPageContext();
    const prompt = createClassificationPrompt(context);
    
    callAIAPI(prompt, 0.1, 10).then(result => {
        const isLearning = result.toUpperCase().includes('NO');
        WikiKanban.state.isLearningSite = isLearning;
        $set(cacheKey, isLearning ? 'learning' : 'moyu');
        updateLearningStatus();
        if (!isLearning) startTracking();
    }).catch(() => {
        WikiKanban.state.isLearningSite = false;
        updateLearningStatus();
        startTracking();
    });
}

function createClassificationPrompt(context) {
    return `判断该网页是否主要用于"学习"或"工作"。

- 学习/工作网站: 在线课程、学术搜索、编程文档、技术论坛等。
- 摸鱼网站: 视频娱乐、社交媒体、新闻八卦、在线购物、游戏、小说漫画等。

**重要规则:**
1. 如果判断为学习/工作网站，**只回答 "NO"**。
2. 如果判断为摸鱼网站，**只回答 "YES"**。
3. 不要有任何其他解释或文字。

待判断: ${context.title} - ${context.url}`;
}

function updateLearningStatus() {
    if (!WikiKanban.config.learningReminderEnabled) {
        updateCharacterStatus('😊');
        return;
    }
    if (WikiKanban.state.isLearningSite) {
        updateCharacterStatus('学习中📚');
    } else {
        updateCharacterStatus('摸鱼中');
    }
}

// 学习计时
let trackingData = {
    totalMoyuTime: 0,
    currentSiteTime: 0,
    lastCheckTime: Date.now()
};

function startTracking() {
    if (WikiKanban.state.isTimerRunning) return;
    WikiKanban.state.isTimerRunning = true;
    
    setInterval(() => {
        if (!WikiKanban.config.learningReminderEnabled || WikiKanban.state.isLearningSite) return;
        
        const now = Date.now();
        const elapsed = (now - trackingData.lastCheckTime) / 1000 / 60;
        trackingData.totalMoyuTime += elapsed;
        trackingData.currentSiteTime += elapsed;
        trackingData.lastCheckTime = now;
        
        // 检查阈值
        if (trackingData.currentSiteTime >= WikiKanban.config.maxStayDuration ||
            trackingData.totalMoyuTime >= WikiKanban.config.maxHourlyDuration) {
            showFullScreenWarning();
        }
    }, TRACKING_INTERVAL);
}

function showFullScreenWarning() {
    if (WikiKanban.ui.fullScreenOverlay) return;
    
    WikiKanban.ui.fullScreenOverlay = document.createElement('div');
    WikiKanban.ui.fullScreenOverlay.id = 'kanban-fullscreen-overlay';
    WikiKanban.ui.fullScreenOverlay.innerHTML = `
        <div class="kanban-overlay-content">
            <div class="kanban-overlay-reason">⚠️ 摸鱼时间超标了！</div>
            <div class="kanban-overlay-quote" id="kanban-warning-quote">正在思考人生...</div>
            <button class="kanban-overlay-close" id="kanban-close-warning" disabled>冷静一下 (5)</button>
        </div>
    `;
    document.body.appendChild(WikiKanban.ui.fullScreenOverlay);
    
    // AI 生成警句
    const quote = document.getElementById('kanban-warning-quote');
    const closeBtn = document.getElementById('kanban-close-warning');
    
    // 计算冷静时间
    const baseWait = 5;
    const extraWait = Math.floor(Math.min(trackingData.totalMoyuTime, 30) / 5) * 2;
    let waitTime = baseWait + extraWait;
    
    let countdown = waitTime;
    closeBtn.textContent = `冷静一下 (${countdown})`;
    
    const countdownInterval = setInterval(() => {
        countdown--;
        closeBtn.textContent = `冷静一下 (${countdown})`;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            closeBtn.disabled = false;
            closeBtn.textContent = '好的，我反省了';
        }
    }, 1000);
    
    closeBtn.addEventListener('click', () => {
        WikiKanban.ui.fullScreenOverlay.remove();
        WikiKanban.ui.fullScreenOverlay = null;
        trackingData.currentSiteTime = 0;
        trackingData.totalMoyuTime = 0;
    });
    
    // AI 生成警句
    const prompts = [
        '生成一句幽默但有正能量的摸鱼警句，不超过20字',
        '生成一句调侃摸鱼的搞笑提醒，不超过20字',
        '生成一句让人会心一笑的学习提醒，不超过20字'
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    callAIAPI(randomPrompt, 0.9, 50).then(text => {
        quote.textContent = text.replace(/[""]/g, '');
    }).catch(() => {
        quote.textContent = '少壮不努力，老大徒伤悲...';
    });
}

// ==== 初始化 ====
function init() {
    loadConfig();
    
    if (!WikiKanban.config.isEnabled) {
        console.log('看板娘已禁用');
        return;
    }
    
    // 初始化 TTS
    initTTS();
    if (WikiKanban.state.synth && WikiKanban.state.synth.onvoiceschanged !== undefined) {
        WikiKanban.state.synth.onvoiceschanged = () => WikiKanban.state.synth.getVoices();
    }
    
    createUI();
    applyStyles();
    loadPosition();
    bindEvents();
    initLearningReminder();
    
    console.log('Wiki AI 看板娘已启动 ✨');
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
