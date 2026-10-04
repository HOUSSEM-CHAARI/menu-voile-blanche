/**
 * Processed photos live in a local folder during development and in Vercel Blob
 * in production. Blob URLs are immutable public CDN URLs, so they can be stored
 * directly in the menu records and never depend on a serverless function disk.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { del, list, put } from '@vercel/blob'
import { env } from './env'

export const MEDIA_PREFIX = '/media/'
const root = resolve(env.UPLOAD_DIR)
const useBlob = Boolean(env.BLOB_READ_WRITE_TOKEN)

/** Resolves a storage key inside UPLOAD_DIR, refusing anything that escapes it. */
function pathFor(key: string): string {
  if (!/^[a-z0-9][a-z0-9/._-]*$/i.test(key) || key.includes('..')) {
    throw new Error(`Invalid storage key: ${key}`)
  }
  const path = resolve(root, key)
  if (!path.startsWith(root + sep)) throw new Error(`Invalid storage key: ${key}`)
  return path
}

export async function putFile(key: string, data: Buffer): Promise<string> {
  if (useBlob) {
    const blob = await put(key, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
    })
    return blob.url
  }
  const path = pathFor(key)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, data)
  return `${MEDIA_PREFIX}${key}`
}

export async function readStoredFile(key: string): Promise<Buffer | null> {
  // Public Blob files are read by browsers directly, never proxied through /media.
  if (useBlob) return null
  try {
    return await readFile(pathFor(key))
  } catch {
    return null
  }
}

/** Deletes a key or a whole folder of keys (e.g. every size of one photo). */
export async function removeFiles(prefix: string): Promise<void> {
  if (useBlob) {
    let cursor: string | undefined
    do {
      const page = await list({ prefix: `${prefix}/`, ...(cursor ? { cursor } : {}) })
      if (page.blobs.length) await del(page.blobs.map((blob) => blob.url))
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    return
  }
  await rm(pathFor(prefix), { recursive: true, force: true })
}
