/** URL slug from a French name: "Pâtes & riz" → "pates-riz", "Œufs de seiche" → "oeufs-de-seiche". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
