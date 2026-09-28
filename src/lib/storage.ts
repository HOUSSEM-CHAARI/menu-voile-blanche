/**
 * Where processed photos live. Today: a local folder (UPLOAD_DIR) served under /media.
 * To go online, implement the same three functions for S3 / R2 and switch here.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { env } from './env'

export const MEDIA_PREFIX = '/media/'
const root = resolve(env.UPLOAD_DIR)

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
  const path = pathFor(key)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, data)
  return `${MEDIA_PREFIX}${key}`
}

export async function readStoredFile(key: string): Promise<Buffer | null> {
  try {
    return await readFile(pathFor(key))
  } catch {
    return null
  }
}

/** Deletes a key or a whole folder of keys (e.g. every size of one photo). */
export async function removeFiles(prefix: string): Promise<void> {
  await rm(pathFor(prefix), { recursive: true, force: true })
}
