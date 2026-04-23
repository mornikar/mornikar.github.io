/**
 * ════════════════════════════════════════════════════════
 *  Mornikar Wiki CMS — 统一 Worker（v2）
 *  
 *  功能：
 *  ① 托管 CMS 前端页面（/ 和 /admin）
 *  ② 代理 GitHub API 请求（/api/github/*）
 *  ③ 处理图片上传（/api/upload）
 *  ④ 零跨域：前端和API在同一Worker域名下
 * 
 *  部署：Cloudflare Dashboard → Workers → Edit Code → 粘贴 → Deploy
 *  环境变量：GITHUB_CLIENT_SECRET（可选，用于 OAuth 备用方案）
 * ════════════════════════════════════════════════════════
 */

const GITHUB_API = 'https://api.github.com';

// ======== CORS Headers ========
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// ======== CMS HTML（自动从 GitHub 获取） ========
let cachedHtml = null;
const CMS_RAW_URL = 'https://raw.githubusercontent.com/mornikar/mornikar.github.io/source/source/admin/index.html';
const CACHE_TTL = 5 * 60 * 1000; // 缓存5分钟
let cacheTime = 0;

async function getCmsHtml() {
  // 内存缓存
  if (cachedHtml && (Date.now() - cacheTime) < CACHE_TTL) return new Response(cachedHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
  });

  try {
    console.log('[CMS] Fetching latest from GitHub...');
    const resp = await fetch(CMS_RAW_URL);
    if (!resp.ok) throw new Error('GitHub raw fetch failed: ' + resp.status);
    
    cachedHtml = await resp.text();
    cacheTime = Date.now();
    
    return new Response(cachedHtml, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders,
        'X-CMS-Cache': 'fresh',
      },
    });
  } catch (err) {
    console.error('[CMS] Failed to fetch from GitHub:', err.message);
    
    // 返回一个带跳转提示的页面
    return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wiki CMS</title>
<style>body{background:#080c16;color:#7a8ba8;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px}
.box{max-width:460px}.spin{width:36px;height:36px;border:3px solid #1e3054;border-top:#6366f1;border-radius:50%;animation:s .8s linear infinite;margin:20px auto}
@keyframes s{to{transform:rotate(360deg)}}a{color:#818cf8;font-size:18px}</style></head>
<body><div class="box">
<div class="spin"></div>
<h2 style="margin-bottom:12px;color:#d0dae8">Wiki 内容管理系统</h2>
<p style="margin-bottom:24px">正在从 GitHub 加载最新版本...</p>
<p id="err" style="color:#ef4444;display:none;margin-bottom:16px"></p>
<div id="fallback" style="display:none">
<p style="margin-bottom:16px">无法从 GitHub 自动加载。</p>
<p>请手动打开以下地址：</p>
<a href="https://mornikar.github.io/admin/" target="_blank">mornikar.github.io/admin/</a></div>
<script>
fetch('/health').then(function(r){return r.json()})
  .then(function(d){console.log('Worker OK:',d)})
  .catch(function(){
    document.getElementById('err').textContent='Worker 连接失败，请检查部署';
    document.getElementById('fallback').style.display='block';
    document.querySelector('.spin').style.display='none';
  });
setTimeout(function(){document.getElementById('fallback').style.display='block';},8000);
</script></div></body></html>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── CORS Preflight ───
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ─── Health Check ───
    if (path === '/health' || path === '/health/') {
      return jsonResponse({ status: 'ok', service: 'wiki-cms-worker-v2', time: new Date().toISOString() });
    }

    // ─── Static Assets (CSS/JS/Icons) ───
    if (path.startsWith('/assets/') || path === '/favicon.ico') {
      return handleStaticAsset(path);
    }

    // ─── CMS Page (/ or /admin) ───
    if (path === '/' || path === '/admin' || path === '/admin/' || path === '/index.html') {
      // 尝试从 KV 获取最新版本
      if (env && env.CMS_HTML) {
        try {
          const stored = await env.CMS_HTML.get('index');
          if (stored) {
            return new Response(stored, {
              headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
            });
          }
        } catch(e) { /* KV not configured, fallback */ }
      }
      return getCmsHtml();
    }

    // ─── GitHub API Proxy (/api/github/*) ───
    if (path.startsWith('/api/github/') || path === '/api/github' || path.startsWith('/api/github')) {
      const apiPath = path.replace(/^\/api\/github/, '') || '/';
      const search = url.search;
      return proxyToGitHub(request, apiPath + search);
    }

    // ─── Upload Endpoint (/api/upload) ───
    if (path === '/api/upload' || path === '/api/upload/') {
      return handleUpload(request, env);
    }

    // ─── Fallback: 404 ───
    return new Response(JSON.stringify({ error: 'Not Found', path: path }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};

// ============================================================
// GitHub API Proxy
// ============================================================
async function proxyToGitHub(request, ghPath) {
  const targetUrl = GITHUB_API + ghPath;
  
  try {
    // 构建请求头（转发原始请求头，替换 Host）
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(request.method.toUpperCase()) ? undefined : await request.arrayBuffer(),
    });

    // 构建响应
    const respHeaders = { ...corsHeaders };
    
    // 转发关键响应头
    const forwardHeaders = [
      'content-type', 'x-ratelimit-limit', 'x-ratelimit-remaining',
      'x-ratelimit-reset', 'x-ratelimit-used', 'etag', 'cache-control',
      'location', 'link'
    ];
    for (const h of forwardHeaders) {
      const v = response.headers.get(h);
      if (v) respHeaders[h] = v;
    }

    const body = await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });

  } catch (err) {
    console.error('[Proxy] Error:', err.message);
    return jsonResponse({
      error: 'Proxy Error',
      message: err.message,
      target: targetUrl,
    }, 502);
  }
}

// ============================================================
// Image Upload Handler
// ============================================================
async function handleUpload(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const token = formData.get('token') || request.headers.get('Authorization')?.replace('token ', '');
    const path = formData.get('path') || 'source/images/wiki/';

    if (!file) return jsonResponse({ error: 'No file provided' }, 400);

    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['png','jpg','jpeg','gif','webp','svg','ico','bmp'];
    if (!allowed.includes(ext)) {
      return jsonResponse({ error: 'File type not allowed: .' + ext }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: 'File too large (max 10MB)' }, 400);
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const b64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));
    
    const filename = 'img_' + Date.now() + '.' + ext;
    const filePath = (path.endsWith('/') ? path : path + '/') + filename;

    // Use GitHub Contents API to create file
    const putUrl = GITHUB_API + '/repos/mornikar/mornikar.github.io/contents/' + filePath;
    
    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'CMS: upload image ' + filename,
        content: b64,
        branch: 'source',
      }),
    });

    const result = await putResp.json();

    if (!putResp.ok) {
      return jsonResponse({
        error: 'GitHub upload failed',
        githubError: result.message || 'Unknown error',
      }, putResp.status);
    }

    // Return the public URL
    const publicUrl = '/images/wiki/' + filename;
    
    return jsonResponse({
      success: true,
      filename: filename,
      path: filePath,
      url: publicUrl,
      downloadUrl: result.content?.download_url || '',
      size: file.size,
    });

  } catch (err) {
    console.error('[Upload] Error:', err.message);
    return jsonResponse({ error: 'Upload failed: ' + err.message }, 500);
  }
}

// ============================================================
// Static Asset Handler
// ============================================================
async function handleStaticAsset(path) {
  // For now, return 404 — in production, serve from R2/KV/bundle
  return new Response(JSON.stringify({ error: 'Asset not found', path }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// ============================================================
// Helpers
// ============================================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
