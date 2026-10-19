/**
 * Processed photos live in a local folder during development and in Vercel Blob
 * in production (a serverless function's disk is read-only).
 *  - Public Blob store: files get immutable public CDN URLs, stored directly in the menu records.
 *  - Private Blob store: files are served through /media by this app.
 * The store's access is read from BLOB_ACCESS, or detected on the first upload.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import {
  BlobRequestAbortedError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  del,
  get,
  list,
  put,
  type BlobAccessType,
} from '@vercel/blob'
import { env } from './env'

export const MEDIA_PREFIX = '/media/'
const root = resolve(env.UPLOAD_DIR)
// Older stores give a read-write token; newer ones give a store id and Vercel signs requests
// itself (OIDC). The SDK reads either from the environment.
const useBlob = Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID)
let access: BlobAccessType | undefined = env.BLOB_ACCESS

/** Thrown when photos cannot be stored at all: the message is meant for the owner. */
export class StorageError extends Error {}

/** Resolves a storage key inside UPLOAD_DIR, refusing anything that escapes it. */
function pathFor(key: string): string {
  if (!/^[a-z0-9][a-z0-9/._-]*$/i.test(key) || key.includes('..')) {
    throw new Error(`Invalid storage key: ${key}`)
  }
  const path = resolve(root, key)
  if (!path.startsWith(root + sep)) throw new Error(`Invalid storage key: ${key}`)
  return path
}

async function putBlob(key: string, data: Buffer, mode: BlobAccessType): Promise<string> {
  const blob = await put(key, data, {
    access: mode,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 31_536_000,
  })
  return mode === 'public' ? blob.url : `${MEDIA_PREFIX}${key}`
}

export async function putFile(key: string, data: Buffer): Promise<string> {
  if (useBlob) {
    if (access) return putBlob(key, data, access)
    // Unknown store type: try public, and switch to private if the store refuses it.
    try {
      const url = await putBlob(key, data, 'public')
      access = 'public'
      return url
    } catch (error) {
      const transient =
        error instanceof BlobServiceNotAvailable ||
        error instanceof BlobServiceRateLimited ||
        error instanceof BlobRequestAbortedError
      if (transient) throw error
      try {
        const url = await putBlob(key, data, 'private')
        access = 'private'
        console.warn('[storage] The Blob store refused public files: using private access.')
        return url
      } catch {
        // Not an access problem: report what the public upload said.
        throw error
      }
    }
  }
  if (process.env.VERCEL) {
    throw new StorageError(
      'Stockage des photos non configuré sur Vercel : connectez un Blob store au projet ' +
        '(Storage → Blob) pour que BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN existe, puis redéployez.',
    )
  }
  const path = pathFor(key)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, data)
  return `${MEDIA_PREFIX}${key}`
}

export async function readStoredFile(key: string): Promise<Buffer | null> {
  if (useBlob) {
    // Public Blob files are read by browsers directly; private ones are proxied here.
    pathFor(key)
    for (const mode of access ? [access] : (['private', 'public'] as const)) {
      try {
        const result = await get(key, { access: mode })
        if (result?.statusCode === 200) {
          return Buffer.from(await new Response(result.stream).arrayBuffer())
        }
      } catch {
        // Try the other access mode, then give up (404).
      }
    }
    return null
  }
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
