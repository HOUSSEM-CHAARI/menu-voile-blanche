/** Back-office reads and writes. Every write is audited. */
import { and, asc, count, desc, eq, isNotNull, isNull, max, ne, or, sql } from 'drizzle-orm'
import type { SessionUser } from '../auth'
import { audit } from '../audit'
import { db } from '../db/client'
import {
  auditLog,
  categories,
  menuItems,
  settings,
  type Category,
  type MenuItem,
  type NewCategory,
  type NewMenuItem,
  type Settings,
} from '../db/schema'
import { deleteImage } from '../images'
import { slugify } from '../slug'
import type { ImageMeta, ImageSource } from '../types'

export class ActionError extends Error {}

async function uniqueSlug(
  table: 'dish' | 'category',
  base: string,
  exceptId?: number,
): Promise<string> {
  const root = slugify(base) || (table === 'dish' ? 'plat' : 'categorie')
  for (let n = 1; n < 500; n += 1) {
    const slug = n === 1 ? root : `${root}-${n}`
    const found =
      table === 'dish'
        ? await db
            .select({ id: menuItems.id })
            .from(menuItems)
            .where(eq(menuItems.slug, slug))
            .get()
        : await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, slug))
            .get()
    if (!found || found.id === exceptId) return slug
  }
  throw new ActionError('Impossible de créer une adresse unique pour ce nom.')
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

export async function dashboardStats() {
  const live = isNull(menuItems.deletedAt)
  const one = async (where: ReturnType<typeof and>) =>
    (await db.select({ n: count() }).from(menuItems).where(where).get())?.n ?? 0
  const [
    categoriesCount,
    dishes,
    soldOut,
    review,
    missingAr,
    missingEn,
    noPhoto,
    temporary,
    trash,
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(categories)
      .get()
      .then((r) => r?.n ?? 0),
    one(and(live)),
    one(and(live, eq(menuItems.isAvailable, false))),
    one(and(live, isNotNull(menuItems.needsOwnerReview))),
    one(and(live, or(isNull(menuItems.nameAr), eq(menuItems.nameAr, '')))),
    one(and(live, or(isNull(menuItems.nameEn), eq(menuItems.nameEn, '')))),
    one(and(live, isNull(menuItems.image))),
    one(and(live, eq(menuItems.imageSource, 'temporary'))),
    one(and(isNotNull(menuItems.deletedAt))),
  ])
  const recent = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(8)
  return {
    categoriesCount,
    dishes,
    soldOut,
    review,
    missingAr,
    missingEn,
    noPhoto,
    temporary,
    trash,
    recent,
  }
}

/* ─── Categories ──────────────────────────────────────────────────────────── */

export async function listCategories() {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
  const counts = await db
    .select({ categoryId: menuItems.categoryId, n: count() })
    .from(menuItems)
    .where(isNull(menuItems.deletedAt))
    .groupBy(menuItems.categoryId)
  const byId = new Map(counts.map((c) => [c.categoryId, c.n]))
  return rows.map((row) => ({ ...row, dishCount: byId.get(row.id) ?? 0 }))
}

export const getCategory = (id: number) =>
  db.select().from(categories).where(eq(categories.id, id)).get()

export type CategoryInput = Pick<
  NewCategory,
  'nameFr' | 'nameAr' | 'nameEn' | 'isVisible' | 'layout'
>

export async function createCategory(input: CategoryInput, user: SessionUser): Promise<Category> {
  const last = await db
    .select({ n: max(categories.sortOrder) })
    .from(categories)
    .get()
  const [row] = await db
    .insert(categories)
    .values({
      ...input,
      slug: await uniqueSlug('category', input.nameFr),
      sortOrder: (last?.n ?? 0) + 10,
    })
    .returning()
  if (!row) throw new ActionError('La catégorie n’a pas pu être créée.')
  await audit(user, 'create', 'category', row.id, null, row)
  return row
}

export async function updateCategory(
  id: number,
  input: Partial<CategoryInput> & { image?: ImageMeta | null; draftFields?: string[] },
  user: SessionUser,
) {
  const before = await getCategory(id)
  if (!before) throw new ActionError('Catégorie introuvable.')
  const [after] = await db.update(categories).set(input).where(eq(categories.id, id)).returning()
  await audit(user, 'update', 'category', id, before, after ?? null)
  return after
}

export async function reorderCategories(ids: number[], user: SessionUser) {
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx
        .update(categories)
        .set({ sortOrder: (index + 1) * 10 })
        .where(eq(categories.id, id))
    }
  })
  await audit(user, 'reorder', 'category', null, null, { order: ids })
}

export async function moveCategory(id: number, direction: -1 | 1, user: SessionUser) {
  const ids = (await listCategories()).map((c) => c.id)
  const index = ids.indexOf(id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= ids.length) return
  ;[ids[index], ids[target]] = [ids[target] as number, ids[index] as number]
  await reorderCategories(ids, user)
}

/** Deleting a category that still has dishes requires moving them first. */
export async function deleteCategory(id: number, moveTo: number | null, user: SessionUser) {
  const before = await getCategory(id)
  if (!before) throw new ActionError('Catégorie introuvable.')
  const dishes = await db
    .select({ id: menuItems.id })
    .from(menuItems)
    .where(eq(menuItems.categoryId, id))
  if (dishes.length > 0) {
    if (!moveTo || moveTo === id) {
      throw new ActionError(
        'Cette catégorie contient encore des plats : choisissez où les déplacer.',
      )
    }
    const target = await getCategory(moveTo)
    if (!target) throw new ActionError('Catégorie de destination introuvable.')
    const last = await db
      .select({ n: max(menuItems.sortOrder) })
      .from(menuItems)
      .where(eq(menuItems.categoryId, moveTo))
      .get()
    let order = last?.n ?? 0
    for (const dish of dishes) {
      order += 10
      await db
        .update(menuItems)
        .set({ categoryId: moveTo, sortOrder: order })
        .where(eq(menuItems.id, dish.id))
    }
  }
  await deleteImage(before.image)
  await db.delete(categories).where(eq(categories.id, id))
  await audit(user, 'delete', 'category', id, before, null)
}

/* ─── Dishes ──────────────────────────────────────────────────────────────── */

export interface DishFilters {
  q?: string | undefined
  categoryId?: number | undefined
  status?: 'soldout' | 'hidden' | 'review' | 'nophoto' | undefined
}

export async function listDishes(filters: DishFilters = {}) {
  const rows = await db
    .select({ dish: menuItems, category: categories })
    .from(menuItems)
    .innerJoin(categories, eq(categories.id, menuItems.categoryId))
    .where(isNull(menuItems.deletedAt))
    .orderBy(asc(categories.sortOrder), asc(menuItems.sortOrder), asc(menuItems.id))
  const { normalizeForSearch } = await import('../search')
  const words = normalizeForSearch(filters.q ?? '')
    .split(' ')
    .filter(Boolean)
  return rows.filter(({ dish }) => {
    if (filters.categoryId && dish.categoryId !== filters.categoryId) return false
    if (filters.status === 'soldout' && dish.isAvailable) return false
    if (filters.status === 'hidden' && dish.isVisible) return false
    if (filters.status === 'review' && !dish.needsOwnerReview) return false
    if (filters.status === 'nophoto' && dish.image) return false
    if (words.length === 0) return true
    const hay = ` ${normalizeForSearch([dish.nameFr, dish.nameAr, dish.nameEn].filter(Boolean).join(' '))}`
    return words.every((word) => hay.includes(` ${word}`))
  })
}

export const getDish = (id: number) => db.select().from(menuItems).where(eq(menuItems.id, id)).get()

export type DishInput = Omit<
  NewMenuItem,
  | 'id'
  | 'slug'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'sortOrder'
  | 'image'
  | 'imageSource'
  | 'imageCredit'
>

async function endOfCategory(categoryId: number): Promise<number> {
  const last = await db
    .select({ n: max(menuItems.sortOrder) })
    .from(menuItems)
    .where(eq(menuItems.categoryId, categoryId))
    .get()
  return (last?.n ?? 0) + 10
}

export async function createDish(input: DishInput, user: SessionUser): Promise<MenuItem> {
  const [row] = await db
    .insert(menuItems)
    .values({
      ...input,
      slug: await uniqueSlug('dish', input.nameFr),
      sortOrder: await endOfCategory(input.categoryId),
    })
    .returning()
  if (!row) throw new ActionError('Le plat n’a pas pu être créé.')
  await audit(user, 'create', 'dish', row.id, null, row)
  return row
}

export async function updateDish(
  id: number,
  input: Partial<NewMenuItem>,
  user: SessionUser,
  action = 'update',
) {
  const before = await getDish(id)
  if (!before) throw new ActionError('Plat introuvable.')
  const values = { ...input }
  if (input.categoryId && input.categoryId !== before.categoryId) {
    values.sortOrder = await endOfCategory(input.categoryId)
  }
  const [after] = await db.update(menuItems).set(values).where(eq(menuItems.id, id)).returning()
  await audit(user, action, 'dish', id, before, after ?? null)
  return after
}

export async function setDishImage(
  id: number,
  image: ImageMeta | null,
  source: ImageSource | null,
  user: SessionUser,
) {
  const before = await getDish(id)
  if (!before) throw new ActionError('Plat introuvable.')
  if (before.image && before.image.key !== image?.key) {
    // Another dish may share the same file (duplicates): only delete unused photos.
    const shared = await db
      .select({ n: count() })
      .from(menuItems)
      .where(
        and(
          ne(menuItems.id, id),
          sql`json_extract(${menuItems.image}, '$.key') = ${before.image.key}`,
        ),
      )
      .get()
    if (!shared?.n) await deleteImage(before.image)
  }
  await db
    .update(menuItems)
    .set({
      image,
      imageSource: source,
      imageCredit: source === 'owner' ? null : before.imageCredit,
    })
    .where(eq(menuItems.id, id))
  await audit(
    user,
    image ? 'photo' : 'photo-removed',
    'dish',
    id,
    { photo: before.image?.key ?? null },
    { photo: image?.key ?? null },
  )
}

export async function duplicateDish(id: number, user: SessionUser): Promise<MenuItem> {
  const source = await getDish(id)
  if (!source) throw new ActionError('Plat introuvable.')
  const {
    id: _id,
    slug: _slug,
    createdAt: _c,
    updatedAt: _u,
    deletedAt: _d,
    sortOrder: _s,
    ...rest
  } = source
  const name = `${source.nameFr} (copie)`
  const [row] = await db
    .insert(menuItems)
    .values({
      ...rest,
      nameFr: name,
      slug: await uniqueSlug('dish', name),
      isVisible: false,
      sortOrder: source.sortOrder + 5,
    })
    .returning()
  if (!row) throw new ActionError('Le plat n’a pas pu être dupliqué.')
  await audit(user, 'duplicate', 'dish', row.id, null, { from: source.id, nameFr: name })
  return row
}

async function dishOrder(categoryId: number): Promise<number[]> {
  const rows = await db
    .select({ id: menuItems.id })
    .from(menuItems)
    .where(and(eq(menuItems.categoryId, categoryId), isNull(menuItems.deletedAt)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id))
  return rows.map((r) => r.id)
}

export async function reorderDishes(categoryId: number, ids: number[], user: SessionUser) {
  const current = await dishOrder(categoryId)
  if (ids.length !== current.length || ids.some((id) => !current.includes(id))) {
    throw new ActionError('La liste a changé entre-temps : rechargez la page.')
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx
        .update(menuItems)
        .set({ sortOrder: (index + 1) * 10 })
        .where(eq(menuItems.id, id))
    }
  })
  await audit(user, 'reorder', 'dish', null, null, { categoryId, order: ids })
}

export async function moveDish(id: number, direction: -1 | 1, user: SessionUser) {
  const dish = await getDish(id)
  if (!dish) throw new ActionError('Plat introuvable.')
  const ids = await dishOrder(dish.categoryId)
  const index = ids.indexOf(id)
  const target = index + direction
  if (target < 0 || target >= ids.length) return
  ;[ids[index], ids[target]] = [ids[target] as number, ids[index] as number]
  await reorderDishes(dish.categoryId, ids, user)
}

export async function trashDish(id: number, user: SessionUser) {
  await updateDish(id, { deletedAt: new Date() }, user, 'trash')
}

export async function restoreDish(id: number, user: SessionUser) {
  const dish = await getDish(id)
  if (!dish) throw new ActionError('Plat introuvable.')
  await db
    .update(menuItems)
    .set({ deletedAt: null, sortOrder: await endOfCategory(dish.categoryId) })
    .where(eq(menuItems.id, id))
  await audit(user, 'restore', 'dish', id, { deletedAt: dish.deletedAt }, { deletedAt: null })
}

export async function purgeDish(id: number, user: SessionUser) {
  const dish = await getDish(id)
  if (!dish?.deletedAt)
    throw new ActionError('Seuls les plats de la corbeille peuvent être supprimés définitivement.')
  await setDishImage(id, null, null, user)
  await db.delete(menuItems).where(eq(menuItems.id, id))
  await audit(user, 'purge', 'dish', id, { nameFr: dish.nameFr }, null)
}

export const listTrash = () =>
  db
    .select({ dish: menuItems, category: categories })
    .from(menuItems)
    .innerJoin(categories, eq(categories.id, menuItems.categoryId))
    .where(isNotNull(menuItems.deletedAt))
    .orderBy(desc(menuItems.deletedAt))

/* ─── Settings and history ────────────────────────────────────────────────── */

export async function getSettings(): Promise<Settings> {
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get()
  if (!row) throw new ActionError('Réglages introuvables : lancez npm run setup.')
  return row
}

export async function updateSettings(input: Partial<Settings>, user: SessionUser) {
  const before = await getSettings()
  const [after] = await db.update(settings).set(input).where(eq(settings.id, 1)).returning()
  await audit(user, 'update', 'settings', 1, before, after ?? null)
}

export const listHistory = (entity?: string, entityId?: number, limit = 200) =>
  db
    .select()
    .from(auditLog)
    .where(
      entity && entityId
        ? and(eq(auditLog.entity, entity), eq(auditLog.entityId, entityId))
        : undefined,
    )
    .orderBy(desc(auditLog.id))
    .limit(limit)
