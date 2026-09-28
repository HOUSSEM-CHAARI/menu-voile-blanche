/** Menu backup: JSON export/import (full restore) and CSV export (for Excel). */
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import type { SessionUser } from '../auth'
import { audit } from '../audit'
import { db } from '../db/client'
import {
  categories,
  menuItems,
  settings,
  type Category,
  type MenuItem,
  type Settings,
} from '../db/schema'
import { formatPrice } from '../price'

const FORMAT = 'la-voile-blanche-menu'
const NBSP = new RegExp(String.fromCharCode(0xa0), 'g')
const BOM = String.fromCharCode(0xfeff)

export async function exportMenu() {
  const [categoryRows, itemRows, settingsRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(menuItems).orderBy(asc(menuItems.categoryId), asc(menuItems.sortOrder)),
    db.select().from(settings),
  ])
  return {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: categoryRows,
    items: itemRows,
    settings: settingsRows[0] ?? null,
  }
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  // Leading = + - @ would be run as formulas by Excel.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function exportCsv(): Promise<string> {
  const data = await exportMenu()
  const names = new Map(data.categories.map((c) => [c.id, c.nameFr]))
  const header = [
    'Catégorie',
    'Nom (FR)',
    'Nom (AR)',
    'Nom (EN)',
    'Prix',
    'Prix (millimes)',
    'Unité',
    'Disponible',
    'Visible',
    'Corbeille',
  ]
  const rows = data.items.map((item) => [
    names.get(item.categoryId),
    item.nameFr,
    item.nameAr,
    item.nameEn,
    formatPrice(item.price, 'fr', item.priceUnit).replace(NBSP, ' '),
    item.price,
    item.priceUnit === 'per100g' ? 'aux 100 g' : 'par plat',
    item.isAvailable ? 'oui' : 'non',
    item.isVisible ? 'oui' : 'non',
    item.deletedAt ? 'oui' : 'non',
  ])
  // BOM so Excel opens accents and Arabic correctly; semicolons for French Excel.
  const CRLF = String.fromCharCode(13, 10)
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(';'))
  return BOM + lines.join(CRLF) + CRLF
}

const date = z.union([z.string(), z.number()]).transform((v) => new Date(v))
const nullableDate = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => (v === null ? null : new Date(v)))

const localized = z.object({ fr: z.string(), ar: z.string().nullish(), en: z.string().nullish() })
const imageMeta = z
  .object({
    key: z.string().regex(/^[a-f0-9]{16}$/),
    width: z.number(),
    height: z.number(),
    lqip: z.string(),
    avif: z.array(z.object({ width: z.number(), src: z.string().startsWith('/media/') })),
    webp: z.array(z.object({ width: z.number(), src: z.string().startsWith('/media/') })),
    jpg: z.array(z.object({ width: z.number(), src: z.string().startsWith('/media/') })),
  })
  .nullable()

const categorySchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(120),
  nameFr: z.string().min(1).max(120),
  nameAr: z.string().max(120).nullable(),
  nameEn: z.string().max(120).nullable(),
  image: imageMeta,
  layout: z.enum(['standard', 'compact']),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  draftFields: z.array(z.string()),
  createdAt: date,
  updatedAt: date,
})

const itemSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(160),
  categoryId: z.number().int().positive(),
  nameFr: z.string().min(1).max(200),
  nameAr: z.string().max(200).nullable(),
  nameEn: z.string().max(200).nullable(),
  descriptionFr: z.string().max(600).nullable(),
  descriptionAr: z.string().max(600).nullable(),
  descriptionEn: z.string().max(600).nullable(),
  noteFr: z.string().max(400).nullable(),
  noteAr: z.string().max(400).nullable(),
  noteEn: z.string().max(400).nullable(),
  price: z.number().int().nonnegative(),
  priceUnit: z.enum(['item', 'per100g']),
  serves: z.number().int().nullable(),
  includes: z
    .object({
      fr: z.array(z.string()),
      ar: z.array(z.string()).nullish(),
      en: z.array(z.string()).nullish(),
    })
    .nullable(),
  options: z.array(z.object({ label: localized, choices: z.array(localized) })),
  tags: z.array(z.enum(['signature', 'royale', 'forTwo', 'grilled', 'catchOfTheDay'])),
  kind: z.enum(['seafood', 'fish', 'meat', 'poultry', 'other']),
  image: imageMeta,
  imageAltFr: z.string().nullable(),
  imageAltAr: z.string().nullable(),
  imageAltEn: z.string().nullable(),
  imageSource: z.enum(['owner', 'temporary']).nullable(),
  imageCredit: z.string().nullable(),
  isAvailable: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int(),
  needsOwnerReview: z.string().nullable(),
  draftFields: z.array(z.string()),
  deletedAt: nullableDate,
  createdAt: date,
  updatedAt: date,
})

const settingsSchema = z
  .object({
    id: z.literal(1),
    restaurantName: z.string().min(1),
    unconfirmedFields: z.array(z.string()),
    updatedAt: date,
  })
  .catchall(z.union([z.string(), z.null()]))

const backupSchema = z
  .object({
    format: z.literal(FORMAT),
    version: z.literal(1),
    exportedAt: z.string(),
    categories: z.array(categorySchema).min(1).max(200),
    items: z.array(itemSchema).max(2000),
    settings: settingsSchema.nullable(),
  })
  .refine((b) => b.items.every((item) => b.categories.some((c) => c.id === item.categoryId)), {
    message: 'Un plat pointe vers une catégorie absente de la sauvegarde.',
  })

export type Backup = z.infer<typeof backupSchema>

export function parseBackup(text: string): { backup?: Backup; error?: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { error: 'Ce fichier n’est pas un fichier JSON valide.' }
  }
  const result = backupSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    return {
      error: `Sauvegarde invalide : ${issue?.message ?? 'format inconnu'} (${issue?.path.join('.') ?? ''}).`,
    }
  }
  return { backup: result.data }
}

export interface ImportPreview {
  exportedAt: string
  categories: { current: number; incoming: number }
  dishes: { current: number; incoming: number }
  added: string[]
  removed: string[]
  priceChanges: { name: string; from: string; to: string }[]
}

export async function previewImport(backup: Backup): Promise<ImportPreview> {
  const current = await exportMenu()
  const now = new Map(current.items.map((i) => [i.slug, i]))
  const next = new Map(backup.items.map((i) => [i.slug, i]))
  return {
    exportedAt: backup.exportedAt,
    categories: { current: current.categories.length, incoming: backup.categories.length },
    dishes: { current: current.items.length, incoming: backup.items.length },
    added: backup.items.filter((i) => !now.has(i.slug)).map((i) => i.nameFr),
    removed: current.items.filter((i) => !next.has(i.slug)).map((i) => i.nameFr),
    priceChanges: backup.items
      .filter((i) => now.has(i.slug) && now.get(i.slug)?.price !== i.price)
      .map((i) => ({
        name: i.nameFr,
        from: formatPrice(now.get(i.slug)?.price ?? 0, 'fr', i.priceUnit),
        to: formatPrice(i.price, 'fr', i.priceUnit),
      })),
  }
}

/** Replaces the whole menu (and settings) with the backup, in one transaction. */
export async function applyImport(backup: Backup, user: SessionUser): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(menuItems)
    await tx.delete(categories)
    await tx.insert(categories).values(backup.categories as Category[])
    if (backup.items.length) await tx.insert(menuItems).values(backup.items as MenuItem[])
    if (backup.settings) {
      await tx.delete(settings)
      await tx.insert(settings).values(backup.settings as unknown as Settings)
    }
  })
  await audit(user, 'import', 'backup', null, null, {
    categories: backup.categories.length,
    dishes: backup.items.length,
    exportedAt: backup.exportedAt,
  })
}
