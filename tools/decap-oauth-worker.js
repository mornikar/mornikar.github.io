/**
 * Decap CMS GitHub OAuth Worker
 * 
 * 部署到 Cloudflare Workers，处理 Decap CMS 的 GitHub OAuth 认证流程。
 * 
 * 路由：
 *   GET /auth          → 重定向到 GitHub 授权页
 *   GET /callback      → 用 code 换 access_token，回传给 CMS
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

    // CORS headers（所有响应都带）
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

    // GET /callback — GitHub 回调，用 code 换 token
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

        // 将 token 传回 CMS 页面
        const cmsOrigin = 'https://mornikar.github.io'
        const redirectUrl = `${cmsOrigin}/admin/?access_token=${data.access_token}&scope=${data.scope}&token_type=${data.token_type}`

        return Response.redirect(redirectUrl, 301)
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
