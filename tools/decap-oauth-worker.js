/**
 * Decap/Sveltia CMS GitHub OAuth Worker
 *
 * 路由：
 *   GET /auth     → 重定向到 GitHub 授权页
 *   GET /callback → 用 code 换 token，重定向回 CMS（Sveltia 格式）
 *   POST /token   → 用 code 换 token，返回 JSON（API 模式）
 *
 * 环境变量：
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

    // GET /callback — GitHub 回调，换 token 后重定向回 CMS 同源页面
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

        // 重定向到 CMS callback 页面，带上 token
        const cmsCallback = 'https://mornikar.github.io/admin/callback.html'
        const redirectUrl = cmsCallback +
          '?token=' + encodeURIComponent(data.access_token) +
          '&scope=' + encodeURIComponent(data.scope || 'repo') +
          '&token_type=' + encodeURIComponent(data.token_type || 'bearer')

        return Response.redirect(redirectUrl, 301)
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    }

    // POST /token — API 模式：直接用 code 换 token 返回 JSON
    if (url.pathname === '/token') {
      let code
      try {
        const body = await request.json()
        code = body.code
      } catch {
        code = url.searchParams.get('code')
      }

      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
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

        return new Response(JSON.stringify({
          access_token: data.access_token,
          scope: data.scope || 'repo',
          token_type: data.token_type || 'bearer',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
