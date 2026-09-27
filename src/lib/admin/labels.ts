import { formatPrice } from '../price'

export const ACTIONS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  trash: 'Mis à la corbeille',
  restore: 'Restauré',
  purge: 'Supprimé définitivement',
  duplicate: 'Dupliqué',
  reorder: 'Nouvel ordre',
  availability: 'Disponibilité',
  visibility: 'Visibilité',
  photo: 'Nouvelle photo',
  'photo-removed': 'Photo retirée',
  import: 'Import d’une sauvegarde',
  password: 'Mot de passe changé',
}

export const ENTITIES: Record<string, string> = {
  dish: 'Plat',
  category: 'Catégorie',
  settings: 'Réglages',
  user: 'Compte',
  backup: 'Sauvegarde',
}

const FIELDS: Record<string, string> = {
  nameFr: 'Nom (FR)',
  nameAr: 'Nom (AR)',
  nameEn: 'Nom (EN)',
  descriptionFr: 'Description (FR)',
  descriptionAr: 'Description (AR)',
  descriptionEn: 'Description (EN)',
  noteFr: 'Note (FR)',
  noteAr: 'Note (AR)',
  noteEn: 'Note (EN)',
  price: 'Prix',
  priceUnit: 'Unité de prix',
  categoryId: 'Catégorie',
  isAvailable: 'Disponible',
  isVisible: 'Visible',
  serves: 'Personnes',
  tags: 'Étiquettes',
  kind: 'Type',
  deletedAt: 'Corbeille',
  needsOwnerReview: 'À vérifier',
  sortOrder: 'Position',
  layout: 'Présentation',
  photo: 'Photo',
  baseUrl: 'Adresse du menu',
  phone: 'Téléphone',
  openingHoursFr: 'Horaires (FR)',
}

export const fieldLabel = (key: string) => FIELDS[key] ?? key

export function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'price' && typeof value === 'number') return formatPrice(value, 'fr')
  if (typeof value === 'boolean') return value ? 'oui' : 'non'
  if (key === 'deletedAt') return 'oui'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export const dateTime = (date: Date) =>
  date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Tunis' })
