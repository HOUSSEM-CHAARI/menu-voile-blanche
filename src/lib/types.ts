export const LOCALES = ['fr', 'ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

/** French is required; Arabic and English fall back to French when empty. */
export interface Localized {
  fr: string
  ar?: string | null
  en?: string | null
}

export interface LocalizedList {
  fr: string[]
  ar?: string[] | null
  en?: string[] | null
}

export interface ItemOption {
  label: Localized
  choices: Localized[]
}

export const TAGS = ['signature', 'royale', 'forTwo', 'grilled', 'catchOfTheDay'] as const
export type Tag = (typeof TAGS)[number]

/** Drives the quick filters on the public menu. */
export const KINDS = ['seafood', 'fish', 'meat', 'poultry', 'other'] as const
export type Kind = (typeof KINDS)[number]

export const PRICE_UNITS = ['item', 'per100g'] as const
export type PriceUnit = (typeof PRICE_UNITS)[number]

export const CATEGORY_LAYOUTS = ['standard', 'compact'] as const
export type CategoryLayout = (typeof CATEGORY_LAYOUTS)[number]

export const IMAGE_SOURCES = ['owner', 'temporary'] as const
export type ImageSource = (typeof IMAGE_SOURCES)[number]

export interface ImageVariant {
  width: number
  src: string
}

/** Output of the image pipeline, stored as JSON on categories and dishes. */
export interface ImageMeta {
  key: string
  width: number
  height: number
  /** Tiny blurred WebP as a data URI, shown while the photo loads. */
  lqip: string
  avif: ImageVariant[]
  webp: ImageVariant[]
  jpg: ImageVariant[]
}

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
}
