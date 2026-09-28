import { eq, isNull } from 'drizzle-orm'
import { expectedCounts, verifiedItems } from '../../data/menu.verified'
import { db } from '../../src/lib/db/client'
import { categories, menuItems } from '../../src/lib/db/schema'
import { formatPrice } from '../../src/lib/price'
import { slugify } from '../../src/lib/slug'

/** Compares the database with the verified photo data and returns every mismatch. */
export async function verify(): Promise<string[]> {
  const rows = await db
    .select({
      slug: menuItems.slug,
      price: menuItems.price,
      priceUnit: menuItems.priceUnit,
      category: categories.slug,
    })
    .from(menuItems)
    .innerJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(isNull(menuItems.deletedAt))

  const problems: string[] = []
  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.category, (counts.get(row.category) ?? 0) + 1)

  for (const [category, expected] of Object.entries(expectedCounts)) {
    const actual = counts.get(category) ?? 0
    if (actual !== expected) {
      problems.push(`Catégorie ${category} : ${actual} plats, attendu ${expected}`)
    }
  }
  for (const category of counts.keys()) {
    if (!(category in expectedCounts)) problems.push(`Catégorie inattendue : ${category}`)
  }

  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  for (const item of verifiedItems) {
    const row = bySlug.get(slugify(item.name.fr))
    const unit = item.priceUnit ?? 'item'
    if (!row) {
      problems.push(`Plat manquant : ${item.name.fr}`)
    } else if (row.price !== item.price || row.priceUnit !== unit) {
      const actual = formatPrice(row.price, 'fr', row.priceUnit)
      const expected = formatPrice(item.price, 'fr', unit)
      problems.push(`Prix différent pour ${item.name.fr} : ${actual}, attendu ${expected}`)
    } else if (row.category !== item.category) {
      problems.push(`${item.name.fr} est dans ${row.category}, attendu ${item.category}`)
    }
  }

  const total = Object.values(expectedCounts).reduce((sum, n) => sum + n, 0)
  if (verifiedItems.length !== total) {
    problems.push(`Données vérifiées : ${verifiedItems.length} plats, attendu ${total}`)
  }
  return problems
}
