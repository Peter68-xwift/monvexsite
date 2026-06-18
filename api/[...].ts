import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Dynamically import the server handler from the built dist
    const { default: handler } = await import('../dist/server/server.js') as any

    // Create the request URL
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const url = `${protocol}://${host}${req.url}`

    console.log('[v0] Handling:', req.method, req.url)

    // Create a Request object compatible with the fetch API
    const body =
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : req.body
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : undefined

    const fetchRequest = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    })

    // Call the Cloudflare Worker-style handler
    // handler has a fetch method that takes (request, env, ctx)
    const response = await handler.fetch(fetchRequest, {}, {})

    // Set response status
    res.status(response.status)

    // Copy headers
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value)
    })

    // Send body
    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error('[v0] Error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
