import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  for (const locale of ['fr', 'ar', 'en']) {
    test(`menu page /${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`)
      const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
    })
  }

  test('dish sheet open', async ({ page }) => {
    await page.goto('/fr#tresor-fruits-de-mer')
    await expect(page.locator('dialog[data-sheet]')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('search open with a filter', async ({ page, isMobile }) => {
    await page.goto('/ar')
    if (isMobile) await page.locator('[data-search-open]').click()
    await page.locator('[data-filter="fish"]').click()
    await page.waitForTimeout(300) // let the chip's colour transition finish before measuring contrast
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
})

test.describe('SEO', () => {
  test('head: canonical, hreflang, Open Graph', async ({ page }) => {
    await page.goto('/ar')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/ar$/)
    for (const lang of ['fr', 'ar', 'en', 'x-default']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1)
    }
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/ar\.png$/,
    )
  })

  test('JSON-LD describes the restaurant and every dish in TND', async ({ page }) => {
    await page.goto('/fr')
    const raw = await page.locator('script[type="application/ld+json"]').textContent()
    const data = JSON.parse(raw ?? '{}')
    expect(data['@type']).toBe('Restaurant')
    expect(data.hasMenu['@type']).toBe('Menu')
    const sections = data.hasMenu.hasMenuSection
    expect(sections).toHaveLength(9)
    const items = sections.flatMap((s: { hasMenuItem: unknown[] }) => s.hasMenuItem)
    expect(items).toHaveLength(44)
    const tresor = items.find((i: { name: string }) => i.name === 'Trésor fruits de mer')
    expect(tresor.offers).toMatchObject({ price: '88.000', priceCurrency: 'TND' })
  })

  test('robots.txt blocks /admin and points to the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()
    expect(body).toContain('Disallow: /admin')
    expect(body).toMatch(/Sitemap: .*\/sitemap\.xml/)
  })

  test('sitemap lists the three languages with alternates', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    for (const lang of ['fr', 'ar', 'en']) expect(body).toContain(`/${lang}</loc>`)
    expect(body).toContain('hreflang="x-default"')
  })

  test('icons and OG images exist', async ({ request }) => {
    for (const path of [
      '/favicon.ico',
      '/favicon.svg',
      '/icons/apple-touch-icon.png',
      '/manifest.webmanifest',
      '/og/fr.png',
      '/og/ar.png',
      '/og/en.png',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200)
    }
  })
})

test.describe('performance guards', () => {
  test('French pages never download Arabic fonts, Arabic pages never download Latin ones', async ({
    page,
  }) => {
    const fonts: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/fonts/')) fonts.push(request.url())
    })
    await page.goto('/fr')
    await page.evaluate(() => document.fonts.ready)
    expect(fonts.filter((url) => url.includes('arabic'))).toEqual([])
    fonts.length = 0
    await page.goto('/ar')
    await page.evaluate(() => document.fonts.ready)
    expect(fonts.length).toBeGreaterThan(0)
    expect(fonts.filter((url) => !url.includes('arabic'))).toEqual([])
  })

  test('HTML is compressed', async ({ request }) => {
    const response = await request.get('/fr', { headers: { 'Accept-Encoding': 'br, gzip' } })
    expect(response.headers()['content-encoding']).toMatch(/br|gzip/)
  })
})
