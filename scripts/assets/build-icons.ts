/**
 * Generates the favicon and app-icon set and the Open Graph images from the logo.
 * Usage: npm run assets:icons   (needs Google Chrome installed, for the OG images)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { SAIL_MARKUP } from '../../src/lib/brand-sail'
import { WORDMARK } from '../../src/lib/brand-wordmark'
import { dir } from '../../src/lib/i18n'
import type { Locale } from '../../src/lib/types'

const SAIL_WHITE = '#f6f8f9'
const ABYSS = '#0d2436'
const SAND = '#c8a675'

mkdirSync('public/icons', { recursive: true })
mkdirSync('public/og', { recursive: true })

/** The sail centred in a square, `padding` as a share of the side. */
function squareSvg(
  size: number,
  padding: number,
  background: string | null,
  color: string,
): string {
  const inner = size * (1 - 2 * padding)
  const width = (inner * 96) / 120
  const x = (size - width) / 2
  const y = (size - inner) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
<svg x="${x}" y="${y}" width="${width}" height="${inner}" viewBox="0 0 96 120" color="${color}" style="color:${color}">${SAIL_MARKUP}</svg>
</svg>`
}

const png = (svg: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()

// favicon.svg follows the browser theme.
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 0 120 120"><style>svg{color:${ABYSS}}@media (prefers-color-scheme:dark){svg{color:${SAIL_WHITE}}}</style>${SAIL_MARKUP}</svg>\n`,
)

// favicon.ico with 16, 32 and 48 px PNG entries.
const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(icoSizes.map((s) => png(squareSvg(s, 0.04, null, ABYSS))))
const header = Buffer.alloc(6 + 16 * icoSizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoSizes.length, 4)
let offset = header.length
icoImages.forEach((image, index) => {
  const size = icoSizes[index] ?? 16
  const entry = 6 + index * 16
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
})
writeFileSync('public/favicon.ico', Buffer.concat([header, ...icoImages]))

writeFileSync(
  'public/icons/apple-touch-icon.png',
  await png(squareSvg(180, 0.16, SAIL_WHITE, ABYSS)),
)
writeFileSync('public/icons/icon-192.png', await png(squareSvg(192, 0.14, SAIL_WHITE, ABYSS)))
writeFileSync('public/icons/icon-512.png', await png(squareSvg(512, 0.14, SAIL_WHITE, ABYSS)))
writeFileSync('public/icons/maskable-512.png', await png(squareSvg(512, 0.26, ABYSS, SAIL_WHITE)))

writeFileSync(
  'public/manifest.webmanifest',
  `${JSON.stringify(
    {
      name: 'La Voile Blanche — Menu',
      short_name: 'Voile Blanche',
      start_url: '/',
      display: 'browser',
      background_color: SAIL_WHITE,
      theme_color: SAIL_WHITE,
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icons/maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2,
  )}\n`,
)

// Open Graph images: rendered in Chrome so the self-hosted fonts shape Arabic correctly.
const OG_LINES: Record<Locale, { title: string; line: string }> = {
  fr: { title: 'La carte', line: 'Poissons et fruits de mer, à Sfax' },
  ar: { title: 'قائمة الطعام', line: 'أسماك وغلال البحر في صفاقس' },
  en: { title: 'The menu', line: 'Fish and seafood in Sfax' },
}
const font = (file: string) => pathToFileURL(resolve('public/fonts', file)).href
const waves = `M1 5q6 -3.2 12 0${' t12 0'.repeat(27)}`
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
for (const [locale, text] of Object.entries(OG_LINES) as [
  Locale,
  { title: string; line: string },
][]) {
  await page.setContent(`<!doctype html><html lang="${locale}" dir="${dir(locale)}"><head><style>
@font-face{font-family:Newsreader;src:url(${font('newsreader-400.woff2')})}
@font-face{font-family:'Voile Sans';src:url(${font('voile-sans-400.woff2')})}
@font-face{font-family:Naskh;src:url(${font('noto-naskh-arabic-700.woff2')})}
@font-face{font-family:'Voile Sans Arabic';src:url(${font('voile-sans-arabic-400.woff2')})}
body{margin:0;width:1200px;height:630px;background:${SAIL_WHITE};color:${ABYSS};display:grid;place-items:center;
  font-family:${locale === 'ar' ? "'Voile Sans Arabic'" : "'Voile Sans'"},sans-serif}
main{display:grid;justify-items:center;gap:26px;text-align:center}
.sail{width:150px;height:188px}.mark{width:520px;height:${Math.round((520 * WORDMARK.height) / WORDMARK.width)}px;direction:ltr}
h1{margin:10px 0 0;font:400 64px/1.1 ${locale === 'ar' ? 'Naskh' : 'Newsreader'},serif}
p{margin:0;font-size:32px;color:#4b6275}
.frame{position:absolute;inset:28px;border:2px solid ${SAND};border-radius:6px}
</style></head><body><div class="frame"></div><main>
<svg class="sail" viewBox="0 0 96 120">${SAIL_MARKUP}</svg>
<svg class="mark" viewBox="${WORDMARK.viewBox}"><path fill="currentColor" d="${WORDMARK.d}"/></svg>
<svg width="340" height="12" viewBox="0 0 338 10"><path d="${waves}" fill="none" stroke="${ABYSS}" stroke-width="2" stroke-linecap="round"/></svg>
<h1>${text.title}</h1><p>${text.line}</p></main></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `public/og/${locale}.png` })
}
await browser.close()
console.log('✓ favicons, app icons, manifest and OG images written')
