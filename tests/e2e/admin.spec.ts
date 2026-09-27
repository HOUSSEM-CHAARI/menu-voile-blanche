import { expect, test, type Page } from '@playwright/test'

// Credentials of the test database (see playwright.config.ts).
const USER = 'test-admin'
const PASSWORD = 'test-password-2026'

test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Identifiant').fill(USER)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

// Accept every confirm() dialog (deletions, unusual prices).
test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept())
})

test.describe('access', () => {
  test('the back office is refused without a session', async ({ page, request }) => {
    await page.goto('/admin/plats')
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fplats/)
    const response = await request.post('/admin/plats', {
      form: { id: '1', action: 'availability', value: 'false' },
    })
    expect([401, 403]).toContain(response.status())
    const json = await request.get('/admin/sauvegarde/menu.json', { maxRedirects: 0 })
    expect(json.status()).toBe(302)
  })

  test('wrong password is rejected, then login and logout work', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Identifiant').fill(USER)
    await page.getByLabel('Mot de passe').fill('wrong-password')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByRole('alert')).toContainText('incorrect')
    await login(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(USER)
    await page.getByRole('button', { name: 'Déconnexion' }).click()
    await expect(page).toHaveURL(/\/admin\/login$/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('a write without the CSRF token is refused', async ({ page }) => {
    await login(page)
    const status = await page.evaluate(async () => {
      const body = new URLSearchParams({ id: '1', action: 'availability', value: 'false' })
      const response = await fetch('/admin/plats', { method: 'POST', body })
      return response.status
    })
    expect(status).toBe(403)
  })
})

test.describe('categories', () => {
  test('create, edit, reorder and delete a category', async ({ page }) => {
    await login(page)
    await page.goto('/admin/categories/nouvelle')
    await page.locator('#nameFr').fill('Plats du marché')
    await page.locator('#nameAr').fill('أطباق السوق')
    await page.getByRole('button', { name: 'Créer la catégorie' }).click()
    await expect(page.locator('[data-toast]')).toContainText('Catégorie créée')
    const row = page.locator('.row', { hasText: 'Plats du marché' })
    await expect(row).toBeVisible()

    // Reorder with the keyboard-friendly buttons: it moves up one place.
    const before = await page.locator('.row .row-title').allInnerTexts()
    await row.getByRole('button', { name: 'Monter Plats du marché' }).click()
    const after = await page.locator('.row .row-title').allInnerTexts()
    expect(after.indexOf('Plats du marché')).toBe(before.indexOf('Plats du marché') - 1)

    // Edit.
    await page.getByRole('link', { name: 'Plats du marché' }).click()
    await page.locator('#nameEn').fill('Market dishes')
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await expect(page.locator('[data-toast]')).toContainText('Catégorie enregistrée')
    await expect(page.locator('#nameEn')).toHaveValue('Market dishes')

    // Delete (it is empty).
    await page.getByRole('button', { name: 'Supprimer la catégorie' }).click()
    await expect(page.locator('[data-toast]')).toContainText('Catégorie supprimée')
    await expect(page.locator('.row', { hasText: 'Plats du marché' })).toHaveCount(0)
  })

  test('deleting a category that still has dishes is blocked', async ({ page }) => {
    await login(page)
    await page.goto('/admin/categories')
    await page.getByRole('link', { name: 'Boissons' }).click()
    await expect(page.locator('#moveTo')).toBeVisible()
    await expect(page.locator('#moveTo')).toHaveAttribute('required', '')
  })
})

test.describe('dishes', () => {
  test('create, edit, duplicate, mark sold out, delete and restore a dish', async ({ page }) => {
    await login(page)
    await page.goto('/admin/plats/nouveau')
    await page.locator('#nameFr').fill('Loup en croûte de sel')
    await page.locator('#nameAr').fill('قاروص في الملح')
    await page.locator('#price').fill('39,500')
    await expect(page.locator('#price-preview')).toHaveText('Affiché : 39,500 DT')
    await page.locator('#categoryId').selectOption({ label: 'Poissons' })
    await page.getByRole('button', { name: 'Enregistrer le plat' }).click()
    await expect(page.locator('[data-toast]')).toContainText('Plat enregistré')
    const editUrl = page.url()

    await page.goto('/fr')
    await expect(page.locator('#loup-en-croute-de-sel [data-price]')).toHaveText(/39,500\sDT/)

    // Edit the description.
    await page.goto(editUrl)
    await page.locator('#descriptionFr').fill('Loup cuit au four sous une croûte de sel.')
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await expect(page.locator('#descriptionFr')).toHaveValue(
      'Loup cuit au four sous une croûte de sel.',
    )

    // Duplicate: the copy starts hidden.
    await page.getByRole('button', { name: 'Dupliquer' }).click()
    await expect(page.locator('h1')).toHaveText('Loup en croûte de sel (copie)')
    await expect(page.getByLabel('Visible sur le menu')).not.toBeChecked()
    await page.getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.locator('[data-toast]')).toContainText('corbeille')

    // One tap: sold out, visible as such on the public menu.
    await page.goto('/admin/plats?q=loup+en+croute')
    const toggle = page.getByRole('button', { name: 'Disponibilité de Loup en croûte de sel' })
    await toggle.click()
    await expect(toggle).toHaveText('Épuisé')
    await page.goto('/ar')
    await expect(page.locator('#loup-en-croute-de-sel')).toContainText('نفذ')

    // Delete, restore, then delete for good (keeps the test database at 44 dishes).
    await page.goto(editUrl)
    await page.getByRole('button', { name: 'Supprimer' }).click()
    await page.goto('/fr')
    await expect(page.locator('#loup-en-croute-de-sel')).toHaveCount(0)
    await page.goto('/admin/corbeille')
    const trashed = page.locator('.row', { hasText: 'Loup en croûte de sel' }).first()
    await trashed.getByRole('button', { name: 'Restaurer' }).click()
    await expect(page.locator('[data-toast]')).toContainText('Plat restauré')
    await page.goto('/fr')
    await expect(page.locator('#loup-en-croute-de-sel')).toHaveCount(1)

    await page.goto(editUrl)
    await page.getByRole('button', { name: 'Supprimer' }).click()
    await page.goto('/admin/corbeille')
    for (const name of ['Loup en croûte de sel (copie)', 'Loup en croûte de sel']) {
      await page
        .locator('.row', { has: page.getByText(name, { exact: true }) })
        .getByRole('button', { name: 'Supprimer définitivement' })
        .click()
    }
    await expect(page.locator('.row')).toHaveCount(0)
  })

  test('a price change appears at once on the menu in all three languages', async ({ page }) => {
    await login(page)
    await page.goto('/admin/plats?q=brik+au+thon')
    await page.getByRole('link', { name: 'Brik au thon' }).click()
    const editUrl = page.url()
    await page.locator('#price').fill('6.500')
    await expect(page.locator('#price-preview')).toHaveText('Affiché : 6,500 DT')
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await expect(page.locator('[data-toast]')).toContainText('Plat enregistré')

    for (const [locale, text] of [
      ['fr', /6,500\sDT/],
      ['en', /6,500\sDT/],
      ['ar', /6,500\sد\.ت/],
    ] as const) {
      await page.goto(`/${locale}`)
      await expect(page.locator('#brik-au-thon [data-price]')).toHaveText(text)
    }

    // The history shows old → new price.
    await page.goto(editUrl)
    await expect(page.locator('.history-change').first()).toContainText('6 DT')
    await expect(page.locator('.history-change').first()).toContainText('6,500 DT')

    // Tunisian notation "6,000" means 6 dinars: restore the original price.
    await page.locator('#price').fill('6,000')
    await expect(page.locator('#price-preview')).toHaveText('Affiché : 6 DT')
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await page.goto('/fr')
    await expect(page.locator('#brik-au-thon [data-price]')).toHaveText(/^6\sDT$/)
  })

  test('invalid input is rejected with a clear message', async ({ page }) => {
    await login(page)
    await page.goto('/admin/plats/nouveau')
    await page.locator('#nameFr').fill('Test')
    await page.locator('#price').fill('douze')
    await page.getByRole('button', { name: 'Enregistrer le plat' }).click()
    await expect(page.getByRole('alert')).toContainText('Prix invalide')
  })
})

test.describe('settings and backup', () => {
  test('settings, QR code and exports are available', async ({ page, request }) => {
    await login(page)
    await page.goto('/admin/reglages')
    await expect(page.locator('.tag--warn').first()).toContainText('à confirmer')
    const cookies = await page.context().cookies()
    const headers = { Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') }
    const svg = await request.get('/admin/qr.svg', { headers })
    expect(svg.headers()['content-type']).toContain('image/svg+xml')
    const backup = await request.get('/admin/sauvegarde/menu.json', { headers })
    const data = await backup.json()
    expect(data.items).toHaveLength(44)
    const csv = await request.get('/admin/sauvegarde/plats.csv', { headers })
    expect(await csv.text()).toContain('Brik au thon')
  })

  test('a JSON backup can be imported after a preview', async ({ page }) => {
    await login(page)
    const exported = await page.evaluate(async () =>
      (await fetch('/admin/sauvegarde/menu.json')).text(),
    )
    const data = JSON.parse(exported)
    const brik = data.items.find((item: { slug: string }) => item.slug === 'brik-au-thon')
    brik.price = 7000
    await page.goto('/admin/sauvegarde')
    await page.locator('#file').setInputFiles({
      name: 'menu.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(data)),
    })
    await page.getByRole('button', { name: 'Voir l’aperçu' }).click()
    await expect(page.getByText('Brik au thon : 6 DT → 7 DT')).toBeVisible()
    await page.getByRole('button', { name: 'Confirmer et remplacer le menu' }).click()
    await expect(page.locator('[data-toast]')).toContainText('Sauvegarde importée')
    await page.goto('/fr')
    await expect(page.locator('#brik-au-thon [data-price]')).toHaveText(/7\sDT/)
    await expect(page.locator('[data-dish]')).toHaveCount(44)

    // Put the original back.
    await page.goto('/admin/sauvegarde')
    await page.locator('#file').setInputFiles({
      name: 'menu.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exported),
    })
    await page.getByRole('button', { name: 'Voir l’aperçu' }).click()
    await page.getByRole('button', { name: 'Confirmer et remplacer le menu' }).click()
    await page.goto('/fr')
    await expect(page.locator('#brik-au-thon [data-price]')).toHaveText(/^6\sDT$/)
  })
})
