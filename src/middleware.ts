import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { constants, createBrotliCompress, createGzip } from 'node:zlib'
import { defineMiddleware } from 'astro:middleware'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

const COMPRESSIBLE = /^(text\/|application\/(json|xml|ld\+json|manifest\+json|javascript))/

/** Brotli (or gzip) for pages and text: the menu HTML shrinks about sixfold on slow connections. */
function compress(response: Response, acceptEncoding: string): Response {
  const type = response.headers.get('Content-Type') ?? ''
  if (!response.body || response.headers.has('Content-Encoding') || !COMPRESSIBLE.test(type)) {
    return response
  }
  const encoding = /\bbr\b/.test(acceptEncoding)
    ? 'br'
    : /\bgzip\b/.test(acceptEncoding)
      ? 'gzip'
      : null
  if (!encoding) return response
  const compressor =
    encoding === 'br'
      ? createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
      : createGzip({ level: 6 })
  const body = Readable.fromWeb(response.body as unknown as NodeReadableStream).pipe(compressor)
  const headers = new Headers(response.headers)
  headers.set('Content-Encoding', encoding)
  headers.delete('Content-Length')
  headers.append('Vary', 'Accept-Encoding')
  return new Response(Readable.toWeb(body) as unknown as ReadableStream, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) response.headers.set(name, value)
  }
  // Menu pages are rendered from the database on each request: never serve a stale copy.
  const type = response.headers.get('Content-Type') ?? ''
  if (type.startsWith('text/html') && !response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'no-cache')
  }
  return compress(response, context.request.headers.get('Accept-Encoding') ?? '')
})
