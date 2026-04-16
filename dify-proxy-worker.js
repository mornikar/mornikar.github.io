/**
 * Dify API Proxy Worker - 使用直连 IP
 */

const DIFY_IP = '59.41.69.9'
const DIFY_PORT = '8088'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    // 只代理 /v1/* 路径
    if (!url.pathname.startsWith('/v1')) {
      return new Response('Not Found', { status: 404 })
    }

    // 构建目标 URL（直连 IP）
    const targetUrl = `http://${DIFY_IP}:${DIFY_PORT}${url.pathname}${url.search}`

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    try {
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

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        return new Response(response.body, {
          status: response.status,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Accel-Buffering': 'no',
          }
        })
      }

      const text = await response.text()
      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Proxy error: ' + error.message,
        target: targetUrl
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
  }
}
