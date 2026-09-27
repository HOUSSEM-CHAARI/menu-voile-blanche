/** Shared save logic for the "new dish" and "edit dish" pages. */
import type { SessionUser } from '../auth'
import type { MenuItem, NewMenuItem } from '../db/schema'
import { ImageError, processImage } from '../images'
import { createDish, setDishImage, updateDish } from './data'
import { parseDishForm, type FieldErrors } from './forms'
import { readCrop, readUpload } from './http'

export interface SaveResult {
  dish?: MenuItem | undefined
  errors: FieldErrors
  /** What the owner typed, to refill the form after an error. */
  submitted: Partial<MenuItem>
  priceText: string
}

const changed = (a: unknown, b: unknown) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)

/** Drafts disappear once the owner edits that text (or confirms having read everything). */
function remainingDrafts(
  before: MenuItem,
  after: Partial<NewMenuItem>,
  clearAll: boolean,
): string[] {
  if (clearAll) return []
  const edited: Record<string, boolean> = {
    nameAr: changed(before.nameAr, after.nameAr),
    nameEn: changed(before.nameEn, after.nameEn),
    description:
      changed(before.descriptionFr, after.descriptionFr) ||
      changed(before.descriptionAr, after.descriptionAr) ||
      changed(before.descriptionEn, after.descriptionEn),
    note:
      changed(before.noteFr, after.noteFr) ||
      changed(before.noteAr, after.noteAr) ||
      changed(before.noteEn, after.noteEn),
    includes: changed(before.includes, after.includes),
    options: changed(before.options, after.options),
  }
  return before.draftFields.filter((key) => !edited[key])
}

export async function saveDish(
  form: FormData,
  user: SessionUser,
  existing?: MenuItem,
): Promise<SaveResult> {
  const parsed = parseDishForm(form)
  const priceText = String(form.get('price') ?? '')
  const errors = { ...parsed.errors }
  let upload: Buffer | null = null
  try {
    upload = await readUpload(form, 'photo')
  } catch (error) {
    errors.photo = error instanceof ImageError ? error.message : 'Photo illisible.'
  }
  let image = null
  if (upload && Object.keys(errors).length === 0) {
    try {
      image = await processImage(upload, 'dish', readCrop(form))
    } catch (error) {
      errors.photo = error instanceof ImageError ? error.message : 'Photo illisible.'
    }
  }
  if (!parsed.data || Object.keys(errors).length > 0) {
    return {
      errors,
      submitted: { ...existing, ...(parsed.data ?? {}) } as Partial<MenuItem>,
      priceText,
    }
  }

  const alt = {
    imageAltFr: parsed.data.nameFr,
    imageAltAr: parsed.data.nameAr ?? null,
    imageAltEn: parsed.data.nameEn ?? null,
  }
  let dish: MenuItem | undefined
  if (existing) {
    const values: Partial<NewMenuItem> = { ...parsed.data }
    values.draftFields = remainingDrafts(existing, values, parsed.clearDrafts)
    if (parsed.clearReview) values.needsOwnerReview = null
    if (existing.imageSource === 'owner') Object.assign(values, alt)
    dish = await updateDish(existing.id, values, user)
  } else {
    dish = await createDish({ ...parsed.data, draftFields: [] }, user)
  }
  if (!dish)
    return {
      errors: { form: 'Le plat n’a pas pu être enregistré.' },
      submitted: parsed.data as Partial<MenuItem>,
      priceText,
    }

  if (image) {
    await setDishImage(dish.id, image, 'owner', user)
    dish = await updateDish(dish.id, alt, user, 'photo')
  } else if (existing?.image && form.get('removePhoto') === 'on') {
    await setDishImage(dish.id, null, null, user)
  }
  return { dish, errors: {}, submitted: {}, priceText }
}
