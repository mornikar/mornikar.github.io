/**
 * Wiki CMS Proxy Worker
 * 
 * 功能：
 *  1. GitHub API 代理（解决 CORS）
 *  2. 图片上传到 GitHub 仓库
 * 
 * 部署后 CMS 通过 /api/gh/* 调用 GitHub API，/api/upload 上传图片
 */

const GITHUB_API = 'https://api.github.com';
const OWNER = 'mornikar';
const REPO = 'mornikar.github.io';
const BRANCH = 'source';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (path === '/health' || path === '/health/') {
      return json({ 
        status: 'ok', 
        service: 'wiki-cms-proxy-v3', 
        time: new Date().toISOString() 
      });
    }

    // GitHub API proxy: /api/gh/*
    if (path.startsWith('/api/gh/') || path.startsWith('/api/github/')) {
      const apiPath = path.replace(/^\/api\/(gh|github)\//, '/') + url.search;
      return proxyGitHub(request, apiPath);
    }

    // Image upload: /api/upload
    if (path === '/api/upload' || path === '/api/upload/') {
      return handleUpload(request);
    }

    // Default: redirect to wiki admin page (optional)
    // Or just return 404
    return new Response('Wiki CMS Proxy - Not Found: ' + path, { 
      status: 404,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
  },
};

// ======== GitHub API Proxy ========
async function proxyGitHub(request, ghPath) {
  try {
    // Build headers from request, forward auth etc
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      // Skip host header
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }

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

    // Return response body as-is (could be JSON, could be binary)
    const body = await response.arrayBuffer();
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('[Proxy Error]', err.message);
    return json({
      error: 'Proxy Error',
      message: err.message,
    }, 502);
  }
}

// ======== Image Upload ========
async function handleUpload(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const token = formData.get('token');

    if (!file) {
      return json({ error: 'No file provided. Use field name "file".' }, 400);
    }

    if (!token) {
      return json({ error: 'No token provided. Use field name "token".' }, 400);
    }

    // Determine extension
    const fileName = file.name || 'image.png';
    const ext = fileName.split('.').pop().toLowerCase() || 'png';
    const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp'];
    
    if (!allowedExt.includes(ext)) {
      return json({ error: 'Unsupported file type: .' + ext }, 400);
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
      return json({
        error: 'GitHub upload failed',
        github: result.message || JSON.stringify(result),
      }, githubResp.status);
    }

    console.log('[Upload OK] ' + safeName);

    return json({
      success: true,
      filename: safeName,
      path: targetPath,
      url: '/Mornikar/images/wiki/' + safeName,
      size: buffer.byteLength,
      download_url: result.content && result.content.download_url,
    });

  } catch (err) {
    console.error('[Upload Error]', err);
    return json({
      error: 'Upload failed',
      message: err.message,
    }, 500);
  }
}

// ======== Helpers ========
function json(data, status = 200) {
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
