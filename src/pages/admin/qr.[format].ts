import type { APIRoute } from 'astro'
import { getSettings } from '../../lib/admin/data'
import { menuUrl, qrPng, qrSvg } from '../../lib/qr'
import { siteUrl } from '../../lib/seo'

export const GET: APIRoute = async ({ params }) => {
  const url = menuUrl(siteUrl(await getSettings()))
  if (params.format === 'svg') {
    return new Response(await qrSvg(url), { headers: { 'Content-Type': 'image/svg+xml' } })
  }
  if (params.format === 'png') {
    return new Response(new Uint8Array(await qrPng(url)), {
      headers: { 'Content-Type': 'image/png' },
    })
  }
  return new Response(null, { status: 404 })
}
