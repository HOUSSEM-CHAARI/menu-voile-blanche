import type { Locale } from './types'

/** Text in a known language. `lang` differs from the page locale when French is used as fallback. */
export interface LocalizedText {
  text: string
  lang: Locale
}

/** Picks the text for a locale, falling back to French so a title is never empty. */
export function pick(
  locale: Locale,
  values: { fr: string; ar?: string | null | undefined; en?: string | null | undefined },
): LocalizedText {
  const value = locale === 'fr' ? values.fr : values[locale]
  if (value && value.trim()) return { text: value, lang: locale }
  return { text: values.fr, lang: 'fr' }
}

export function pickList(
  locale: Locale,
  values: { fr: string[]; ar?: string[] | null; en?: string[] | null } | null | undefined,
): { items: string[]; lang: Locale } {
  if (!values) return { items: [], lang: locale }
  const list = locale === 'fr' ? values.fr : values[locale]
  if (list && list.length > 0 && list.every((entry) => entry.trim()))
    return { items: list, lang: locale }
  return { items: values.fr, lang: 'fr' }
}

export const dir = (locale: Locale): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr')

/** Order of the language switcher: French first, always. */
export const SWITCHER: { locale: Locale; short: string; name: string }[] = [
  { locale: 'fr', short: 'FR', name: 'Français' },
  { locale: 'ar', short: 'عربي', name: 'العربية' },
  { locale: 'en', short: 'EN', name: 'English' },
]

const fr = {
  metaTitle: 'La Voile Blanche — Menu · Poissons et fruits de mer à Sfax',
  metaDescription:
    'Le menu de La Voile Blanche à Sfax : poisson du jour grillé, fruits de mer, pâtes, viandes et desserts. Prix en dinars tunisiens.',
  skipToMenu: 'Aller au menu',
  language: 'Langue',
  call: 'Appeler',
  directions: 'Itinéraire',
  hours: 'Horaires',
  signatures: 'Nos signatures',
  menu: 'La carte',
  categories: 'Catégories du menu',
  searchLabel: 'Rechercher un plat',
  searchPlaceholder: 'Rechercher un plat',
  clearSearch: 'Effacer la recherche',
  filters: 'Filtres',
  filterSeafood: 'Fruits de mer',
  filterFish: 'Poisson',
  filterMeat: 'Viande',
  filterPoultry: 'Volaille',
  filterForTwo: 'Pour 2',
  results: (n: number) => (n === 0 ? 'Aucun plat' : n === 1 ? '1 plat' : `${n} plats`),
  noResults: 'Aucun plat ne correspond. Essayez un autre mot.',
  showAll: 'Voir toute la carte',
  signature: 'Signature',
  forTwo: 'Pour 2 personnes',
  forOne: 'Pour 1 personne',
  serves: (n: number) => (n === 1 ? 'Pour 1 personne' : `Pour ${n} personnes`),
  per100g: 'Prix aux 100 g',
  soldOut: 'Épuisé',
  includes: 'Comprend',
  close: 'Fermer',
  openDish: (name: string) => `Voir le détail : ${name}`,
  share: 'Partager ce plat',
  linkCopied: 'Lien copié',
  priceNote: 'Prix en dinars tunisiens (DT).',
  address: 'Adresse',
  phone: 'Téléphone',
  followUs: 'Suivez-nous',
  photoIllustration: 'Photo d’illustration',
  photoCredits: 'Crédits photos',
  pendingPhoto: 'Photo à venir',
}

type Dictionary = typeof fr

const ar: Dictionary = {
  metaTitle: 'لا فوال بلانش — قائمة الطعام · أسماك وغلال البحر في صفاقس',
  metaDescription:
    'قائمة مطعم لا فوال بلانش في صفاقس: سمك اليوم المشوي، غلال البحر، المعكرونة، اللحوم والتحلية. الأسعار بالدينار التونسي.',
  skipToMenu: 'الانتقال إلى القائمة',
  language: 'اللغة',
  call: 'اتصال',
  directions: 'الاتجاهات',
  hours: 'المواعيد',
  signatures: 'أطباقنا المميزة',
  menu: 'قائمة الطعام',
  categories: 'أقسام القائمة',
  searchLabel: 'ابحث عن طبق',
  searchPlaceholder: 'ابحث عن طبق',
  clearSearch: 'مسح البحث',
  filters: 'تصفية',
  filterSeafood: 'غلال البحر',
  filterFish: 'سمك',
  filterMeat: 'لحوم',
  filterPoultry: 'دواجن',
  filterForTwo: 'لشخصين',
  results: (n: number) => (n === 0 ? 'لا توجد أطباق' : n === 1 ? 'طبق واحد' : `${n} أطباق`),
  noResults: 'لا يوجد طبق مطابق. جرّب كلمة أخرى.',
  showAll: 'عرض القائمة كاملة',
  signature: 'طبق مميز',
  forTwo: 'لشخصين',
  forOne: 'لشخص واحد',
  serves: (n: number) => (n === 1 ? 'لشخص واحد' : n === 2 ? 'لشخصين' : `لـ ${n} أشخاص`),
  per100g: 'السعر لكل 100 غ',
  soldOut: 'نفذ',
  includes: 'يتضمن',
  close: 'إغلاق',
  openDish: (name: string) => `عرض التفاصيل: ${name}`,
  share: 'مشاركة هذا الطبق',
  linkCopied: 'تم نسخ الرابط',
  priceNote: 'الأسعار بالدينار التونسي (د.ت).',
  address: 'العنوان',
  phone: 'الهاتف',
  followUs: 'تابعونا',
  photoIllustration: 'صورة توضيحية',
  photoCredits: 'حقوق الصور',
  pendingPhoto: 'الصورة قريبًا',
}

const en: Dictionary = {
  metaTitle: 'La Voile Blanche — Menu · Fish and seafood in Sfax',
  metaDescription:
    'The menu of La Voile Blanche in Sfax: grilled catch of the day, seafood, pasta, meat and desserts. Prices in Tunisian dinars.',
  skipToMenu: 'Skip to the menu',
  language: 'Language',
  call: 'Call',
  directions: 'Directions',
  hours: 'Hours',
  signatures: 'Our signatures',
  menu: 'The menu',
  categories: 'Menu sections',
  searchLabel: 'Search the menu',
  searchPlaceholder: 'Search the menu',
  clearSearch: 'Clear search',
  filters: 'Filters',
  filterSeafood: 'Seafood',
  filterFish: 'Fish',
  filterMeat: 'Meat',
  filterPoultry: 'Poultry',
  filterForTwo: 'For 2',
  results: (n: number) => (n === 0 ? 'No dishes' : n === 1 ? '1 dish' : `${n} dishes`),
  noResults: 'No dish matches. Try another word.',
  showAll: 'Show the whole menu',
  signature: 'Signature',
  forTwo: 'For 2 people',
  forOne: 'For 1 person',
  serves: (n: number) => (n === 1 ? 'For 1 person' : `For ${n} people`),
  per100g: 'Price per 100 g',
  soldOut: 'Sold out',
  includes: 'Includes',
  close: 'Close',
  openDish: (name: string) => `See details: ${name}`,
  share: 'Share this dish',
  linkCopied: 'Link copied',
  priceNote: 'Prices in Tunisian dinars (DT).',
  address: 'Address',
  phone: 'Phone',
  followUs: 'Follow us',
  photoIllustration: 'Illustrative photo',
  photoCredits: 'Photo credits',
  pendingPhoto: 'Photo coming soon',
}

const dictionaries: Record<Locale, Dictionary> = { fr, ar, en }

export function ui(locale: Locale): Dictionary {
  return dictionaries[locale]
}
