import type { SessionUser } from '../auth'
import type { Category } from '../db/schema'
import { deleteImage, ImageError, processImage } from '../images'
import { createCategory, updateCategory } from './data'
import { parseCategoryForm, type FieldErrors } from './forms'
import { readCrop, readUpload } from './http'

export async function saveCategory(
  form: FormData,
  user: SessionUser,
  existing?: Category,
): Promise<{ category?: Category; errors: FieldErrors; submitted: Partial<Category> }> {
  const parsed = parseCategoryForm(form)
  const errors = { ...parsed.errors }
  let image = null
  try {
    const upload = await readUpload(form, 'photo')
    if (upload) image = await processImage(upload, 'cover', readCrop(form))
  } catch (error) {
    errors.photo = error instanceof ImageError ? error.message : 'Image illisible.'
  }
  if (!parsed.data || Object.keys(errors).length > 0) {
    return { errors, submitted: { ...existing, ...(parsed.data ?? {}) } as Partial<Category> }
  }

  if (!existing) {
    const category = await createCategory(parsed.data, user)
    if (image) await updateCategory(category.id, { image }, user)
    return { category, errors: {}, submitted: {} }
  }

  const values: Parameters<typeof updateCategory>[1] = { ...parsed.data }
  const nameChanged = (a: string | null | undefined, b: string | null | undefined) =>
    (a ?? '') !== (b ?? '')
  if (form.get('draftsReviewed') === 'on') values.draftFields = []
  else
    values.draftFields = existing.draftFields.filter(
      (key) =>
        !(key === 'nameAr' && nameChanged(existing.nameAr, parsed.data?.nameAr)) &&
        !(key === 'nameEn' && nameChanged(existing.nameEn, parsed.data?.nameEn)),
    )
  if (image) {
    await deleteImage(existing.image)
    values.image = image
  } else if (existing.image && form.get('removePhoto') === 'on') {
    await deleteImage(existing.image)
    values.image = null
  }
  const category = await updateCategory(existing.id, values, user)
  return category
    ? { category, errors: {}, submitted: {} }
    : { errors: { form: 'Échec de l’enregistrement.' }, submitted: {} }
}
