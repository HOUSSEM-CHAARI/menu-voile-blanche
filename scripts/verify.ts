import { verify } from './lib/verify'

const problems = await verify()
if (problems.length > 0) {
  console.error(`✗ ${problems.length} différence(s) avec le menu vérifié :`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log('✓ La base correspond au menu vérifié : 9 catégories, 44 plats, tous les prix.')
