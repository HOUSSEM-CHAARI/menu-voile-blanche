import { verifiedCategories, verifiedItems, verifiedSettings } from '../../data/menu.verified'
import { db } from '../../src/lib/db/client'
import { categories, menuItems, settings, type NewMenuItem } from '../../src/lib/db/schema'
import { env } from '../../src/lib/env'
import { slugify } from '../../src/lib/slug'

const orNull = (value: string | null | undefined): string | null => (value ? value : null)

export interface SeedResult {
  categories: number
  items: number
}

/**
 * Builds the menu from data/menu.verified.ts. Idempotent: rows are matched by slug, so running it
 * twice never creates duplicates. Existing rows are left untouched (the owner's edits win) unless
 * `force` is true, which rewrites them with the verified data.
 */
export async function seed({ force = false } = {}): Promise<SeedResult> {
  const slugs = new Set<string>()
  for (const item of verifiedItems) {
    const slug = slugify(item.name.fr)
    if (slugs.has(slug)) throw new Error(`Duplicate dish slug: ${slug}`)
    slugs.add(slug)
  }

  return db.transaction(async (tx) => {
    const categoryIds = new Map<string, number>()

    for (const [index, category] of verifiedCategories.entries()) {
      const values = {
        slug: category.slug,
        nameFr: category.name.fr,
        nameAr: orNull(category.name.ar),
        nameEn: orNull(category.name.en),
        layout: category.layout ?? 'standard',
        sortOrder: (index + 1) * 10,
        isVisible: true,
        draftFields: ['nameAr', 'nameEn'],
      }
      const insert = tx.insert(categories).values(values)
      await (force
        ? insert.onConflictDoUpdate({ target: categories.slug, set: values })
        : insert.onConflictDoNothing({ target: categories.slug }))
    }
    for (const row of await tx
      .select({ id: categories.id, slug: categories.slug })
      .from(categories)) {
      categoryIds.set(row.slug, row.id)
    }

    const positions = new Map<string, number>()
    for (const item of verifiedItems) {
      const categoryId = categoryIds.get(item.category)
      if (categoryId === undefined) throw new Error(`Unknown category ${item.category}`)
      const position = (positions.get(item.category) ?? 0) + 1
      positions.set(item.category, position)

      const draftFields = ['nameEn']
      if (item.arabicIsDraft) draftFields.push('nameAr')
      if (item.description.fr) draftFields.push('description')
      if (item.note) draftFields.push('note')
      if (item.includes) draftFields.push('includes')
      if (item.options?.length) draftFields.push('options')

      const values: NewMenuItem = {
        slug: slugify(item.name.fr),
        categoryId,
        nameFr: item.name.fr,
        nameAr: orNull(item.name.ar),
        nameEn: orNull(item.name.en),
        descriptionFr: orNull(item.description.fr),
        descriptionAr: orNull(item.description.ar),
        descriptionEn: orNull(item.description.en),
        noteFr: orNull(item.note?.fr),
        noteAr: orNull(item.note?.ar),
        noteEn: orNull(item.note?.en),
        price: item.price,
        priceUnit: item.priceUnit ?? 'item',
        serves: item.serves ?? null,
        includes: item.includes ?? null,
        options: item.options ?? [],
        tags: item.tags ?? [],
        kind: item.kind,
        isAvailable: true,
        isVisible: true,
        sortOrder: position * 10,
        needsOwnerReview: item.needsOwnerReview ?? null,
        draftFields,
        deletedAt: null,
      }
      const insert = tx.insert(menuItems).values(values)
      await (force
        ? insert.onConflictDoUpdate({ target: menuItems.slug, set: values })
        : insert.onConflictDoNothing({ target: menuItems.slug }))
    }

    const settingsValues = { id: 1, ...verifiedSettings, baseUrl: env.PUBLIC_BASE_URL }
    const insertSettings = tx.insert(settings).values(settingsValues)
    await (force
      ? insertSettings.onConflictDoUpdate({ target: settings.id, set: settingsValues })
      : insertSettings.onConflictDoNothing({ target: settings.id }))

    return { categories: verifiedCategories.length, items: verifiedItems.length }
  })
}
