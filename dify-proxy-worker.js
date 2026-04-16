const DIFY_IP = '59.41.69.9'
const DIFY_PORT = '8088'
// 简单验证：如果请求带了正确的 key 才转发
const VALID_KEY = 'mornikar-wiki-secret-2026'

export default {
  async fetch(request) {
    const url = new URL(request.url)

    // 预检请求（CORS）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wiki-key',
        }
      })
    }

    if (!url.pathname.startsWith('/v1')) {
      return new Response('Not Found', { status: 404 })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // 验证 x-wiki-key header
    const wikiKey = request.headers.get('x-wiki-key')
    if (wikiKey !== VALID_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    try {
      const targetUrl = `http://${DIFY_IP}:${DIFY_PORT}${url.pathname}${url.search}`
      const headers = {}
      const auth = request.headers.get('Authorization')
      if (auth) headers['Authorization'] = auth
      headers['Content-Type'] = 'application/json'
      const body = await request.text()

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: body,
        duplex: 'half',
      })

      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        return new Response(response.body, {
          status: response.status,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wiki-key',
            'X-Accel-Buffering': 'no',
          }
        })
      }

      return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Proxy error: ' + error.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
  }
}
