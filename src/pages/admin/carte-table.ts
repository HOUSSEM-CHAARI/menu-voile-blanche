import type { APIRoute } from 'astro'
import { getSettings } from '../../lib/admin/data'
import { menuUrl, qrSvg } from '../../lib/qr'
import { siteUrl } from '../../lib/seo'
import { tableCardHtml } from '../../lib/table-card'

/** Printable A6 table card: open, then File → Print (A6, no margins) or save as PDF. */
export const GET: APIRoute = async () => {
  const url = menuUrl(siteUrl(await getSettings()))
  const html = tableCardHtml({ qrSvg: await qrSvg(url), url, fontBase: '/fonts' })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
