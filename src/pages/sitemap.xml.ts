import type { APIRoute } from 'astro'
import { eq, max } from 'drizzle-orm'
import { db } from '../lib/db/client'
import { menuItems, settings } from '../lib/db/schema'
import { alternates, siteUrl } from '../lib/seo'
import { LOCALES } from '../lib/types'

export const GET: APIRoute = async () => {
  const [settingsRow, latest] = await Promise.all([
    db.select().from(settings).where(eq(settings.id, 1)).get(),
    db
      .select({ updated: max(menuItems.updatedAt) })
      .from(menuItems)
      .get(),
  ])
  const base = siteUrl(settingsRow)
  const lastmod = (latest?.updated ?? new Date()).toISOString().slice(0, 10)
  const links = alternates(base)
    .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
    .join('\n')
  const urls = LOCALES.map(
    (locale) => `  <url>
    <loc>${base}/${locale}</loc>
    <lastmod>${lastmod}</lastmod>
${links}
  </url>`,
  ).join('\n')
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
