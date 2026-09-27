import type { APIRoute } from 'astro'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db/client'
import { settings } from '../lib/db/schema'
import { siteUrl } from '../lib/seo'

export const GET: APIRoute = async () => {
  const base = siteUrl(await db.select().from(settings).where(eq(settings.id, 1)).get())
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
