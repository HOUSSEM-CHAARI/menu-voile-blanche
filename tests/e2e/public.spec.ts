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
