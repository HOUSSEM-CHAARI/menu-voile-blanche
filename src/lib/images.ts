/**
 * Image pipeline, used for seeded photos and back-office uploads alike:
 * auto-orient, crop to the display ratio, strip metadata, then write AVIF, WebP and JPEG
 * at several widths plus a tiny blurred placeholder (LQIP).
 */
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { putFile, removeFiles } from './storage'
import type { ImageMeta, ImageVariant } from './types'

export type ImageKind = 'dish' | 'cover'

const SPECS: Record<ImageKind, { ratio: number; widths: number[] }> = {
  dish: { ratio: 4 / 3, widths: [160, 320, 640, 960, 1280] },
  cover: { ratio: 16 / 9, widths: [640, 960, 1280, 1600] },
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif'])

export class ImageError extends Error {}

export interface CropArea {
  left: number
  top: number
  width: number
  height: number
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
    throw new ImageError('Format non pris en charge : utilisez une photo JPEG, PNG, WebP ou HEIC.')
  }

  const spec = SPECS[kind]
  const oriented = await sharp(input, { failOn: 'error' })
    .rotate()
    .toBuffer({ resolveWithObject: true })
  const source = oriented.info
  const maxWidth = spec.widths.at(-1) ?? 1280

  let pipeline = sharp(oriented.data)
  if (crop) {
    pipeline = pipeline.extract({
      left: Math.max(0, Math.round(crop.left)),
      top: Math.max(0, Math.round(crop.top)),
      width: Math.min(source.width, Math.round(crop.width)),
      height: Math.min(source.height, Math.round(crop.height)),
    })
  }
  const targetWidth = Math.min(maxWidth, crop ? Math.round(crop.width) : source.width)
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

  for (const width of widths) {
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
    meta.avif.push(await variant(avif, 'avif'))
    meta.webp.push(await variant(webp, 'webp'))
    meta.jpg.push(await variant(jpg, 'jpg'))
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
