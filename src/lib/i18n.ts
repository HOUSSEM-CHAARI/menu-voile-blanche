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
  add: 'Ajouter',
  addToCart: (name: string) => `Ajouter au panier : ${name}`,
  chooseOptions: (name: string) => `Choisir et ajouter : ${name}`,
  inCart: (n: number) => `${n} dans le panier`,
  added: 'Ajouté au panier',
  cart: 'Mon panier',
  viewCart: 'Voir le panier',
  cartItems: { one: '{n} article', other: '{n} articles' } as Plural,
  cartEmpty: 'Votre panier est vide. Touchez + sur un plat pour l’ajouter.',
  cartHint: 'Préparez votre commande ici, puis montrez cet écran au serveur.',
  quantity: 'Quantité',
  increase: 'Un de plus',
  decrease: 'Un de moins',
  table: 'N° de table',
  tablePlaceholder: 'Ex. 12',
  note: 'Remarque pour la cuisine',
  notePlaceholder: 'Cuisson, allergies, sans oignon…',
  total: 'Total estimé',
  weighed: '+ poisson au poids : prix annoncé à table',
  showWaiter: 'Montrer au serveur',
  clearCart: 'Vider le panier',
  clearConfirm: 'Vider le panier ?',
  order: 'Commande',
  tableNumber: 'Table {n}',
  back: 'Retour',
  orderTaken: 'Commande prise : vider le panier',
  cartNotice: 'Rien n’est envoyé en ligne : le serveur prend votre commande à table.',
}

/** Plural forms keyed by Intl.PluralRules categories, with {n} for the number. */
type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

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
  add: 'أضف',
  addToCart: (name: string) => `أضف إلى السلة: ${name}`,
  chooseOptions: (name: string) => `اختر وأضف: ${name}`,
  inCart: (n: number) => `${n} في السلة`,
  added: 'أُضيف إلى السلة',
  cart: 'سلّتي',
  viewCart: 'عرض السلة',
  cartItems: {
    zero: '{n} عنصر',
    one: 'عنصر واحد',
    two: 'عنصران',
    few: '{n} عناصر',
    many: '{n} عنصرًا',
    other: '{n} عنصر',
  },
  cartEmpty: 'سلّتك فارغة. اضغط + على طبق لإضافته.',
  cartHint: 'جهّز طلبك هنا، ثم اعرض هذه الشاشة على النادل.',
  quantity: 'الكمية',
  increase: 'واحد إضافي',
  decrease: 'واحد أقل',
  table: 'رقم الطاولة',
  tablePlaceholder: 'مثال: 12',
  note: 'ملاحظة للمطبخ',
  notePlaceholder: 'درجة الطهي، الحساسية، بدون بصل…',
  total: 'المجموع التقريبي',
  weighed: '+ السمك بالوزن: السعر يُعلن على الطاولة',
  showWaiter: 'اعرض على النادل',
  clearCart: 'إفراغ السلة',
  clearConfirm: 'إفراغ السلة؟',
  order: 'الطلب',
  tableNumber: 'الطاولة {n}',
  back: 'رجوع',
  orderTaken: 'تم أخذ الطلب: إفراغ السلة',
  cartNotice: 'لا يُرسل أي شيء عبر الإنترنت: النادل يأخذ طلبك على الطاولة.',
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
  add: 'Add',
  addToCart: (name: string) => `Add to order: ${name}`,
  chooseOptions: (name: string) => `Choose and add: ${name}`,
  inCart: (n: number) => `${n} in your order`,
  added: 'Added to your order',
  cart: 'My order',
  viewCart: 'View order',
  cartItems: { one: '{n} item', other: '{n} items' },
  cartEmpty: 'Your order is empty. Tap + on a dish to add it.',
  cartHint: 'Build your order here, then show this screen to the waiter.',
  quantity: 'Quantity',
  increase: 'One more',
  decrease: 'One less',
  table: 'Table no.',
  tablePlaceholder: 'e.g. 12',
  note: 'Note for the kitchen',
  notePlaceholder: 'Cooking, allergies, no onion…',
  total: 'Estimated total',
  weighed: '+ fish by weight: price given at the table',
  showWaiter: 'Show the waiter',
  clearCart: 'Clear order',
  clearConfirm: 'Clear your order?',
  order: 'Order',
  tableNumber: 'Table {n}',
  back: 'Back',
  orderTaken: 'Order taken: clear',
  cartNotice: 'Nothing is sent online: the waiter takes your order at the table.',
}

const dictionaries: Record<Locale, Dictionary> = { fr, ar, en }

export function ui(locale: Locale): Dictionary {
  return dictionaries[locale]
}
