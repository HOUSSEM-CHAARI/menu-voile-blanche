import { describe, expect, it } from 'vitest'
import { formatPrice, isImplausiblePrice, parsePriceInput, priceForSchema } from './price'
import { matchesQuery, normalizeForSearch } from './search'
import { slugify } from './slug'

const NBSP = ' '

describe('formatPrice', () => {
  it('shows whole dinars without millimes', () => {
    expect(formatPrice(42000, 'fr')).toBe(`42${NBSP}DT`)
    expect(formatPrice(42000, 'en')).toBe(`42${NBSP}DT`)
    expect(formatPrice(42000, 'ar')).toBe(`42${NBSP}د.ت`)
  })
  it('shows millimes only when they are not zero', () => {
    expect(formatPrice(42500, 'fr')).toBe(`42,500${NBSP}DT`)
    expect(formatPrice(4050, 'fr')).toBe(`4,050${NBSP}DT`)
  })
  it('adds the per-100 g unit', () => {
    expect(formatPrice(14000, 'fr', 'per100g')).toBe(`14${NBSP}DT / 100${NBSP}g`)
    expect(formatPrice(14000, 'ar', 'per100g')).toBe(`14${NBSP}د.ت / 100${NBSP}غ`)
  })
  it('rejects invalid amounts', () => {
    expect(() => formatPrice(-1, 'fr')).toThrow()
    expect(() => formatPrice(1.5, 'fr')).toThrow()
  })
})

describe('parsePriceInput', () => {
  it.each([
    ['42', 42000],
    ['42,000', 42000],
    ['42.000', 42000],
    ['42.500', 42500],
    ['42,500', 42500],
    ['42,5', 42500],
    ['42.50', 42500],
    [' 42 DT ', 42000],
    ['14,000 د.ت', 14000],
    ['0,800', 800],
  ])('parses %s', (input, expected) => {
    expect(parsePriceInput(input)).toBe(expected)
  })
  it.each(['', 'abc', '42,5000', '4 2', '-3', '42,'])('rejects %s', (input) => {
    expect(parsePriceInput(input)).toBeNull()
  })
  it('flags implausible prices', () => {
    expect(isImplausiblePrice(800)).toBe(true)
    expect(isImplausiblePrice(42000)).toBe(false)
    expect(isImplausiblePrice(42_000_000)).toBe(true)
  })
  it('formats for schema.org', () => {
    expect(priceForSchema(42000)).toBe('42.000')
  })
})

describe('search normalisation', () => {
  it('folds French accents and ligatures', () => {
    expect(normalizeForSearch('Œufs de seiche sautés')).toBe('oeufs de seiche sautes')
    expect(matchesQuery('Côtelettes d’agneau', 'cotelette')).toBe(true)
    expect(matchesQuery('Salade méchouia', 'MECHOUIA')).toBe(true)
  })
  it('normalises Arabic', () => {
    expect(normalizeForSearch('أرز')).toBe('ارز')
    expect(normalizeForSearch('سلاطة')).toBe('سلاطه')
    expect(normalizeForSearch('مَشْوِي')).toBe('مشوي')
    expect(matchesQuery('سلاطة مشوية', 'سلاطه')).toBe(true)
    expect(matchesQuery('بيض الحبار', 'إبيض')).toBe(false)
  })
  it('matches word prefixes only', () => {
    expect(matchesQuery('Brik au thon', 'thon')).toBe(true)
    expect(matchesQuery('Brik au thon', 'hon')).toBe(false)
    expect(matchesQuery('anything', '   ')).toBe(true)
  })
})

describe('slugify', () => {
  it.each([
    ['Pâtes & riz', 'pates-riz'],
    ['Mollusques & crustacés', 'mollusques-crustaces'],
    ['Œufs de seiche sautés ou panés', 'oeufs-de-seiche-sautes-ou-panes'],
    ["Brochettes d'agneau grillées", 'brochettes-d-agneau-grillees'],
    ['Eau minérale Safia 1 L', 'eau-minerale-safia-1-l'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})
