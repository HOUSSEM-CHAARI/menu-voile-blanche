import { seed } from './lib/seed'

const force = process.argv.includes('--force')
const result = await seed({ force })
const suffix = force ? ' (données réécrites)' : ''
console.log(`✓ Menu initialisé : ${result.categories} catégories, ${result.items} plats${suffix}`)
