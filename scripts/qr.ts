/**
 * Writes the QR code (SVG + 2048 px PNG) and the printable A6 table card (PDF + PNG preview)
 * for the menu address saved in Settings (base URL). Output: print/
 * Usage: npm run qr        (needs Google Chrome for the PDF)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../src/lib/db/client'
import { settings } from '../src/lib/db/schema'
import { menuUrl, qrPng, qrSvg } from '../src/lib/qr'
import { siteUrl } from '../src/lib/seo'
import { tableCardHtml } from '../src/lib/table-card'

const row = await db.select().from(settings).where(eq(settings.id, 1)).get()
const url = menuUrl(siteUrl(row))
mkdirSync('print', { recursive: true })

const svg = await qrSvg(url)
writeFileSync('print/qr-menu.svg', svg)
writeFileSync('print/qr-menu.png', await qrPng(url))

const html = tableCardHtml({
  qrSvg: svg,
  url,
  fontBase: pathToFileURL(resolve('public/fonts')).href,
})
writeFileSync('print/carte-table-a6.html', html)

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ deviceScaleFactor: 3 })
await page.goto(pathToFileURL(resolve('print/carte-table-a6.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.pdf({
  path: 'print/carte-table-a6.pdf',
  width: '105mm',
  height: '148mm',
  printBackground: true,
})
await page.setViewportSize({ width: 620, height: 874 })
await page.emulateMedia({ media: 'print' })
await page.screenshot({
  path: 'print/carte-table-a6.png',
  clip: { x: 0, y: 0, width: 397, height: 559 },
  scale: 'device',
})
await browser.close()

console.log(`✓ print/: QR code (SVG, PNG) and A6 table card (PDF, PNG) for ${url}`)
if (url.includes('localhost')) {
  console.log(
    '  ⚠ The QR code points to a local address. Set the public address in the back office',
  )
  console.log('    (Réglages → Adresse du menu) or PUBLIC_BASE_URL, then run npm run qr again.')
}
