import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type {
  ImageMeta,
  ImageSource,
  ItemOption,
  Kind,
  LocalizedList,
  PriceUnit,
  Tag,
} from '../types'

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameFr: text('name_fr').notNull(),
  nameAr: text('name_ar'),
  nameEn: text('name_en'),
  image: text('image', { mode: 'json' }).$type<ImageMeta>(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  /** Field keys whose content is a draft awaiting the owner's approval. */
  draftFields: text('draft_fields', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const menuItems = sqliteTable(
  'menu_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    nameFr: text('name_fr').notNull(),
    nameAr: text('name_ar'),
    nameEn: text('name_en'),
    descriptionFr: text('description_fr'),
    descriptionAr: text('description_ar'),
    descriptionEn: text('description_en'),
    /** Serving note shown in the detail sheet, e.g. "weighed at the table". */
    noteFr: text('note_fr'),
    noteAr: text('note_ar'),
    noteEn: text('note_en'),
    /** Integer millimes: 42000 = 42 DT. */
    price: integer('price').notNull(),
    priceUnit: text('price_unit').$type<PriceUnit>().notNull().default('item'),
    serves: integer('serves'),
    includes: text('includes', { mode: 'json' }).$type<LocalizedList>(),
    options: text('options', { mode: 'json' }).$type<ItemOption[]>().notNull().default([]),
    tags: text('tags', { mode: 'json' }).$type<Tag[]>().notNull().default([]),
    kind: text('kind').$type<Kind>().notNull().default('other'),
    image: text('image', { mode: 'json' }).$type<ImageMeta>(),
    imageAltFr: text('image_alt_fr'),
    imageAltAr: text('image_alt_ar'),
    imageAltEn: text('image_alt_en'),
    imageSource: text('image_source').$type<ImageSource>(),
    imageCredit: text('image_credit'),
    isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    /** Reason the owner must check this dish. Shown only in the back office. */
    needsOwnerReview: text('needs_owner_review'),
    draftFields: text('draft_fields', { mode: 'json' }).$type<string[]>().notNull().default([]),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('menu_items_category_idx').on(table.categoryId, table.sortOrder)],
)

/** Single row (id = 1). */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  restaurantName: text('restaurant_name').notNull(),
  taglineFr: text('tagline_fr').notNull().default(''),
  taglineAr: text('tagline_ar'),
  taglineEn: text('tagline_en'),
  phone: text('phone').notNull().default(''),
  whatsapp: text('whatsapp').notNull().default(''),
  addressFr: text('address_fr').notNull().default(''),
  addressAr: text('address_ar'),
  addressEn: text('address_en'),
  city: text('city').notNull().default(''),
  mapUrl: text('map_url').notNull().default(''),
  openingHoursFr: text('opening_hours_fr').notNull().default(''),
  openingHoursAr: text('opening_hours_ar'),
  openingHoursEn: text('opening_hours_en'),
  instagram: text('instagram').notNull().default(''),
  facebook: text('facebook').notNull().default(''),
  baseUrl: text('base_url').notNull().default(''),
  /** Field keys the owner still has to confirm ("à confirmer"). */
  unconfirmedFields: text('unconfirmed_fields', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  updatedAt: updatedAt(),
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'owner' | 'manager' | 'staff'>().notNull().default('owner'),
  createdAt: createdAt(),
})

export const sessions = sqliteTable('sessions', {
  /** SHA-256 of the session token; the raw token only lives in the cookie. */
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  csrfToken: text('csrf_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
})

export const loginAttempts = sqliteTable('login_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start', { mode: 'timestamp_ms' }).notNull(),
})

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    username: text('username').notNull(),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id'),
    before: text('before', { mode: 'json' }).$type<Record<string, unknown>>(),
    after: text('after', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (table) => [index('audit_entity_idx').on(table.entity, table.entityId)],
)

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type MenuItem = typeof menuItems.$inferSelect
export type NewMenuItem = typeof menuItems.$inferInsert
export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
