import { expect, test } from '@playwright/test'

test.describe('public menu', () => {
  test('opens in French at / with every dish', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('[data-dish]')).toHaveCount(44)
  })

  test('Arabic page is right-to-left', async ({ page }) => {
    await page.goto('/ar')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('English page falls back to French text, never empty', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    const names = await page.locator('[data-dish-name]').allInnerTexts()
    expect(names.every((name) => name.trim().length > 0)).toBe(true)
  })

  test('prices are never shown in the ambiguous printed format', async ({ page }) => {
    await page.goto('/fr')
    const body = await page.locator('main').innerText()
    expect(body).not.toMatch(/\d{1,3},000/)
    await expect(page.locator('#tresor-fruits-de-mer [data-price]').first()).toHaveText(/88\sDT/)
    await expect(page.locator('#poisson-du-jour-grille [data-price]').first()).toHaveText(
      /14\sDT\s\/\s100\sg/,
    )
  })

  test('unknown language returns 404', async ({ page }) => {
    const response = await page.goto('/de')
    expect(response?.status()).toBe(404)
  })

  test('the remembered language is used on /', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'vb_lang', value: 'ar', url: baseURL ?? '' }])
    await page.goto('/')
    await expect(page).toHaveURL(/\/ar$/)
  })
})

test.describe('menu experience', () => {
  test('a deep link opens the dish sheet, Esc closes it and clears the hash', async ({ page }) => {
    await page.goto('/fr#tresor-fruits-de-mer')
    const sheet = page.locator('dialog[data-sheet]')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Trésor fruits de mer')
    await expect(sheet).toContainText('Spaghetti aux fruits de mer')
    await expect(sheet).toContainText('Pour 2 personnes')
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(page).toHaveURL(/\/fr$/)
  })

  test('the back button closes the sheet', async ({ page }) => {
    await page.goto('/fr')
    await page.locator('#oeufs-de-seiche-sautes-ou-panes .dish-link').click()
    const sheet = page.locator('dialog[data-sheet]')
    await expect(sheet).toContainText('Panés')
    await expect(page).toHaveURL(/#oeufs-de-seiche-sautes-ou-panes$/)
    await page.goBack()
    await expect(sheet).toBeHidden()
  })

  test('poisson du jour explains the price per 100 g', async ({ page }) => {
    await page.goto('/fr#poisson-du-jour-grille')
    const sheet = page.locator('dialog[data-sheet]')
    await expect(sheet).toContainText('14 DT / 100 g')
    await expect(sheet).toContainText('pesé')
    await expect(sheet).toContainText('Tchich au poulpe')
    for (const species of ['Loup', 'Dorade', 'Rouget', 'Mulet', 'Sargue', 'Serre']) {
      await expect(sheet).toContainText(species)
    }
  })

  test('search is accent-insensitive in French', async ({ page, isMobile }) => {
    await page.goto('/fr')
    if (isMobile) await page.locator('[data-search-open]').click()
    await page.locator('[data-search-input]').fill('oeufs') // œufs de seiche, both Royale dishes and the ojja
    await expect(page.locator('[data-dish]:visible')).toHaveCount(4)
    await page.locator('[data-search-input]').fill('mechouia')
    await expect(page.locator('[data-dish]:visible')).toHaveCount(1)
  })

  test('search normalises Arabic', async ({ page, isMobile }) => {
    await page.goto('/ar')
    if (isMobile) await page.locator('[data-search-open]').click()
    await page.locator('[data-search-input]').fill('اسكالوب')
    await expect(page.locator('[data-dish]:visible')).toHaveCount(4)
  })

  test('the "for 2" filter keeps only dishes for two', async ({ page, isMobile }) => {
    await page.goto('/fr')
    if (isMobile) await page.locator('[data-search-open]').click()
    await page.locator('[data-filter="forTwo"]').click()
    await expect(page.locator('[data-dish]:visible')).toHaveCount(1)
    await expect(page.locator('[data-results]')).toHaveText('1 plat')
  })
})
