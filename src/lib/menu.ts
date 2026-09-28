import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from './db/client'
import {
  categories,
  menuItems,
  settings,
  type Category,
  type MenuItem,
  type Settings,
} from './db/schema'

export interface MenuSection {
  category: Category
  items: MenuItem[]
}

export interface PublicMenu {
  settings: Settings
  sections: MenuSection[]
  signatures: MenuItem[]
}

/**
 * Everything the public menu shows, read fresh from the database on every request.
 * Hidden categories, hidden dishes and dishes in the trash are left out;
 * unavailable dishes stay in (they are shown as sold out).
 */
export async function getPublicMenu(): Promise<PublicMenu> {
  const [settingsRow, categoryRows, itemRows] = await Promise.all([
    db.select().from(settings).where(eq(settings.id, 1)).get(),
    db
      .select()
      .from(categories)
      .where(eq(categories.isVisible, true))
      .orderBy(asc(categories.sortOrder), asc(categories.id)),
    db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.isVisible, true), isNull(menuItems.deletedAt)))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id)),
  ])

  if (!settingsRow) throw new Error('Settings are missing: run `npm run setup` first.')

  const sections = categoryRows
    .map((category) => ({
      category,
      items: itemRows.filter((item) => item.categoryId === category.id),
    }))
    .filter((section) => section.items.length > 0)

  const signatures = sections.flatMap((section) =>
    section.items.filter((item) => item.tags.includes('signature')),
  )

  return { settings: settingsRow, sections, signatures }
}
