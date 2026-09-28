/** Regenerates CONTENT-CHANGES.md from data/menu.verified.ts. Usage: npm run docs:content */
import { writeFileSync } from 'node:fs'
import { verifiedCategories, verifiedItems } from '../data/menu.verified'
import { formatPrice } from '../src/lib/price'

const NBSP = new RegExp(String.fromCharCode(0xa0), 'g')
const categoryName = new Map(verifiedCategories.map((c) => [c.slug, c.name.fr]))
const cell = (text: string | null | undefined) => (text ?? '—').replace(/\|/g, '\\|')

const spelling = verifiedItems.filter((item) => item.printed.fr !== item.name.fr)
const arabic = verifiedItems.filter((item) => item.printed.ar !== item.name.ar)
const flagged = verifiedItems.filter((item) => item.needsOwnerReview)

const lines = [
  '# CONTENT-CHANGES — corrections to approve',
  '',
  'Every difference between the printed menu (photos in `docs/menu-photos/`) and the digital menu.',
  'Generated from `data/menu.verified.ts` with `npm run docs:content`. Nothing here changes a price.',
  '',
  '## 1. Decisions taken (flagged "à vérifier" in the back office)',
  '',
  '| Dish | Decision | Why |',
  '|---|---|---|',
  '| Côtelettes d’agneau | Corrected spelling | Printed « Côtlettes d’Agneau » |',
  '| Poulpe en sauce (arabe) | « مثومة قرنيط » | Printed word unreadable on the photo: « مثاومة » or « متاومة » |',
  '| Filet de veau aux trois poivres / aux champignons (arabe) | « لحم العجل » | Printed « لحم الضل », most likely a misprint for veal |',
  '| Fruits de saison | 12 DT kept | First digit hidden by glare on the photo |',
  '| Sorbet citron | 8 DT kept | Partly hidden by glare |',
  '| Poisson du jour grillé | 14 DT / 100 g for all species | Question: do mulet, sargue and serre have their own price? |',
  '| Poisson du jour grillé | « sauvage », not « bio » | Printed « Biologique » next to « طبيعي »: to confirm |',
  '',
  '## 2. French names corrected (spelling, agreement, accents)',
  '',
  '| Section | Printed | Digital menu |',
  '|---|---|---|',
  ...spelling.map(
    (item) =>
      `| ${cell(categoryName.get(item.category))} | ${cell(item.printed.fr)} | ${cell(item.name.fr)} |`,
  ),
  '',
  'Also corrected inside compositions: « Fruit de Mer en Sauce » → « Fruits de mer en sauce »,',
  '« Spaghetti Fruit de Mer » → « Spaghetti aux fruits de mer », « Beignet de Crevette » → « Beignets de crevettes »,',
  '« Crevette Farcies » → « Crevettes farcies », « 2 Brochettes F.Mer Grillés » → « 2 brochettes de fruits de mer grillées ».',
  '',
  'The Trésor’s « (2 Personnes) » is shown as a « Pour 2 personnes » badge instead of being part of the name.',
  'The « (شخص واحد) » of the two Royale dishes is shown as a « Pour 1 personne » badge.',
  '',
  '## 3. Arabic names that differ from the print',
  '',
  '| Dish | Printed | Digital menu |',
  '|---|---|---|',
  ...arabic.map(
    (item) => `| ${cell(item.name.fr)} | ${cell(item.printed.ar)} | ${cell(item.name.ar)} |`,
  ),
  '',
  '## 4. Section names',
  '',
  'The printed menu has no Arabic or English section names; all of them are drafts.',
  '« LES PÂTES » (which also lists the rice) becomes « Pâtes & riz ».',
  '',
  '| Printed | French | Arabic (draft) | English (draft) |',
  '|---|---|---|---|',
  ...verifiedCategories.map(
    (c) =>
      `| ${c.slug === 'pates-riz' ? 'LES PÂTES' : c.slug === 'mollusques-crustaces' ? 'LES MOLLUSQUES ET CRUSTACÉS' : `LES ${c.name.fr.toUpperCase()}`} | ${c.name.fr} | ${c.name.ar} | ${c.name.en} |`,
  ),
  '',
  '## 5. Drafts to approve',
  '',
  '- **All English text** (names, descriptions, badges): written for tourists; Tunisian names are kept with a short explanation.',
  '- **All descriptions** in the three languages: short, based only on the dish name and printed composition. No ingredient or allergen was added.',
  '- **Arabic text not on the printed menu**: section names, descriptions, options, included items, « مياه غازية » (Eau pétillante), and the tagline.',
  '',
  '## 6. Dishes flagged for the owner',
  '',
  '| Dish | Price | Question |',
  '|---|---|---|',
  ...flagged.map(
    (item) =>
      `| ${cell(item.name.fr)} | ${formatPrice(item.price, 'fr', item.priceUnit ?? 'item').replace(NBSP, ' ')} | ${cell(item.needsOwnerReview)} |`,
  ),
  '',
  '## 7. Not added',
  '',
  'The dessert page shows photos of ice-cream sundaes that match no listed dessert. They were not added.',
  'Question for the owner: are sundaes on offer, and at what price?',
  '',
]

writeFileSync('CONTENT-CHANGES.md', lines.join('\n'))
console.log(
  `✓ CONTENT-CHANGES.md: ${spelling.length} spellings, ${arabic.length} Arabic changes, ${flagged.length} flagged dishes`,
)
