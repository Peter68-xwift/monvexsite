import type { VercelRequest, VercelResponse } from '@vercel/node'

let server: any

async function getServer() {
  if (!server) {
    try {
      // Dynamically import the built server
      const mod = await import('../dist/server/server.js')
      server = mod.default
    } catch (error) {
      console.error('[v0] Failed to import server:', error)
      throw error
    }
  }
  return server
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const handler = await getServer()

    // Construct the full URL
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const url = `${protocol}://${host}${req.url}`

    // Create a fetch-compatible request
    const fetchRequest = new Request(url, {
      method: req.method,
      headers: {
        ...req.headers,
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip || '',
      },
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : JSON.stringify(req.body),
    })

    console.log('[v0] Handling request:', req.method, req.url)

    // Call the server handler
    const response = await handler.fetch(fetchRequest)

    console.log('[v0] Server responded with status:', response.status)

    // Set response status and headers
    res.status(response.status)

    // Forward headers from the server response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value)
      }
    })

    // Send the body
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('[v0] Error in API handler:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
