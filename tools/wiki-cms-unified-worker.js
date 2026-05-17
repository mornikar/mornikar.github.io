/**
 * Wiki CMS Unified Worker (v4)
 * 
 * 合并了以下功能：
 *   1. GitHub OAuth 认证流程（/auth → /callback）
 *   2. GitHub API 代理（/api/gh/*）
 *   3. 图片上传（/api/upload）
 *   4. Token 验证（/api/verify）
 *
 * 路由：
 *   GET /auth          → 重定向到 GitHub 授权页
 *   GET /callback      → OAuth 回调，换 token 后重定向回 CMS 页面
 *   ANY /api/gh/*      → 代理 GitHub API 请求
 *   POST /api/upload   → 上传图片到 GitHub 仓库
 *   GET /api/verify    → 验证 Token 有效性
 *   GET /health        → 健康检查
 *
 * 环境变量：
 *   GITHUB_CLIENT_ID     — GitHub OAuth App 的 Client ID
 *   GITHUB_CLIENT_SECRET — GitHub OAuth App 的 Client Secret
 */

// 清理 BOM 和空白字符（PowerShell 管道可能注入 UTF-8 BOM）
function cleanSecret(val) {
  if (!val) return val;
  return val.replace(/^\uFEFF+/, '').trim();
}

const GITHUB_API = 'https://api.github.com';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const OWNER = 'mornikar';
const REPO = 'mornikar.github.io';
const BRANCH = 'source';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (path === '/health' || path === '/health/') {
      return jsonResponse({
        status: 'ok',
        service: 'wiki-cms-unified-v4',
        time: new Date().toISOString(),
        routes: ['/auth', '/callback', '/api/gh/*', '/api/upload', '/api/verify', '/health'],
      });
    }

    // ========== OAuth 路由 ==========

    // GET /auth — 重定向到 GitHub 授权页
    if (path === '/auth') {
      const scope = 'repo';
      const redirectUri = `${url.origin}/callback`;
      const authUrl = `${GITHUB_AUTHORIZE_URL}?client_id=${cleanSecret(env.GITHUB_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
      return Response.redirect(authUrl, 301);
    }

    // GET /callback — GitHub OAuth 回调
    if (path === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code parameter', { status: 400, headers: corsHeaders });
      }

      try {
        const response = await fetch(GITHUB_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: cleanSecret(env.GITHUB_CLIENT_ID),
            client_secret: cleanSecret(env.GITHUB_CLIENT_SECRET),
            code: code,
          }),
        });

        const data = await response.json();

        if (data.error) {
          // OAuth 失败，重定向回 CMS 并附带错误信息
          const errorUrl = 'https://mornikar.github.io/Mornikar/admin/?oauth_error=' + encodeURIComponent(data.error_description || data.error);
          return Response.redirect(errorUrl, 301);
        }

        // 成功：整页重定向回 CMS，token 放在 URL 参数中
        const cmsUrl = 'https://mornikar.github.io/Mornikar/admin/' +
          '?token=' + encodeURIComponent(data.access_token) +
          '&scope=' + encodeURIComponent(data.scope || 'repo') +
          '&token_type=' + encodeURIComponent(data.token_type || 'bearer');

        return Response.redirect(cmsUrl, 301);
      } catch (err) {
        return jsonResponse({ error: 'OAuth callback failed', message: err.message }, 500);
      }
    }

    // ========== API 路由 ==========

    // GitHub API proxy: /api/gh/* or /api/github/*
    if (path.startsWith('/api/gh/') || path.startsWith('/api/github/')) {
      let apiPath = path.replace(/^\/api\/(gh|github)\//, '/') + url.search;
      // GitHub API 不接受路径末尾的斜杠，会导致 404
      apiPath = apiPath.replace(/\/+(\?|$)/, '$1');
      return proxyGitHub(request, apiPath);
    }

    // Image upload: /api/upload
    if (path === '/api/upload' || path === '/api/upload/') {
      return handleUpload(request);
    }

    // Token verify: /api/verify
    if (path === '/api/verify' || path === '/api/verify/') {
      return proxyGitHub(request, '/user');
    }

    // Default 404
    return new Response(JSON.stringify({
      error: 'Not Found',
      path: path,
      hint: 'Available routes: /auth, /callback, /api/gh/*, /api/upload, /api/verify, /health',
      timestamp: new Date().toISOString(),
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};

// ======== GitHub API Proxy ========
async function proxyGitHub(request, ghPath) {
  try {
    // 需要从原始请求中过滤掉的头（避免压缩编码问题和安全头冲突）
    const skipHeaders = new Set(['host', 'accept-encoding', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor']);
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      if (!skipHeaders.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    // 强制 GitHub 返回未压缩的 JSON
    headers.set('Accept-Encoding', 'identity');

    console.log('[Proxy] ' + request.method + ' ' + GITHUB_API + ghPath);

    const response = await fetch(GITHUB_API + ghPath, {
      method: request.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
    });

    // Build response with CORS headers
    const respHeaders = { ...corsHeaders };

    // Forward content-type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      respHeaders['Content-Type'] = contentType;
    }

    // Forward rate limit info
    for (const h of ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'x-ratelimit-used']) {
      const val = response.headers.get(h);
      if (val) respHeaders[h] = val;
    }

    const body = await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('[Proxy Error]', err.message);
    return jsonResponse({
      error: 'Proxy Error',
      message: err.message,
    }, 502);
  }
}

// ======== Image Upload ========
async function handleUpload(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const token = formData.get('token');

    if (!file) {
      return jsonResponse({ error: 'No file provided. Use field name "file".' }, 400);
    }

    if (!token) {
      return jsonResponse({ error: 'No token provided. Use field name "token".' }, 400);
    }

    // Determine extension
    const fileName = file.name || 'image.png';
    const ext = fileName.split('.').pop().toLowerCase() || 'png';
    const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp'];

    if (!allowedExt.includes(ext)) {
      return jsonResponse({ error: 'Unsupported file type: .' + ext }, 400);
    }

    // Generate filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 6);
    const safeName = 'img_' + timestamp + '_' + random + '.' + ext;

    // Target path in repo
    const targetPath = 'source/images/wiki/' + safeName;

    // Read file as ArrayBuffer then convert to base64
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    console.log('[Upload] ' + safeName + ' (' + buffer.byteLength + ' bytes) → ' + targetPath);

    // Push to GitHub via API
    const githubResp = await fetch(GITHUB_API + '/repos/' + OWNER + '/' + REPO + '/contents/' + targetPath, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'CMS: upload image ' + safeName,
        content: base64,
        branch: BRANCH,
      }),
    });

    const result = await githubResp.json();

    if (!githubResp.ok) {
      console.error('[Upload Failed]', githubResp.status, result);
      return jsonResponse({
        error: 'GitHub upload failed',
        github: result.message || JSON.stringify(result),
      }, githubResp.status);
    }

    console.log('[Upload OK] ' + safeName);

    return jsonResponse({
      success: true,
      filename: safeName,
      path: targetPath,
      url: '/images/wiki/' + safeName,
      size: buffer.byteLength,
      download_url: result.content && result.content.download_url,
    });

  } catch (err) {
    console.error('[Upload Error]', err);
    return jsonResponse({
      error: 'Upload failed',
      message: err.message,
    }, 500);
  }
}

// ======== Helpers ========
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
