import { readFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { db } from '../../src/lib/db/client'
import { menuItems } from '../../src/lib/db/schema'
import { deleteImage, processImage } from '../../src/lib/images'

const FOLDER = 'data/photos/temporary'

export interface PhotoCredit {
  photographer: string
  profile: string
  page: string
  license: string
  alt: string
}

export async function readCredits(): Promise<Record<string, PhotoCredit>> {
  return JSON.parse(await readFile(`${FOLDER}/credits.json`, 'utf8')) as Record<string, PhotoCredit>
}

/**
 * Attaches the temporary free-licence photos (data/photos/temporary) to their dishes through the
 * image pipeline. A dish that already has a photo is left alone, so an owner's photo is never
 * replaced; with `force`, temporary photos are re-processed.
 */
export async function importTemporaryPhotos({ force = false } = {}): Promise<number> {
  const credits = await readCredits()
  let count = 0
  for (const [slug, credit] of Object.entries(credits)) {
    const dish = await db.select().from(menuItems).where(eq(menuItems.slug, slug)).get()
    if (!dish) throw new Error(`No dish for photo ${slug}`)
    if (dish.image && !(force && dish.imageSource === 'temporary')) continue

    const image = await processImage(await readFile(`${FOLDER}/${slug}.jpg`), 'dish')
    if (dish.image && dish.image.key !== image.key) await deleteImage(dish.image)
    await db
      .update(menuItems)
      .set({
        image,
        imageSource: 'temporary',
        imageCredit: `${credit.photographer} — Unsplash (${credit.page})`,
        imageAltFr: `${dish.nameFr} (photo d’illustration)`,
        imageAltAr: dish.nameAr ? `${dish.nameAr} (صورة توضيحية)` : null,
        imageAltEn: dish.nameEn ? `${dish.nameEn} (illustrative photo)` : null,
      })
      .where(eq(menuItems.id, dish.id))
    count += 1
  }
  return count
}
