// Source de vérité du menu : compléter uniquement après transcription des photos papier.
// Les prix sont des chaînes pour préserver exactement la notation tunisienne (ex. « 45,000 »).
export const categories = [
  { id: 'entrees-chaudes', label: 'Entrées chaudes', ar: 'المقبلات الساخنة', tone: 'sand' },
  { id: 'entrees-froides', label: 'Entrées froides', ar: 'المقبلات الباردة', tone: 'sea' },
  { id: 'pates-riz', label: 'Pâtes et riz', ar: 'المعجنات والأرز', tone: 'sand' },
  { id: 'mollusques-crustaces', label: 'Mollusques et crustacés', ar: 'الرخويات والقشريات', tone: 'sea', featured: true },
  { id: 'poissons', label: 'Poissons', ar: 'الأسماك', tone: 'sea', featured: true },
  { id: 'viandes', label: 'Viandes', ar: 'اللحوم', tone: 'sand' },
  { id: 'volailles', label: 'Volailles', ar: 'الدواجن', tone: 'sand' },
  { id: 'desserts', label: 'Desserts', ar: 'الحلويات', tone: 'sand' },
  { id: 'boissons', label: 'Boissons', ar: 'المشروبات', tone: 'sea' },
]

/**
 * Ajouter les articles transcrits dans ce tableau.
 * Exemple de forme :
 * { id, category, name, arabic, price: '45,000', description, note: 'Pour 2 personnes', image, imageAlt, featured }
 */
export const menuItems = []
