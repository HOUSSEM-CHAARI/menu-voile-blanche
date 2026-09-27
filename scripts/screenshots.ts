/**
 * Full-page screenshots of the public menu at the QA widths, in French and Arabic.
 * Usage: npm run screenshots -- --out screenshots/tmp/phase-2 [--base http://localhost:4321] [--locales fr,ar,en]
 */
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = new Map<string, string>()
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]
  const value = process.argv[i + 1]
  if (key?.startsWith('--') && value) args.set(key.slice(2), value)
}

const base = args.get('base') ?? 'http://localhost:4321'
const out = args.get('out') ?? 'screenshots/tmp'
const locales = (args.get('locales') ?? 'fr,ar').split(',')
const widths = (args.get('widths') ?? '360,390,768,1024,1440').split(',').map(Number)
const path = args.get('path') ?? ''

mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const problems: string[] = []

for (const locale of locales) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 })
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`${locale} ${width}: ${message.text()}`)
    })
    page.on('pageerror', (error) => problems.push(`${locale} ${width}: ${error.message}`))
    await page.goto(`${base}/${locale}${path}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    // Scroll through the page so lazy photos load before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((done) => setTimeout(done, 60))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    if (overflow) problems.push(`${locale} ${width}: horizontal scroll`)
    await page.screenshot({ path: `${out}/${locale}-${width}.png`, fullPage: true })
    await page.screenshot({ path: `${out}/${locale}-${width}-top.png` })
    await page.close()
  }
}

await browser.close()
console.log(
  problems.length ? problems.join('\n') : `✓ ${out}: no console errors, no horizontal scroll`,
)
