/**
 * Image pipeline, used for seeded photos and back-office uploads alike:
 * auto-orient, crop to the display ratio, strip metadata, then write AVIF, WebP and JPEG
 * at several widths plus a tiny blurred placeholder (LQIP).
 */
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { clampCrop, type CropArea } from './crop'
import { putFile, removeFiles, StorageError } from './storage'
import type { ImageMeta, ImageVariant } from './types'

export type ImageKind = 'dish' | 'cover'

const SPECS: Record<ImageKind, { ratio: number; widths: number[] }> = {
  dish: { ratio: 4 / 3, widths: [160, 320, 480, 640, 960, 1280] },
  cover: { ratio: 16 / 9, widths: [640, 960, 1280, 1600] },
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif'])

export class ImageError extends Error {}

export type { CropArea }

/** Message for the owner; unexpected failures are logged so they can be diagnosed. */
export function photoErrorMessage(error: unknown): string {
  if (error instanceof ImageError) return error.message
  console.error('[photo]', error)
  if (error instanceof StorageError) return error.message
  // The technical cause is shown too (back office only): it is what a developer needs.
  const detail = error instanceof Error ? error.message.slice(0, 200) : String(error)
  return `La photo n’a pas pu être enregistrée. Choisissez-la à nouveau ou essayez une autre photo (JPEG ou PNG). Détail : ${detail}`
}

export async function processImage(
  input: Buffer,
  kind: ImageKind,
  crop?: CropArea,
): Promise<ImageMeta> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new ImageError('La photo dépasse 10 Mo.')
  // The file type is read from the content, never trusted from the upload.
  const metadata = await sharp(input)
    .metadata()
    .catch(() => null)
  if (!metadata?.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new ImageError('Format non pris en charge : utilisez une photo JPEG, PNG ou WebP.')
  }

  const spec = SPECS[kind]
  const oriented = await sharp(input, { failOn: 'error' })
    .rotate()
    .toBuffer({ resolveWithObject: true })
  const source = oriented.info
  const maxWidth = spec.widths.at(-1) ?? 1280

  let pipeline = sharp(oriented.data)
  const area = crop ? clampCrop(crop, source.width, source.height) : undefined
  if (area) pipeline = pipeline.extract(area)
  const targetWidth = Math.min(maxWidth, area ? area.width : source.width)
  const master = await pipeline
    .resize({
      width: targetWidth,
      height: Math.round(targetWidth / spec.ratio),
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .toBuffer({ resolveWithObject: true })

  const key = createHash('sha256')
    .update(input)
    .update(kind)
    .update(JSON.stringify(crop ?? null))
    .digest('hex')
    .slice(0, 16)

  const widths = spec.widths.filter((width) => width <= master.info.width)
  if (widths.length === 0) widths.push(master.info.width)

  const meta: ImageMeta = {
    key,
    width: master.info.width,
    height: master.info.height,
    lqip: '',
    avif: [],
    webp: [],
    jpg: [],
  }

  // Every size is encoded and stored in parallel: on a serverless host the uploads, not the
  // encoding, take most of the time.
  const sizes = await Promise.all(
    widths.map(async (width) => {
      const resized = sharp(master.data).resize({ width })
      const [avif, webp, jpg] = await Promise.all([
        resized.clone().avif({ quality: 52, effort: 4 }).toBuffer(),
        resized.clone().webp({ quality: 74 }).toBuffer(),
        resized.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer(),
      ])
      const variant = async (buffer: Buffer, ext: string): Promise<ImageVariant> => ({
        width,
        src: await putFile(`${key}/${width}.${ext}`, buffer),
      })
      return Promise.all([variant(avif, 'avif'), variant(webp, 'webp'), variant(jpg, 'jpg')])
    }),
  )
  for (const [avif, webp, jpg] of sizes) {
    meta.avif.push(avif)
    meta.webp.push(webp)
    meta.jpg.push(jpg)
  }

  const tiny = await sharp(master.data)
    .resize({ width: 16 })
    .blur(0.6)
    .webp({ quality: 40 })
    .toBuffer()
  meta.lqip = `data:image/webp;base64,${tiny.toString('base64')}`
  return meta
}

/** Removes every stored size of a photo (used when a photo is replaced or deleted). */
export async function deleteImage(meta: ImageMeta | null | undefined): Promise<void> {
  if (meta?.key && /^[a-f0-9]{16}$/.test(meta.key)) await removeFiles(meta.key)
}
