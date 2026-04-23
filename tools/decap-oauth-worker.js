/**
 * Decap CMS GitHub OAuth Worker
 * 
 * 部署到 Cloudflare Workers，处理 Decap CMS 的 GitHub OAuth 认证流程。
 * 
 * 路由：
 *   GET /auth          → 重定向到 GitHub 授权页
 *   GET /callback      → 用 code 换 access_token，通过 postMessage 传回 CMS
 * 
 * 环境变量（在 Cloudflare Dashboard 设置）：
 *   GITHUB_CLIENT_ID     — GitHub OAuth App 的 Client ID
 *   GITHUB_CLIENT_SECRET — GitHub OAuth App 的 Client Secret
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // GET /auth — 重定向到 GitHub 授权页
    if (url.pathname === '/auth') {
      const scope = 'repo'
      const redirectUri = `${url.origin}/callback`
      const authUrl = `${GITHUB_AUTHORIZE_URL}?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`

      return Response.redirect(authUrl, 301)
    }

    // GET /callback — GitHub 回调，用 code 换 token，通过 postMessage 传回 CMS
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')
      if (!code) {
        return new Response('Missing code parameter', { status: 400, headers: corsHeaders })
      }

      try {
        const response = await fetch(GITHUB_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code,
          }),
        })

        const data = await response.json()

        if (data.error) {
          return new Response(JSON.stringify({ error: data.error_description || data.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        // 渲染 HTML 页面，通过 postMessage 将 token 传回 CMS 父窗口
        const cmsOrigin = 'https://mornikar.github.io'
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>授权成功</title></head>
<body>
<p>正在返回管理界面...</p>
<script>
  // Decap CMS 要求的 postMessage 格式
  window.opener.postMessage(
    {
      type: 'oauth',
      provider: 'github',
      token: ${JSON.stringify(data.access_token)},
      scope: ${JSON.stringify(data.scope || 'repo')},
      token_type: ${JSON.stringify(data.token_type || 'bearer')}
    },
    ${JSON.stringify(cmsOrigin)}
  );
  // 兼容：也发送简化格式
  window.opener.postMessage(
    'authorization:github:success:' + JSON.stringify({
      token: ${JSON.stringify(data.access_token)},
      scope: ${JSON.stringify(data.scope || 'repo')},
      token_type: ${JSON.stringify(data.token_type || 'bearer')}
    }),
    '*'
  );
</script>
</body>
</html>`

        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    }

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'decap-oauth' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },
}
