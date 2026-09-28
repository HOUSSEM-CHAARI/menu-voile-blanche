import { runMigrations } from './lib/migrate'

await runMigrations()
console.log('✓ Base de données à jour')
