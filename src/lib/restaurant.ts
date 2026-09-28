import type { Settings } from './db/schema'
import { pick, type LocalizedText } from './i18n'
import type { Locale } from './types'

export interface RestaurantInfo {
  name: string
  tagline: LocalizedText
  address: LocalizedText
  hours: LocalizedText
  phone: string
  phoneHref: string | null
  whatsappHref: string | null
  mapUrl: string | null
  instagram: string | null
  facebook: string | null
}

/** "+216 22 287 799" → "tel:+21622287799"; null when no phone is set. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.length >= 8 ? `tel:${digits}` : null
}

export function whatsappHref(number: string): string | null {
  const digits = number.replace(/\D/g, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

/** Restaurant details from Settings, in the page language (French fallback). */
export function restaurantInfo(settings: Settings, locale: Locale): RestaurantInfo {
  return {
    name: settings.restaurantName,
    tagline: pick(locale, {
      fr: settings.taglineFr,
      ar: settings.taglineAr,
      en: settings.taglineEn,
    }),
    address: pick(locale, {
      fr: settings.addressFr,
      ar: settings.addressAr,
      en: settings.addressEn,
    }),
    hours: pick(locale, {
      fr: settings.openingHoursFr,
      ar: settings.openingHoursAr,
      en: settings.openingHoursEn,
    }),
    phone: settings.phone,
    phoneHref: telHref(settings.phone),
    whatsappHref: whatsappHref(settings.whatsapp),
    mapUrl: settings.mapUrl || null,
    instagram: settings.instagram || null,
    facebook: settings.facebook || null,
  }
}
