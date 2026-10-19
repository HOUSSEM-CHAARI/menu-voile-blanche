import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const put = vi.fn()

vi.mock('@vercel/blob', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, put, get: vi.fn(), list: vi.fn(), del: vi.fn() }
})

/** Fresh modules for each test: the store's access mode is remembered per process. */
async function load(env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  const storage = await import('./storage')
  const blob = await import('@vercel/blob')
  return { ...storage, BlobError: blob.BlobError }
}

const accessOf = (call: unknown[] | undefined) => (call?.[2] as { access?: string })?.access

beforeEach(() => put.mockReset())
afterEach(() => vi.unstubAllEnvs())

describe('putFile with Vercel Blob', () => {
  it('stores public files under their CDN URL', async () => {
    put.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/abc/160.jpg' })
    const { putFile } = await load({ BLOB_READ_WRITE_TOKEN: 'token' })
    await expect(putFile('abc/160.jpg', Buffer.from('x'))).resolves.toBe(
      'https://store.public.blob.vercel-storage.com/abc/160.jpg',
    )
    expect(accessOf(put.mock.calls[0])).toBe('public')
  })

  it('switches to private access when the store refuses public files', async () => {
    const { putFile, BlobError } = await load({ BLOB_READ_WRITE_TOKEN: 'token' })
    put.mockImplementation((...args: unknown[]) =>
      accessOf(args) === 'public'
        ? Promise.reject(new BlobError('Cannot use public access on a private store'))
        : Promise.resolve({ url: 'https://store.private.blob.vercel-storage.com/abc/160.jpg' }),
    )
    await expect(putFile('abc/160.jpg', Buffer.from('x'))).resolves.toBe('/media/abc/160.jpg')
    // Remembered: the next file goes straight to private.
    await putFile('abc/320.jpg', Buffer.from('x'))
    expect(put.mock.calls.map(accessOf)).toEqual(['public', 'private', 'private'])
  })

  it('uses a store connected by id (OIDC) without a read-write token', async () => {
    put.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/abc/160.jpg' })
    const { putFile } = await load({
      VERCEL: '1',
      BLOB_STORE_ID: 'store_abc',
      BLOB_ACCESS: 'private',
    })
    await expect(putFile('abc/160.jpg', Buffer.from('x'))).resolves.toBe('/media/abc/160.jpg')
    expect(put.mock.calls.map(accessOf)).toEqual(['private'])
  })

  it('explains the missing Blob store on Vercel instead of writing to a read-only disk', async () => {
    const { putFile, StorageError } = await load({ VERCEL: '1' })
    await expect(putFile('abc/160.jpg', Buffer.from('x'))).rejects.toBeInstanceOf(StorageError)
    expect(put).not.toHaveBeenCalled()
  })
})
