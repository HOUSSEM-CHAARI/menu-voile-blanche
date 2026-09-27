import type { Locale, PriceUnit } from './types'

const NBSP = ' '

const CURRENCY: Record<Locale, string> = { fr: 'DT', en: 'DT', ar: 'د.ت' }
const PER_100G: Record<Locale, string> = { fr: '100 g', en: '100 g', ar: '100 غ' }

/** Lowest and highest plausible dish price; outside this range is almost certainly a typo. */
export const PRICE_WARN_MIN = 1_000
export const PRICE_WARN_MAX = 500_000

export interface PriceParts {
  /** "42" or "42,500" — Western digits in every language. */
  amount: string
  currency: string
  /** "100 g" when the price is per 100 g, otherwise null. */
  per: string | null
}

export function priceParts(millimes: number, locale: Locale, unit: PriceUnit = 'item'): PriceParts {
  if (!Number.isInteger(millimes) || millimes < 0) {
    throw new RangeError(`Invalid price in millimes: ${millimes}`)
  }
  const dinars = Math.floor(millimes / 1000)
  const rest = millimes % 1000
  const amount = rest === 0 ? String(dinars) : `${dinars},${String(rest).padStart(3, '0')}`
  return { amount, currency: CURRENCY[locale], per: unit === 'per100g' ? PER_100G[locale] : null }
}

/**
 * The single price formatter of the project.
 * 42000 → "42 DT" (fr/en), "42 د.ت" (ar); 42500 → "42,500 DT"; per 100 g → "14 DT / 100 g".
 */
export function formatPrice(millimes: number, locale: Locale, unit: PriceUnit = 'item'): string {
  const { amount, currency, per } = priceParts(millimes, locale, unit)
  const base = `${amount}${NBSP}${currency}`
  return per ? `${base} / ${per.replace(' ', NBSP)}` : base
}

/**
 * Parses a price typed in dinars and returns millimes, or null when the input is not a price.
 * Tunisian notation: a separator followed by exactly three digits marks millimes,
 * so "42,000" and "42.000" are 42 DT. One or two digits are a decimal fraction ("42,5" = 42.500).
 */
export function parsePriceInput(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/(dt|tnd|د\.?ت)$/i, '')
    .trim()
  const match = /^(\d{1,6})(?:[.,](\d{1,3}))?$/.exec(cleaned)
  if (!match) return null
  const dinars = Number(match[1])
  const fraction = match[2] ?? ''
  const millimes = fraction === '' ? 0 : Number(fraction.padEnd(3, '0'))
  return dinars * 1000 + millimes
}

export function isImplausiblePrice(millimes: number): boolean {
  return millimes < PRICE_WARN_MIN || millimes > PRICE_WARN_MAX
}

/** Decimal dinar string for schema.org offers, e.g. 42000 → "42.000". */
export function priceForSchema(millimes: number): string {
  return (millimes / 1000).toFixed(3)
}
