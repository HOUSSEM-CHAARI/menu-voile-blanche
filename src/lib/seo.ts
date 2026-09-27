import type { Settings } from './db/schema'
import type { DishView } from './dish-view'
import type { LocalizedText } from './i18n'
import { env } from './env'
import { priceForSchema } from './price'
import { LOCALES, type Locale } from './types'

/** Public address of the menu: the back-office setting first, then PUBLIC_BASE_URL. */
export function siteUrl(settings: Settings | null | undefined): string {
  return (settings?.baseUrl || env.PUBLIC_BASE_URL).replace(/\/+$/, '')
}

export interface Alternate {
  hreflang: string
  href: string
}

/** hreflang links for the three menu languages, plus x-default ("/" opens French). */
export function alternates(base: string): Alternate[] {
  return [
    ...LOCALES.map((locale) => ({ hreflang: locale, href: `${base}/${locale}` })),
    { hreflang: 'x-default', href: `${base}/` },
  ]
}

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_TN', ar: 'ar_TN', en: 'en_GB' }
export const ogLocale = (locale: Locale): string => OG_LOCALE[locale]

interface JsonLdSection {
  title: LocalizedText
  dishes: DishView[]
}

/** schema.org Restaurant → hasMenu → Menu → MenuSection → MenuItem → Offer (TND). */
export function restaurantJsonLd(options: {
  settings: Settings
  locale: Locale
  base: string
  tagline: string
  address: string
  sections: JsonLdSection[]
}): Record<string, unknown> {
  const { settings, locale, base, tagline, address, sections } = options
  const url = `${base}/${locale}`
  const media = (path: string) => (path.startsWith('http') ? path : `${base}${path}`)

  const menuItem = (dish: DishView) => {
    const amount = priceForSchema(dish.millimes)
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      price: amount,
      priceCurrency: 'TND',
      availability: dish.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    }
    if (dish.price.per) {
      offer.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: amount,
        priceCurrency: 'TND',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 100, unitCode: 'GRM' },
      }
    }
    const photo = dish.image?.jpg.at(-2) ?? dish.image?.jpg.at(-1)
    return {
      '@type': 'MenuItem',
      '@id': `${url}#${dish.slug}`,
      name: dish.name.text,
      ...(dish.description ? { description: dish.description.text } : {}),
      ...(photo ? { image: media(photo.src) } : {}),
      offers: offer,
    }
  }

  const sameAs = [settings.facebook, settings.instagram].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${base}/#restaurant`,
    name: settings.restaurantName,
    ...(tagline ? { description: tagline } : {}),
    url,
    image: `${base}/og/${locale}.png`,
    logo: `${base}/icons/icon-512.png`,
    ...(settings.phone ? { telephone: settings.phone.replace(/\s/g, '') } : {}),
    ...(address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: address,
            addressLocality: settings.city || undefined,
            addressCountry: 'TN',
          },
        }
      : {}),
    servesCuisine: ['Seafood', 'Mediterranean', 'Tunisian'],
    priceRange: '$$',
    currenciesAccepted: 'TND',
    ...(settings.mapUrl ? { hasMap: settings.mapUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    inLanguage: locale,
    hasMenu: {
      '@type': 'Menu',
      '@id': `${url}#menu`,
      name: settings.restaurantName,
      inLanguage: locale,
      hasMenuSection: sections.map((section) => ({
        '@type': 'MenuSection',
        name: section.title.text,
        hasMenuItem: section.dishes.map(menuItem),
      })),
    },
  }
}

/** Serialises JSON-LD safely inside a <script> element. */
export function jsonLdScript(data: unknown): string {
  // Escape '<' as the JSON unicode escape (backslash u003c) so no tag can close the script.
  return JSON.stringify(data).replace(/</g, `${String.fromCharCode(92)}u003c`)
}
