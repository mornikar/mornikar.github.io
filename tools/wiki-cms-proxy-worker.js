/**
 * Wiki CMS 代理 Worker
 * 代理 GitHub API 请求，解决浏览器 CORS 限制
 * 同时支持文件上传（图片等）
 */
const GITHUB_API = 'https://api.github.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'wiki-cms-proxy' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Token 验证端点
    if (url.pathname === '/verify') {
      return proxyRequest(request, env, '/user', corsHeaders);
    }

    // 所有其他请求 → 代理到 GitHub API
    const ghPath = url.pathname + url.search;
    return proxyRequest(request, env, ghPath, corsHeaders);
  },
};

async function proxyRequest(request, env, path, corsHeaders) {
  const token = request.headers.get('Authorization') || '';
  
  // 构建代理 URL
  let targetUrl = GITHUB_API + path;
  
  try {
    const options = {
      method: request.method,
      headers: {},
    };

    // 复制原始请求头
    for (const [key, value] of request.entries()) {
      if (key.toLowerCase() !== 'host') {
        options.headers[key] = value;
      }
    }
    
    // 确保 Authorization 存在
    if (!options.headers['Authorization'] && !options.headers['authorization']) {
      options.headers['Authorization'] = token || ('token ' + (env.GITHUB_TOKEN || ''));
    }

    const response = await fetch(targetUrl, options);
    
    // 处理响应
    const contentType = response.headers.get('content-type') || '';
    let body;

    if (contentType.includes('application/json')) {
      body = await response.text();
    } else {
      body = await response.arrayBuffer();
    }

    // 构建响应头
    const respHeaders = { ...corsHeaders };
    if (contentType) respHeaders['Content-Type'] = contentType;
    
    // 复制一些有用的响应头
    const copyHeaders = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'etag', 'cache-control'];
    copyHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) respHeaders[h] = val;
    });

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: err.message,
      target: targetUrl,
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
