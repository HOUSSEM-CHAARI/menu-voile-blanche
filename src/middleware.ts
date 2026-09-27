import { defineMiddleware } from 'astro:middleware'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next()
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) response.headers.set(name, value)
  }
  // Menu pages are rendered from the database on each request: never serve a stale copy.
  const type = response.headers.get('Content-Type') ?? ''
  if (type.startsWith('text/html') && !response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'no-cache')
  }
  return response
})
