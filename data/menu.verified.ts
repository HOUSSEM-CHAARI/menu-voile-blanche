/**
 * Menu data verified line by line against the four printed-menu photos in docs/menu-photos/.
 * Prices are integer millimes (42000 = 42 DT).
 *
 * - `printed` keeps the text exactly as printed, so CONTENT-CHANGES.md can show every correction.
 * - French names are corrected spellings; Arabic names are as printed unless noted in
 *   `needsOwnerReview`. All English text, all descriptions, all Arabic category names and any
 *   Arabic text that is not on the printed menu are drafts for the owner to approve.
 */
import type { ItemOption, Kind, Localized, LocalizedList, PriceUnit, Tag } from '../src/lib/types'

export interface VerifiedCategory {
  slug: string
  name: Localized
}

export interface VerifiedItem {
  category: string
  name: Localized
  printed: { fr: string; ar: string | null }
  description: Localized
  note?: Localized
  price: number
  priceUnit?: PriceUnit
  serves?: number
  includes?: LocalizedList
  options?: ItemOption[]
  tags?: Tag[]
  kind: Kind
  needsOwnerReview?: string
  /** True when the Arabic name is not printed on the menu (a proposal). */
  arabicIsDraft?: boolean
}

export const verifiedCategories: VerifiedCategory[] = [
  {
    slug: 'entrees-chaudes',
    name: { fr: 'Entrées chaudes', ar: 'المقبلات الساخنة', en: 'Hot starters' },
  },
  {
    slug: 'entrees-froides',
    name: { fr: 'Entrées froides', ar: 'المقبلات الباردة', en: 'Cold starters' },
  },
  {
    slug: 'mollusques-crustaces',
    name: { fr: 'Mollusques & crustacés', ar: 'غلال البحر', en: 'Shellfish & seafood' },
  },
  { slug: 'poissons', name: { fr: 'Poissons', ar: 'الأسماك', en: 'Fish' } },
  { slug: 'pates-riz', name: { fr: 'Pâtes & riz', ar: 'المعكرونة والأرز', en: 'Pasta & rice' } },
  { slug: 'viandes', name: { fr: 'Viandes', ar: 'اللحوم', en: 'Meat' } },
  { slug: 'volailles', name: { fr: 'Volailles', ar: 'الدواجن', en: 'Poultry' } },
  { slug: 'desserts', name: { fr: 'Desserts', ar: 'التحلية', en: 'Desserts' } },
  { slug: 'boissons', name: { fr: 'Boissons', ar: 'المشروبات', en: 'Drinks' } },
]

const FRUITS_DE_MER_EN_SAUCE: Localized = {
  fr: 'Fruits de mer en sauce',
  ar: 'غلال البحر بالصالصة',
  en: 'Seafood in sauce',
}
const SPAGHETTI_FRUITS_DE_MER: Localized = {
  fr: 'Spaghetti aux fruits de mer',
  ar: 'سباقتي بغلال البحر',
  en: 'Seafood spaghetti',
}

export const verifiedItems: VerifiedItem[] = [
  // ── Entrées chaudes ────────────────────────────────────────────────
  {
    category: 'entrees-chaudes',
    name: {
      fr: 'Tchich au poulpe',
      ar: 'تشيش بالقرنيط',
      en: 'Tchich with octopus — Tunisian barley soup',
    },
    printed: { fr: 'Tchich au Poulpes', ar: 'تشيش بالقرنيط' },
    description: {
      fr: 'Soupe tunisienne d’orge au poulpe.',
      ar: 'شربة الشعير التونسية بالقرنيط.',
      en: 'Tunisian barley soup with octopus.',
    },
    price: 9000,
    kind: 'seafood',
  },
  {
    category: 'entrees-chaudes',
    name: {
      fr: 'Brik aux fruits de mer',
      ar: 'بريك بغلال البحر',
      en: 'Seafood brik — crisp pastry parcel',
    },
    printed: { fr: 'Brik au fruits de Mer', ar: 'بريك بغلال البحر' },
    description: {
      fr: 'Feuille de brik croustillante farcie aux fruits de mer.',
      ar: 'ورقة بريك مقرمشة محشوة بغلال البحر.',
      en: 'Crisp brik pastry filled with seafood.',
    },
    price: 9000,
    kind: 'seafood',
  },
  {
    category: 'entrees-chaudes',
    name: { fr: 'Brik au thon', ar: 'بريك بالتن', en: 'Tuna brik — crisp pastry parcel' },
    printed: { fr: 'Brik au Thon', ar: 'بريك بالتن' },
    description: {
      fr: 'Feuille de brik croustillante farcie au thon.',
      ar: 'ورقة بريك مقرمشة محشوة بالتن.',
      en: 'Crisp brik pastry filled with tuna.',
    },
    price: 6000,
    kind: 'fish',
  },
  {
    category: 'entrees-chaudes',
    name: { fr: 'Assiette de frites', ar: 'بطاطا مقلية', en: 'French fries' },
    printed: { fr: 'Plat Frites', ar: 'بطاطا مقلية' },
    description: {
      fr: 'Pommes de terre frites.',
      ar: 'بطاطا مقلية.',
      en: 'A plate of fried potatoes.',
    },
    price: 6000,
    kind: 'other',
  },

  // ── Entrées froides ────────────────────────────────────────────────
  {
    category: 'entrees-froides',
    name: {
      fr: 'Salade du pêcheur',
      ar: 'سلاطة بغلال البحر',
      en: 'Fisherman’s salad — seafood salad',
    },
    printed: { fr: 'Salade Pécheur', ar: 'سلاطة بغلال البحر' },
    description: {
      fr: 'Salade aux fruits de mer.',
      ar: 'سلاطة بغلال البحر.',
      en: 'Salad with seafood.',
    },
    price: 25000,
    kind: 'seafood',
  },
  {
    category: 'entrees-froides',
    name: { fr: 'Salade variée', ar: 'سلاطة متنوعة', en: 'Mixed salad' },
    printed: { fr: 'Salade Variées', ar: 'سلاطة متنوعة' },
    description: {
      fr: 'Assortiment de légumes en salade.',
      ar: 'تشكيلة من الخضر.',
      en: 'An assortment of salad vegetables.',
    },
    price: 10000,
    kind: 'other',
  },
  {
    category: 'entrees-froides',
    name: {
      fr: 'Salade de tomates au thon',
      ar: 'سلاطة طماطم مع التونة',
      en: 'Tomato salad with tuna',
    },
    printed: { fr: 'Salade de Tomates au Thon', ar: 'سلاطة طماطم مع التونة' },
    description: { fr: 'Tomates et thon.', ar: 'طماطم وتونة.', en: 'Tomatoes and tuna.' },
    price: 8000,
    kind: 'fish',
  },
  {
    category: 'entrees-froides',
    name: {
      fr: 'Salade méchouia',
      ar: 'سلاطة مشوية',
      en: 'Méchouia salad — grilled pepper and tomato',
    },
    printed: { fr: 'Salade Mechouia', ar: 'سلاطة مشوية' },
    description: {
      fr: 'Poivrons et tomates grillés, à la tunisienne.',
      ar: 'فلفل وطماطم مشوية على الطريقة التونسية.',
      en: 'Grilled peppers and tomatoes, Tunisian style.',
    },
    price: 10000,
    kind: 'other',
  },

  // ── Mollusques & crustacés ─────────────────────────────────────────
  {
    category: 'mollusques-crustaces',
    name: { fr: 'Trésor fruits de mer', ar: 'كنوز غلال البحر', en: 'Seafood treasure' },
    printed: { fr: 'Trésor Fruits de Mer (2 Personnes)', ar: 'كنوز غلال البحر لشخصين' },
    description: {
      fr: 'Le grand plateau de la mer, à partager à deux.',
      ar: 'طبق غلال البحر الكبير لشخصين.',
      en: 'The big seafood feast, for two to share.',
    },
    price: 88000,
    serves: 2,
    options: [
      {
        label: { fr: 'Plat au choix', ar: 'طبق حسب اختيارك', en: 'Your choice of' },
        choices: [FRUITS_DE_MER_EN_SAUCE, SPAGHETTI_FRUITS_DE_MER],
      },
    ],
    includes: {
      fr: [
        'Salade de fruits de mer',
        'Beignets de crevettes',
        'Crevettes farcies',
        '2 brochettes de fruits de mer grillées',
      ],
      ar: ['سلاطة بغلال البحر', 'كروفات مبطنة', 'كروفات محشوة', '2 سفود غلال البحر مشوي'],
      en: ['Seafood salad', 'Shrimp fritters', 'Stuffed shrimp', '2 grilled seafood skewers'],
    },
    tags: ['signature', 'forTwo'],
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: {
      fr: 'Fruits de mer sautés',
      ar: 'غلال البحر مقلي مع الثوم',
      en: 'Sautéed seafood with garlic',
    },
    printed: { fr: 'Fruits de Mer Sautés', ar: 'غلال البحر مقلي مع الثوم' },
    description: {
      fr: 'Fruits de mer sautés à l’ail.',
      ar: 'غلال البحر مقلي مع الثوم.',
      en: 'Seafood sautéed with garlic.',
    },
    price: 48000,
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: {
      fr: 'Fruits de mer sautés Royale',
      ar: 'غلال البحر مقلي مع الثوم ملكي',
      en: 'Royal sautéed seafood with garlic',
    },
    printed: { fr: 'Fruits de Mer Sautés Royale', ar: 'غلال البحر مقلي مع الثوم ملكي (شخص واحد)' },
    description: {
      fr: 'Crevettes, poulpe, seiche et œufs de seiche sautés à l’ail.',
      ar: 'كروفات وقرنيط وسيبية وبيض الحبار مقلية مع الثوم.',
      en: 'Shrimp, octopus, cuttlefish and cuttlefish roe, sautéed with garlic.',
    },
    price: 60000,
    serves: 1,
    includes: {
      fr: ['Crevettes', 'Poulpe', 'Seiche', 'Œufs de seiche'],
      ar: ['كروفات', 'قرنيط', 'سيبية', 'بيض الحبار'],
      en: ['Shrimp', 'Octopus', 'Cuttlefish', 'Cuttlefish roe'],
    },
    tags: ['royale', 'signature'],
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: {
      fr: 'Œufs de seiche sautés ou panés',
      ar: 'بيض الحبار مبطن أو مقلي',
      en: 'Cuttlefish roe, sautéed or breaded',
    },
    printed: { fr: 'Oeufs de Seiches Sauté ou Panée', ar: 'بيض الحبار مبطن أو مقلي' },
    description: {
      fr: 'Œufs de seiche, préparés selon votre choix.',
      ar: 'بيض الحبار حسب اختيارك.',
      en: 'Cuttlefish roe, cooked the way you choose.',
    },
    price: 58000,
    options: [
      {
        label: { fr: 'Préparation', ar: 'طريقة التحضير', en: 'Cooked' },
        choices: [
          { fr: 'Sautés', ar: 'مقلي', en: 'Sautéed' },
          { fr: 'Panés', ar: 'مبطن', en: 'Breaded' },
        ],
      },
    ],
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: { fr: 'Poulpe en sauce', ar: 'مثومة قرنيط', en: 'Octopus in sauce' },
    printed: { fr: 'Poulpes en Sauce', ar: 'مثاومة قرنيط (lecture incertaine : مثاومة / متاومة)' },
    description: {
      fr: 'Poulpe cuisiné en sauce.',
      ar: 'قرنيط مطبوخ في الصالصة.',
      en: 'Octopus cooked in sauce.',
    },
    price: 46000,
    kind: 'seafood',
    needsOwnerReview:
      'Nom arabe : « مثومة قرنيط » retenu. Sur le menu imprimé, le mot est illisible (« مثاومة » ou « متاومة »).',
  },
  {
    category: 'mollusques-crustaces',
    name: FRUITS_DE_MER_EN_SAUCE,
    printed: { fr: 'Fruits de Mer en Sauce', ar: 'غلال البحر بالصالصة' },
    description: {
      fr: 'Fruits de mer cuisinés en sauce.',
      ar: 'غلال البحر مطبوخة في الصالصة.',
      en: 'Seafood cooked in sauce.',
    },
    price: 45000,
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: {
      fr: 'Ojja aux fruits de mer',
      ar: 'عجة بغلال البحر',
      en: 'Seafood ojja — spicy tomato and egg stew',
    },
    printed: { fr: 'Ojja au Fruits de Mer', ar: 'عجة بغلال البحر' },
    description: {
      fr: 'Plat tunisien épicé à la tomate et aux œufs, aux fruits de mer.',
      ar: 'عجة تونسية حارة بالطماطم والبيض وغلال البحر.',
      en: 'Spicy Tunisian tomato and egg stew with seafood.',
    },
    price: 45000,
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: {
      fr: 'Brochettes de fruits de mer grillées',
      ar: 'سفود غلال البحر',
      en: 'Grilled seafood skewers',
    },
    printed: { fr: 'Brochettes Fruits de Mer Grillé', ar: 'سفود غلال البحر' },
    description: {
      fr: 'Brochettes de fruits de mer, grillées.',
      ar: 'سفود غلال البحر مشوي.',
      en: 'Seafood skewers, grilled.',
    },
    price: 43000,
    tags: ['grilled'],
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: { fr: 'Gratin de fruits de mer', ar: 'غراتان غلال البحر', en: 'Seafood gratin' },
    printed: { fr: 'Gratin au Fruits de Mer', ar: 'غراتان غلال البحر' },
    description: {
      fr: 'Fruits de mer gratinés au four.',
      ar: 'غلال البحر مقرمشة في الفرن.',
      en: 'Seafood baked au gratin.',
    },
    price: 42000,
    kind: 'seafood',
  },
  {
    category: 'mollusques-crustaces',
    name: { fr: 'Duo de crevettes', ar: 'كروفات مبطنة و محشوة', en: 'Shrimp duo' },
    printed: {
      fr: 'Duo de Crevette (Crevettes farcies + Beignet de Crevettes)',
      ar: 'كروفات مبطنة و محشوة',
    },
    description: {
      fr: 'Crevettes farcies et beignets de crevettes.',
      ar: 'كروفات محشوة وكروفات مبطنة.',
      en: 'Stuffed shrimp and shrimp fritters.',
    },
    price: 40000,
    includes: {
      fr: ['Crevettes farcies', 'Beignets de crevettes'],
      ar: ['كروفات محشوة', 'كروفات مبطنة'],
      en: ['Stuffed shrimp', 'Shrimp fritters'],
    },
    kind: 'seafood',
  },

  // ── Poissons ───────────────────────────────────────────────────────
  {
    category: 'poissons',
    name: { fr: 'Poisson du jour grillé', ar: 'سمك اليوم مشوي', en: 'Grilled catch of the day' },
    printed: {
      fr: 'Poisson du Jour Grillé Biologique (100g) (+Tchich au Poulpe) (Loup - Dorade - Rouget) … (Mulet - Sargue - Serre …….)',
      ar: 'سمك اليوم مشوي طبيعي 100غ + تشيش بالقرنيط (قاروص - وراطة - ملو حجر) … (إميلة - كحلة - قراض….)',
    },
    description: {
      fr: 'Poisson sauvage grillé, servi avec un tchich au poulpe.',
      ar: 'سمك طبيعي مشوي، يقدم مع تشيش بالقرنيط.',
      en: 'Wild-caught fish, grilled, served with octopus tchich.',
    },
    note: {
      fr: 'Le poisson est pesé et son prix annoncé à table : demandez à votre serveur.',
      ar: 'يوزن السمك ويحدد سعره على الطاولة: اسألوا النادل.',
      en: 'Your fish is weighed and priced at the table — ask your waiter.',
    },
    price: 14000,
    priceUnit: 'per100g',
    includes: { fr: ['Tchich au poulpe'], ar: ['تشيش بالقرنيط'], en: ['Octopus tchich'] },
    options: [
      {
        label: { fr: 'Selon l’arrivage', ar: 'حسب المتوفر', en: 'Depending on the catch' },
        choices: [
          { fr: 'Loup', ar: 'قاروص', en: 'Sea bass (loup)' },
          { fr: 'Dorade', ar: 'وراطة', en: 'Sea bream (dorade)' },
          { fr: 'Rouget', ar: 'ملو حجر', en: 'Red mullet (rouget)' },
          { fr: 'Mulet', ar: 'إميلة', en: 'Grey mullet (mulet)' },
          { fr: 'Sargue', ar: 'كحلة', en: 'White sea bream (sargue)' },
          { fr: 'Serre', ar: 'قراض', en: 'Serre' },
        ],
      },
    ],
    tags: ['catchOfTheDay', 'grilled', 'signature'],
    kind: 'fish',
    needsOwnerReview: [
      'Prix unique de 14 DT / 100 g appliqué à toutes les espèces pour l’instant.',
      '1) « Biologique » / « طبيعي » : signifie-t-il « sauvage » (pêché, non élevé) ? Le menu affiche « sauvage », jamais « bio ».',
      '2) Une zone grattée sépare les deux groupes d’espèces : mulet, sargue et serre ont-ils un autre prix aux 100 g ?',
      '3) Confirmer la correspondance des noms arabes avec les espèces françaises.',
    ].join(' '),
  },
  {
    category: 'poissons',
    name: {
      fr: 'Filet de loup aux champignons',
      ar: 'شرائح قاروص بالفقاع',
      en: 'Sea bass fillet with mushrooms',
    },
    printed: { fr: 'Filet de loup au Champignons', ar: 'شرائح قاروص بالفقاع' },
    description: {
      fr: 'Filet de loup, sauce aux champignons.',
      ar: 'شرائح قاروص بالفقاع.',
      en: 'Sea bass fillet with a mushroom sauce.',
    },
    price: 38000,
    kind: 'fish',
  },
  {
    category: 'poissons',
    name: { fr: 'Sole meunière', ar: 'انداس مقلي', en: 'Sole meunière — pan-fried sole' },
    printed: { fr: 'Sole Meunière', ar: 'انداس مقلي' },
    description: {
      fr: 'Sole poêlée à la meunière.',
      ar: 'انداس مقلي.',
      en: 'Sole, pan-fried meunière style.',
    },
    price: 40000,
    kind: 'fish',
  },
  {
    category: 'poissons',
    name: { fr: 'Sole aux amandes', ar: 'انداس مقلي مبطن باللوز', en: 'Sole with almonds' },
    printed: { fr: 'Sole au Amende', ar: 'انداس مقلي مبطن باللوز' },
    description: {
      fr: 'Sole poêlée en croûte d’amandes.',
      ar: 'انداس مقلي مبطن باللوز.',
      en: 'Sole pan-fried in an almond crust.',
    },
    price: 43000,
    kind: 'fish',
  },

  // ── Pâtes & riz ────────────────────────────────────────────────────
  {
    category: 'pates-riz',
    name: { fr: 'Riz aux fruits de mer', ar: 'أرز بغلال البحر', en: 'Seafood rice' },
    printed: { fr: 'Riz Fruits de Mer', ar: 'أرز بغلال البحر' },
    description: {
      fr: 'Riz cuisiné aux fruits de mer.',
      ar: 'أرز مطبوخ بغلال البحر.',
      en: 'Rice cooked with seafood.',
    },
    price: 52000,
    kind: 'seafood',
  },
  {
    category: 'pates-riz',
    name: { fr: 'Penne au mérou', ar: 'معكرونة بالمناني', en: 'Penne with grouper' },
    printed: { fr: 'Penne au Mérou', ar: 'معكرونة بالمناني' },
    description: {
      fr: 'Penne au mérou.',
      ar: 'معكرونة بسمك المناني.',
      en: 'Penne pasta with grouper.',
    },
    price: 52000,
    kind: 'fish',
  },
  {
    category: 'pates-riz',
    name: SPAGHETTI_FRUITS_DE_MER,
    printed: { fr: 'Spaghetti au Fruits de Mer', ar: 'سباقتي بغلال البحر' },
    description: {
      fr: 'Spaghetti aux fruits de mer.',
      ar: 'سباقتي بغلال البحر.',
      en: 'Spaghetti with seafood.',
    },
    price: 45000,
    kind: 'seafood',
  },
  {
    category: 'pates-riz',
    name: {
      fr: 'Spaghetti aux fruits de mer Royale',
      ar: 'سباقتي بغلال البحر ملكي',
      en: 'Royal seafood spaghetti',
    },
    printed: {
      fr: 'Spaghetti au Fruits de Mer Royale (Spaghetti au fruits de mer + oeufs de seiche)',
      ar: 'سباقتي بغلال البحر ملكي (شخص واحد)',
    },
    description: {
      fr: 'Spaghetti aux fruits de mer et œufs de seiche.',
      ar: 'سباقتي بغلال البحر وبيض الحبار.',
      en: 'Seafood spaghetti with cuttlefish roe.',
    },
    price: 57000,
    serves: 1,
    includes: {
      fr: ['Spaghetti aux fruits de mer', 'Œufs de seiche'],
      ar: ['سباقتي بغلال البحر', 'بيض الحبار'],
      en: ['Seafood spaghetti', 'Cuttlefish roe'],
    },
    tags: ['royale', 'signature'],
    kind: 'seafood',
  },
  {
    category: 'pates-riz',
    name: {
      fr: 'Spaghetti aux fruits de mer, sauce blanche',
      ar: 'سباقتي بغلال البحر (صالصة بيضاء)',
      en: 'Seafood spaghetti, white sauce',
    },
    printed: {
      fr: 'Spaghetti au Fruits de Mer Sauce Blanche',
      ar: 'سباقتي بغلال البحر (صالصة بيضاء)',
    },
    description: {
      fr: 'Spaghetti aux fruits de mer en sauce blanche.',
      ar: 'سباقتي بغلال البحر بالصالصة البيضاء.',
      en: 'Spaghetti with seafood in a white sauce.',
    },
    price: 48000,
    kind: 'seafood',
  },
  {
    category: 'pates-riz',
    name: {
      fr: 'Spaghetti au poulet, sauce blanche',
      ar: 'سباقتي بالدجاج (صالصة بيضاء)',
      en: 'Chicken spaghetti, white sauce',
    },
    printed: { fr: 'Spaghetti au Poulet Sauce Blanche', ar: 'سباقتي بالدجاج (صالصة بيضاء)' },
    description: {
      fr: 'Spaghetti au poulet en sauce blanche.',
      ar: 'سباقتي بالدجاج بالصالصة البيضاء.',
      en: 'Spaghetti with chicken in a white sauce.',
    },
    price: 28000,
    kind: 'poultry',
  },

  // ── Viandes ────────────────────────────────────────────────────────
  {
    category: 'viandes',
    name: { fr: 'Grillade mixte', ar: 'مشكل مشوي', en: 'Mixed grill' },
    printed: { fr: 'Grillade Mixte', ar: 'مشكل مشوي' },
    description: {
      fr: 'Assortiment de viandes grillées.',
      ar: 'تشكيلة لحوم مشوية.',
      en: 'An assortment of grilled meats.',
    },
    price: 42000,
    tags: ['grilled'],
    kind: 'meat',
  },
  {
    category: 'viandes',
    name: { fr: 'Brochettes d’agneau grillées', ar: 'سفود علوش مشوي', en: 'Grilled lamb skewers' },
    printed: { fr: 'Brochettes d’agneau grillé', ar: 'سفود علوش مشوي' },
    description: {
      fr: 'Brochettes d’agneau, grillées.',
      ar: 'سفود لحم علوش مشوي.',
      en: 'Lamb skewers, grilled.',
    },
    price: 42000,
    tags: ['grilled'],
    kind: 'meat',
  },
  {
    category: 'viandes',
    name: { fr: 'Côtelettes d’agneau', ar: 'كتلات علوش', en: 'Lamb chops' },
    printed: { fr: 'Côtlettes d’Agneau', ar: 'كتلات علوش' },
    description: { fr: 'Côtelettes d’agneau.', ar: 'كتلات لحم علوش.', en: 'Lamb chops.' },
    price: 42000,
    kind: 'meat',
    needsOwnerReview:
      'Orthographe corrigée en « Côtelettes » ; le menu imprimé indique « Côtlettes d’Agneau ».',
  },
  {
    category: 'viandes',
    name: {
      fr: 'Filet de veau aux trois poivres',
      ar: 'لحم العجل بالتوابل الثلاث',
      en: 'Veal fillet with three peppers',
    },
    printed: { fr: 'Filet de Veau au 3 Poivres', ar: 'لحم الضل بالتوابل الثلاث' },
    description: {
      fr: 'Filet de veau, sauce aux trois poivres.',
      ar: 'لحم العجل بصلصة التوابل الثلاث.',
      en: 'Veal fillet with a three-pepper sauce.',
    },
    price: 47000,
    kind: 'meat',
    needsOwnerReview:
      'Nom arabe : « لحم العجل » (veau) remplace « لحم الضل » imprimé, probablement une coquille.',
  },
  {
    category: 'viandes',
    name: {
      fr: 'Filet de veau aux champignons',
      ar: 'لحم العجل بالفقاع',
      en: 'Veal fillet with mushrooms',
    },
    printed: { fr: 'Filet de Veau au Champignon', ar: 'لحم الضل بالفقاع' },
    description: {
      fr: 'Filet de veau, sauce aux champignons.',
      ar: 'لحم العجل بالفقاع.',
      en: 'Veal fillet with a mushroom sauce.',
    },
    price: 47000,
    kind: 'meat',
    needsOwnerReview:
      'Nom arabe : « لحم العجل » (veau) remplace « لحم الضل » imprimé, probablement une coquille.',
  },

  // ── Volailles ──────────────────────────────────────────────────────
  {
    category: 'volailles',
    name: { fr: 'Escalope grillée', ar: 'اسكالوب مشوي', en: 'Grilled escalope' },
    printed: { fr: 'Escalope Grillé', ar: 'اسكالوب مشوي' },
    description: {
      fr: 'Escalope de volaille grillée.',
      ar: 'اسكالوب مشوي.',
      en: 'Poultry escalope, grilled.',
    },
    price: 22000,
    tags: ['grilled'],
    kind: 'poultry',
  },
  {
    category: 'volailles',
    name: { fr: 'Escalope panée', ar: 'اسكالوب مبطن', en: 'Breaded escalope' },
    printed: { fr: 'Escalope Panné', ar: 'اسكالوب مبطن' },
    description: {
      fr: 'Escalope de volaille panée.',
      ar: 'اسكالوب مبطن.',
      en: 'Poultry escalope, breaded.',
    },
    price: 23000,
    kind: 'poultry',
  },
  {
    category: 'volailles',
    name: {
      fr: 'Escalope pizzaiola',
      ar: 'اسكالوب بالطماطم والجبن',
      en: 'Escalope pizzaiola — tomato and cheese',
    },
    printed: { fr: 'Escalope Pizzailoa', ar: 'اسكالوب بالطماطم والجبن' },
    description: {
      fr: 'Escalope de volaille à la tomate et au fromage.',
      ar: 'اسكالوب بالطماطم والجبن.',
      en: 'Poultry escalope with tomato and cheese.',
    },
    price: 24000,
    kind: 'poultry',
  },
  {
    category: 'volailles',
    name: { fr: 'Escalope aux champignons', ar: 'اسكالوب بالفقاع', en: 'Escalope with mushrooms' },
    printed: { fr: 'Escalope au Champignon', ar: 'اسكالوب بالفقاع' },
    description: {
      fr: 'Escalope de volaille, sauce aux champignons.',
      ar: 'اسكالوب بالفقاع.',
      en: 'Poultry escalope with a mushroom sauce.',
    },
    price: 24000,
    kind: 'poultry',
  },
  {
    category: 'volailles',
    name: { fr: 'Poulet aux champignons', ar: 'دجاج بالفقاع', en: 'Chicken with mushrooms' },
    printed: { fr: 'Poulet au Champignon', ar: 'دجاج بالفقاع' },
    description: {
      fr: 'Poulet, sauce aux champignons.',
      ar: 'دجاج بالفقاع.',
      en: 'Chicken with a mushroom sauce.',
    },
    price: 25000,
    kind: 'poultry',
  },

  // ── Desserts ───────────────────────────────────────────────────────
  {
    category: 'desserts',
    name: { fr: 'Salade de fruits', ar: 'سلاطة غلال', en: 'Fruit salad' },
    printed: { fr: 'Salade de Fruits', ar: 'سلاطة غلال' },
    description: { fr: 'Salade de fruits.', ar: 'سلاطة غلال.', en: 'Fresh fruit salad.' },
    price: 8000,
    kind: 'other',
  },
  {
    category: 'desserts',
    name: { fr: 'Sorbet citron', ar: 'مثلجات بالليمون', en: 'Lemon sorbet' },
    printed: { fr: 'Sorbet Citron', ar: 'مثلجات بالليمون' },
    description: { fr: 'Sorbet au citron.', ar: 'مثلجات بالليمون.', en: 'Lemon sorbet.' },
    price: 8000,
    kind: 'other',
    needsOwnerReview:
      'Prix 8,000 à confirmer : partiellement caché par un reflet sur la photo du menu.',
  },
  {
    category: 'desserts',
    name: { fr: 'Fruits de saison', ar: 'غلال الموسم', en: 'Seasonal fruit' },
    printed: { fr: 'Fruit de saison', ar: 'غلال الموسم' },
    description: { fr: 'Fruits de saison.', ar: 'غلال الموسم.', en: 'Fruit of the season.' },
    price: 12000,
    kind: 'other',
    needsOwnerReview:
      'Prix 12,000 à confirmer : le premier chiffre est caché par un reflet sur la photo du menu.',
  },

  // ── Boissons ───────────────────────────────────────────────────────
  {
    category: 'boissons',
    name: { fr: 'Eau minérale Safia 1 L', ar: 'ماء معدني', en: 'Safia mineral water, 1 L' },
    printed: { fr: 'Eau Safia 1L', ar: 'ماء معدني' },
    description: { fr: '', ar: '', en: '' },
    price: 4000,
    kind: 'other',
  },
  {
    category: 'boissons',
    name: { fr: 'Boisson gazeuse', ar: 'مشروب غازي', en: 'Soft drink' },
    printed: { fr: 'Boisson Gazeuz', ar: 'مشروب غازي' },
    description: { fr: '', ar: '', en: '' },
    price: 4000,
    kind: 'other',
  },
  {
    category: 'boissons',
    name: { fr: 'Eau pétillante', ar: 'مياه غازية', en: 'Sparkling water' },
    printed: { fr: 'Petillante', ar: null },
    description: { fr: '', ar: '', en: '' },
    price: 4000,
    kind: 'other',
    arabicIsDraft: true,
    needsOwnerReview: 'Nom arabe « مياه غازية » proposé : il n’apparaît pas sur le menu imprimé.',
  },
]

/** Expected item count per category, from the photos: 4 + 4 + 10 + 4 + 6 + 5 + 5 + 3 + 3 = 44. */
export const expectedCounts: Record<string, number> = {
  'entrees-chaudes': 4,
  'entrees-froides': 4,
  'mollusques-crustaces': 10,
  poissons: 4,
  'pates-riz': 6,
  viandes: 5,
  volailles: 5,
  desserts: 3,
  boissons: 3,
}

/** Settings pre-filled with the public information supplied by the owner's representative. */
export const verifiedSettings = {
  restaurantName: 'La Voile Blanche',
  taglineFr: 'Poissons et fruits de mer, à Sfax',
  taglineAr: 'أسماك وغلال البحر في صفاقس',
  taglineEn: 'Fish and seafood in Sfax',
  phone: '+216 22 287 799',
  whatsapp: '',
  addressFr: 'Route de Teniour km 1,5, Sfax',
  addressAr: 'طريق تنيور كلم 1,5، صفاقس',
  addressEn: 'Route de Teniour, km 1.5, Sfax',
  city: 'Sfax',
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=La%20Voile%20Blanche%2C%20Route%20de%20Teniour%20km%201.5%2C%20Sfax',
  openingHoursFr: 'Du mardi au dimanche, midi [HH:MM–HH:MM] et soir [HH:MM–HH:MM]. Fermé le lundi.',
  openingHoursAr:
    'من الثلاثاء إلى الأحد، الغداء [HH:MM–HH:MM] والعشاء [HH:MM–HH:MM]. مغلق يوم الاثنين.',
  openingHoursEn:
    'Tuesday to Sunday, lunch [HH:MM–HH:MM] and dinner [HH:MM–HH:MM]. Closed on Mondays.',
  instagram: 'https://www.instagram.com/restaurant.la.voile.blanche/',
  facebook: 'https://www.facebook.com/profile.php?id=100064853971860',
  /** Every field listed here shows "à confirmer" in the back office. */
  unconfirmedFields: [
    'taglineFr',
    'taglineAr',
    'taglineEn',
    'phone',
    'whatsapp',
    'addressFr',
    'addressAr',
    'addressEn',
    'city',
    'mapUrl',
    'openingHoursFr',
    'openingHoursAr',
    'openingHoursEn',
    'instagram',
    'facebook',
    'baseUrl',
  ],
}
