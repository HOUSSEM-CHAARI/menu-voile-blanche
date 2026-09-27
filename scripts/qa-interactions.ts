/**
 * Screenshots of the interactive states (detail sheet, search, filters, scroll-spy).
 * Usage: node --import tsx scripts/qa-interactions.ts [--base http://localhost:4321] [--out dir]
 */
import { mkdirSync } from 'node:fs'
import { chromium, devices } from '@playwright/test'

const arg = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? (process.argv[index + 1] ?? fallback) : fallback
}
const base = arg('base', 'http://localhost:4321')
const out = arg('out', 'screenshots/tmp/interactions')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const errors: string[] = []

for (const locale of ['fr', 'ar']) {
  const context = await browser.newContext({ ...devices['Pixel 7'] })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(`${locale}: ${error.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${locale}: ${m.text()}`))

  // Deep link opens the sheet.
  await page.goto(`${base}/${locale}#tresor-fruits-de-mer`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  console.log(
    locale,
    'deep link sheet open:',
    await page.locator('dialog[data-sheet]').evaluate((d) => (d as HTMLDialogElement).open),
  )
  await page.screenshot({ path: `${out}/${locale}-sheet-tresor.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  console.log(
    locale,
    'after Esc open:',
    await page.locator('dialog[data-sheet]').evaluate((d) => (d as HTMLDialogElement).open),
    'url:',
    page.url(),
  )

  // Tap a row, then the back button closes it.
  await page.locator('#poisson-du-jour-grille .dish-link').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/${locale}-sheet-poisson.png` })
  await page.goBack()
  await page.waitForTimeout(400)
  console.log(
    locale,
    'after back open:',
    await page.locator('dialog[data-sheet]').evaluate((d) => (d as HTMLDialogElement).open),
    'url:',
    page.url(),
  )

  // Scroll-spy.
  await page.locator('#viandes').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(600)
  console.log(
    locale,
    'active chip:',
    await page.locator('[aria-current="location"]').getAttribute('data-category-link'),
  )
  await page.screenshot({ path: `${out}/${locale}-spy.png` })

  // Search.
  await page.locator('[data-search-open]').click()
  await page.locator('[data-search-input]').fill(locale === 'ar' ? 'سلاطه' : 'creve')
  await page.waitForTimeout(400)
  console.log(locale, 'search results:', await page.locator('[data-results]').innerText())
  await page.screenshot({ path: `${out}/${locale}-search.png` })
  await page.locator('[data-search-input]').fill('')
  await page.locator('[data-filter="forTwo"]').click()
  await page.waitForTimeout(300)
  console.log(locale, 'filter forTwo:', await page.locator('[data-results]').innerText())
  await page.locator('[data-filter="forTwo"]').click()
  await page.locator('[data-search-input]').fill('zzzz')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}/${locale}-no-results.png` })
  await page.locator('[data-search-close]').click()
  console.log(
    locale,
    'visible dishes after close:',
    await page.locator('[data-dish]:visible').count(),
  )
  await context.close()
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await desktop.goto(`${base}/fr`, { waitUntil: 'networkidle' })
await desktop.locator('#poissons').scrollIntoViewIfNeeded()
await desktop.waitForTimeout(600)
await desktop.screenshot({ path: `${out}/fr-desktop-rail.png` })
await desktop.locator('#sole-meuniere .dish-link').click()
await desktop.waitForTimeout(400)
await desktop.screenshot({ path: `${out}/fr-desktop-sheet.png` })

await browser.close()
console.log(errors.length ? errors.join('\n') : 'no page errors')
