const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g

/**
 * Normalises text for search in all three languages:
 * French accents folded (é → e, œ → oe), Arabic alef forms unified (أ إ آ ٱ → ا),
 * ة → ه, ى → ي, tashkeel and tatweel removed, punctuation collapsed to spaces.
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** True when every word of the query starts a word of the haystack (both normalised). */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = normalizeForSearch(query).split(' ').filter(Boolean)
  if (words.length === 0) return true
  const target = ` ${normalizeForSearch(haystack)}`
  return words.every((word) => target.includes(` ${word}`))
}
