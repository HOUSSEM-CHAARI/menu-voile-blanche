import type { APIRoute } from 'astro'
import { readStoredFile } from '../../lib/storage'

const TYPES: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
}

/** Serves processed photos from UPLOAD_DIR. File names contain a content hash: cache forever. */
export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? ''
  const type = TYPES[path.split('.').pop() ?? '']
  if (!type || !/^[a-f0-9]{16}\/\d+\.[a-z]+$/.test(path)) return new Response(null, { status: 404 })
  const data = await readStoredFile(path)
  if (!data) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
