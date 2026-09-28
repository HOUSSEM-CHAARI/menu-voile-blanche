import { ImageError, MAX_UPLOAD_BYTES, type CropArea } from '../images'

export const wantsJson = (request: Request) =>
  (request.headers.get('accept') ?? '').includes('application/json')

export function json(
  ok: boolean,
  message: string,
  extra: Record<string, unknown> = {},
  status?: number,
) {
  return new Response(JSON.stringify({ ok, message, ...extra }), {
    status: status ?? (ok ? 200 : 400),
    headers: { 'Content-Type': 'application/json' },
  })
}

/** The uploaded photo, or null when none was chosen. */
export async function readUpload(form: FormData, name: string): Promise<Buffer | null> {
  const file = form.get(name)
  if (!(file instanceof File) || file.size === 0) return null
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError('La photo dépasse 10 Mo.')
  return Buffer.from(await file.arrayBuffer())
}

export function readCrop(form: FormData): CropArea | undefined {
  const values = ['cropLeft', 'cropTop', 'cropWidth', 'cropHeight'].map((key) =>
    Number(form.get(key)),
  )
  const [left, top, width, height] = values
  if (values.some((v) => !Number.isFinite(v)) || !width || !height || width < 50 || height < 50) {
    return undefined
  }
  return { left: left ?? 0, top: top ?? 0, width, height }
}
