# Wiki CMS Tools 目录说明

## 当前版本（v4）

### `wiki-cms-unified-worker.js` — 统一 Worker（推荐部署）
合并了所有功能，一个 Worker 搞定：
- `/auth` — GitHub OAuth 授权跳转
- `/callback` — OAuth 回调处理
- `/api/gh/*` — GitHub API 代理（解决 CORS）
- `/api/upload` — 图片上传
- `/api/verify` — Token 验证
- `/health` — 健康检查

**环境变量**：
- `GITHUB_CLIENT_ID` — GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth App 的 Client Secret

## 旧版本（待废弃）

以下文件为旧版拆分方案，功能已被 `wiki-cms-unified-worker.js` 完全包含：

- `decap-oauth-worker.js` — 旧版 OAuth Worker（仅认证）
- `wiki-cms-proxy-worker.js` — 旧版 API 代理 + 图片上传 Worker（v3）
- `cms-worker.js` — 更早期版本

> ⚠️ 当前线上部署的仍是旧版 Worker URL：
> `https://shy-wood-2431decap-oauth.1548324254.workers.dev`
> 
> **迁移步骤**：
> 1. 在 Cloudflare Dashboard 创建新 Worker，部署 `wiki-cms-unified-worker.js`
> 2. 配置环境变量 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`
> 3. 更新 CMS `index.html` 中的 `PROXY_URL` 指向新 Worker
> 4. 验证功能正常后，删除旧 Worker
> 5. 可删除旧文件 `decap-oauth-worker.js`、`wiki-cms-proxy-worker.js`、`cms-worker.js`

## 前端文件

- `source/admin/index.html` — 自建 Wiki CMS v4（支持 OAuth + Token 双模式登录）
- `source/admin/callback.html` — OAuth 回调页面（兼容 Decap/Sveltia CMS）
- `source/admin/config.yml` — Decap CMS 标准配置（集合路径已对齐）
