import { rmSync } from 'node:fs'
import { env } from '../src/lib/env'

if (env.NODE_ENV === 'production') {
  console.error('✗ db:reset est interdit en production.')
  process.exit(1)
}
if (!env.DATABASE_URL.startsWith('file:')) {
  console.error('✗ db:reset ne fonctionne que sur une base locale (file:).')
  process.exit(1)
}

const path = env.DATABASE_URL.slice('file:'.length)
for (const file of [path, `${path}-wal`, `${path}-shm`]) rmSync(file, { force: true })
console.log(`✓ ${path} supprimé`)

// Import after deleting the file so the client opens a fresh database.
const { runMigrations } = await import('./lib/migrate')
const { seed } = await import('./lib/seed')
const { verify } = await import('./lib/verify')
const { importTemporaryPhotos } = await import('./lib/photos')

await runMigrations()
const result = await seed()
console.log(`✓ Base recréée : ${result.categories} catégories, ${result.items} plats`)
const photos = await importTemporaryPhotos()
console.log(`✓ ${photos} photos temporaires importées`)

const problems = await verify()
if (problems.length > 0) {
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log('✓ Vérification réussie')
