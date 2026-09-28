import type { MenuItem } from './db/schema'
import { pick, pickList, ui, type LocalizedText } from './i18n'
import { priceParts, type PriceParts } from './price'
import { normalizeForSearch } from './search'
import type { ImageMeta, ImageSource, Kind, Locale } from './types'

export interface OptionView {
  label: LocalizedText
  choices: LocalizedText[]
}

export type BadgeKind = 'signature' | 'serves' | 'per100g'

export interface DishView {
  id: number
  slug: string
  name: LocalizedText
  description: LocalizedText | null
  note: LocalizedText | null
  price: PriceParts
  /** Integer millimes, for structured data. */
  millimes: number
  badges: { kind: BadgeKind; text: string }[]
  options: OptionView[]
  includes: { items: string[]; lang: Locale }
  kind: Kind
  serves: number | null
  soldOut: boolean
  signature: boolean
  image: ImageMeta | null
  imageAlt: LocalizedText
  imageSource: ImageSource | null
  /** Normalised names, descriptions and compositions in all three languages. */
  search: string
}

const optional = (text: LocalizedText): LocalizedText | null => (text.text.trim() ? text : null)

export function dishView(item: MenuItem, locale: Locale): DishView {
  const t = ui(locale)
  const name = pick(locale, { fr: item.nameFr, ar: item.nameAr, en: item.nameEn })
  const description = pick(locale, {
    fr: item.descriptionFr ?? '',
    ar: item.descriptionAr,
    en: item.descriptionEn,
  })
  const note = pick(locale, { fr: item.noteFr ?? '', ar: item.noteAr, en: item.noteEn })
  const signature = item.tags.includes('signature')

  const badges: DishView['badges'] = []
  if (signature) badges.push({ kind: 'signature', text: t.signature })
  if (item.serves) badges.push({ kind: 'serves', text: t.serves(item.serves) })
  if (item.priceUnit === 'per100g') badges.push({ kind: 'per100g', text: t.per100g })

  const searchParts = [
    item.nameFr,
    item.nameAr,
    item.nameEn,
    item.descriptionFr,
    item.descriptionAr,
    item.descriptionEn,
    ...(item.includes
      ? [...item.includes.fr, ...(item.includes.ar ?? []), ...(item.includes.en ?? [])]
      : []),
    ...item.options.flatMap((option) =>
      option.choices.flatMap((choice) => [choice.fr, choice.ar, choice.en]),
    ),
  ]

  return {
    id: item.id,
    slug: item.slug,
    name,
    description: optional(description),
    note: optional(note),
    price: priceParts(item.price, locale, item.priceUnit),
    millimes: item.price,
    badges,
    options: item.options.map((option) => ({
      label: pick(locale, option.label),
      choices: option.choices.map((choice) => pick(locale, choice)),
    })),
    includes: pickList(locale, item.includes),
    kind: item.kind,
    serves: item.serves,
    soldOut: !item.isAvailable,
    signature,
    image: item.image ?? null,
    imageAlt: pick(locale, {
      fr: item.imageAltFr ?? item.nameFr,
      ar: item.imageAltAr ?? item.nameAr,
      en: item.imageAltEn ?? item.nameEn,
    }),
    imageSource: item.imageSource ?? null,
    search: normalizeForSearch(searchParts.filter(Boolean).join(' ')),
  }
}
