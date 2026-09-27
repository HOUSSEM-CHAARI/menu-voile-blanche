/** Server-side parsing and validation of back-office forms. Nothing from a form is trusted as is. */
import { z } from 'zod'
import { parsePriceInput } from '../price'
import {
  CATEGORY_LAYOUTS,
  KINDS,
  PRICE_UNITS,
  TAGS,
  type ItemOption,
  type LocalizedList,
} from '../types'
import type { CategoryInput, DishInput } from './data'

export type FieldErrors = Record<string, string>

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .transform((v) => v.replace(/\s+/g, ' '))
const optionalText = (max: number) => text(max).transform((v) => (v === '' ? null : v))

function get(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 20)

function collectErrors(result: z.ZodSafeParseResult<unknown>, errors: FieldErrors) {
  if (result.success) return
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form')
    errors[key] ??= issue.message
  }
}

/* ─── Categories ──────────────────────────────────────────────────────────── */

const categorySchema = z.object({
  nameFr: text(80).pipe(z.string().min(1, 'Le nom en français est obligatoire.')),
  nameAr: optionalText(80),
  nameEn: optionalText(80),
  layout: z.enum(CATEGORY_LAYOUTS),
  isVisible: z.boolean(),
})

export function parseCategoryForm(form: FormData): { data?: CategoryInput; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const result = categorySchema.safeParse({
    nameFr: get(form, 'nameFr'),
    nameAr: get(form, 'nameAr'),
    nameEn: get(form, 'nameEn'),
    layout: get(form, 'layout') || 'standard',
    isVisible: form.get('isVisible') === 'on',
  })
  collectErrors(result, errors)
  return result.success ? { data: result.data, errors } : { errors }
}

/* ─── Dishes ──────────────────────────────────────────────────────────────── */

const dishSchema = z.object({
  nameFr: text(120).pipe(z.string().min(1, 'Le nom en français est obligatoire.')),
  nameAr: optionalText(120),
  nameEn: optionalText(120),
  descriptionFr: optionalText(400),
  descriptionAr: optionalText(400),
  descriptionEn: optionalText(400),
  noteFr: optionalText(300),
  noteAr: optionalText(300),
  noteEn: optionalText(300),
  categoryId: z.coerce.number().int().positive('Choisissez une catégorie.'),
  price: z
    .string()
    .transform((v) => parsePriceInput(v))
    .refine((v): v is number => v !== null, 'Prix invalide : écrivez par exemple 42 ou 42,500.'),
  priceUnit: z.enum(PRICE_UNITS),
  serves: z
    .string()
    .transform((v) => (v.trim() === '' ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 20),
      'Entre 1 et 20 personnes.',
    ),
  kind: z.enum(KINDS),
  tags: z.array(z.enum(TAGS)),
  isAvailable: z.boolean(),
  isVisible: z.boolean(),
})

export interface DishFormResult {
  data?: DishInput
  errors: FieldErrors
  clearReview: boolean
  clearDrafts: boolean
}

export function parseDishForm(form: FormData): DishFormResult {
  const errors: FieldErrors = {}
  const result = dishSchema.safeParse({
    nameFr: get(form, 'nameFr'),
    nameAr: get(form, 'nameAr'),
    nameEn: get(form, 'nameEn'),
    descriptionFr: get(form, 'descriptionFr'),
    descriptionAr: get(form, 'descriptionAr'),
    descriptionEn: get(form, 'descriptionEn'),
    noteFr: get(form, 'noteFr'),
    noteAr: get(form, 'noteAr'),
    noteEn: get(form, 'noteEn'),
    categoryId: get(form, 'categoryId'),
    price: get(form, 'price'),
    priceUnit: get(form, 'priceUnit') || 'item',
    serves: get(form, 'serves'),
    kind: get(form, 'kind') || 'other',
    tags: form.getAll('tags').map(String),
    isAvailable: form.get('isAvailable') === 'on',
    isVisible: form.get('isVisible') === 'on',
  })
  collectErrors(result, errors)

  const includesFr = lines(get(form, 'includesFr'))
  const includes: LocalizedList | null = includesFr.length
    ? { fr: includesFr, ar: lines(get(form, 'includesAr')), en: lines(get(form, 'includesEn')) }
    : null

  const options: ItemOption[] = []
  for (const index of [0, 1]) {
    const labelFr = get(form, `option${index}LabelFr`).trim()
    const choicesFr = lines(get(form, `option${index}ChoicesFr`))
    if (!labelFr && choicesFr.length === 0) continue
    if (!labelFr || choicesFr.length === 0) {
      errors[`option${index}`] =
        'Une option a besoin d’un titre et d’au moins un choix (en français).'
      continue
    }
    const choicesAr = lines(get(form, `option${index}ChoicesAr`))
    const choicesEn = lines(get(form, `option${index}ChoicesEn`))
    options.push({
      label: {
        fr: labelFr,
        ar: get(form, `option${index}LabelAr`).trim() || null,
        en: get(form, `option${index}LabelEn`).trim() || null,
      },
      choices: choicesFr.map((fr, i) => ({
        fr,
        ar: choicesAr[i] ?? null,
        en: choicesEn[i] ?? null,
      })),
    })
  }

  const clearReview = form.get('reviewed') === 'on'
  const clearDrafts = form.get('draftsReviewed') === 'on'
  if (!result.success || Object.keys(errors).length > 0) return { errors, clearReview, clearDrafts }
  const { price, ...rest } = result.data
  return {
    data: { ...rest, price, includes, options },
    errors,
    clearReview,
    clearDrafts,
  }
}

/* ─── Settings ────────────────────────────────────────────────────────────── */

const url = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\/\S+$/.test(v),
    'Adresse web invalide (commence par https://).',
  )

const settingsSchema = z.object({
  restaurantName: text(80).pipe(z.string().min(1, 'Le nom est obligatoire.')),
  taglineFr: text(120),
  taglineAr: optionalText(120),
  taglineEn: optionalText(120),
  phone: text(40),
  whatsapp: text(40),
  addressFr: text(200),
  addressAr: optionalText(200),
  addressEn: optionalText(200),
  city: text(80),
  mapUrl: url,
  openingHoursFr: text(300),
  openingHoursAr: optionalText(300),
  openingHoursEn: optionalText(300),
  instagram: url,
  facebook: url,
  baseUrl: url.refine((v) => v !== '', 'L’adresse du menu est obligatoire (pour le QR code).'),
})

export type SettingsInput = z.infer<typeof settingsSchema>

export function parseSettingsForm(form: FormData): { data?: SettingsInput; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const raw = Object.fromEntries(
    Object.keys(settingsSchema.shape).map((key) => [key, get(form, key)]),
  )
  const result = settingsSchema.safeParse(raw)
  collectErrors(result, errors)
  return result.success ? { data: result.data, errors } : { errors }
}

export const SETTINGS_FIELDS = Object.keys(settingsSchema.shape) as (keyof SettingsInput)[]

/* ─── Password ────────────────────────────────────────────────────────────── */

export function parsePasswordForm(form: FormData): {
  current: string
  next: string
  errors: FieldErrors
} {
  const errors: FieldErrors = {}
  const current = get(form, 'current')
  const next = get(form, 'next')
  if (!current) errors.current = 'Entrez votre mot de passe actuel.'
  if (next.length < 10) errors.next = 'Au moins 10 caractères.'
  if (next !== get(form, 'confirm'))
    errors.confirm = 'Les deux mots de passe ne sont pas identiques.'
  return { current, next, errors }
}

export function formId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
