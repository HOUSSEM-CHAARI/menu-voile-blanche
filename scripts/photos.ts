import { writeFile } from 'node:fs/promises'
import { importTemporaryPhotos, readCredits } from './lib/photos'

const count = await importTemporaryPhotos({ force: process.argv.includes('--force') })
console.log(`✓ Photos temporaires : ${count} plat(s) mis à jour`)

// Keep PHOTO-CREDITS.md in sync with data/photos/temporary/credits.json.
const credits = await readCredits()
const rows = Object.entries(credits).map(
  ([slug, c]) =>
    `| \`${slug}\` | [${c.photographer}](${c.profile}) | [Unsplash](${c.page}) | ${c.license} |`,
)
await writeFile(
  'PHOTO-CREDITS.md',
  [
    '# PHOTO-CREDITS — temporary photos',
    '',
    'These photos are **temporary illustrations** until the restaurant supplies its own. Each is marked',
    '« Photo d’illustration » on the menu and « Photo temporaire » in the back office. All come from',
    'Unsplash under the [Unsplash License](https://unsplash.com/license) (free to use, no attribution',
    'required; credited here anyway). They were chosen only where the photo genuinely shows the dish;',
    'every other dish shows the branded sail placeholder.',
    '',
    'Source files: `data/photos/temporary/`. Re-import with `npm run db:photos`.',
    '',
    '| Dish | Photographer | Source | Licence |',
    '|---|---|---|---|',
    ...rows,
    '',
  ].join('\n'),
)
console.log('✓ PHOTO-CREDITS.md')

// PHOTO-SHOT-LIST.md: every dish that needs a real photo, signatures and placeholders first.
const { verifiedCategories, verifiedItems } = await import('../data/menu.verified')
const { slugify } = await import('../src/lib/slug')
const compact = new Set(verifiedCategories.filter((c) => c.layout === 'compact').map((c) => c.slug))
const categoryName = new Map(verifiedCategories.map((c) => [c.slug, c.name.fr]))
const dishes = verifiedItems
  .filter((item) => !compact.has(item.category))
  .map((item) => {
    const slug = slugify(item.name.fr)
    const signature = item.tags?.includes('signature') ?? false
    const status = credits[slug] ? 'Photo temporaire' : 'Aucune photo (voile)'
    const priority = signature ? 1 : credits[slug] ? 3 : 2
    return { item, signature, status, priority }
  })
  .sort((a, b) => a.priority - b.priority)
const angle = (category: string) =>
  ['entrees-froides', 'pates-riz', 'desserts'].includes(category) ? 'Vue de dessus' : '45°'

await writeFile(
  'PHOTO-SHOT-LIST.md',
  [
    '# PHOTO-SHOT-LIST — photos to take',
    '',
    'One photo per dish, taken at the restaurant. Drinks do not need photos.',
    '',
    '## How to take them',
    '',
    '- **Same setting for every dish**: the same table or a plain light surface, the usual plates.',
    '- **Natural daylight**, next to a window or on the terrace in the shade. No flash, no yellow lamps.',
    '- **Angle**: 45° for plated mains; straight from above for salads, pasta and desserts (see the list).',
    '- **Landscape orientation** (phone held horizontally), dish centred with a little space around it:',
    '  the menu crops photos to 4:3.',
    '- **Minimum 2000 px wide** (any recent phone is fine). Wipe the rim of the plate.',
    '- Serve the dish **exactly as a guest receives it** (same garnish and portion).',
    '- Upload each photo in the back office (Plats → the dish → Photo): cropping, sizes and formats are automatic.',
    '',
    '## List (signatures first, then dishes without any photo)',
    '',
    '| # | Dish | Section | Angle | Today | Signature |',
    '|---|---|---|---|---|---|',
    ...dishes.map(
      ({ item, signature, status }, index) =>
        `| ${index + 1} | ${item.name.fr} | ${categoryName.get(item.category)} | ${angle(item.category)} | ${status} | ${signature ? '★' : ''} |`,
    ),
    '',
    `${dishes.length} dishes. Tip: shoot the signatures first, they are the largest photos on the menu.`,
    '',
  ].join('\n'),
)
console.log('✓ PHOTO-SHOT-LIST.md')
