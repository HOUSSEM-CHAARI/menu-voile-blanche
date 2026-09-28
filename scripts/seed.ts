import { ensureAdmin } from '../src/lib/auth'
import { env } from '../src/lib/env'
import { seed } from './lib/seed'

const force = process.argv.includes('--force')
const result = await seed({ force })
const suffix = force ? ' (données réécrites)' : ''
console.log(`✓ Menu initialisé : ${result.categories} catégories, ${result.items} plats${suffix}`)

const admin = await ensureAdmin(env.ADMIN_USERNAME, env.ADMIN_PASSWORD)
if (admin === 'created') console.log(`✓ Compte back office créé : ${env.ADMIN_USERNAME}`)
if (admin === 'skipped')
  console.log('ℹ ADMIN_USERNAME / ADMIN_PASSWORD absents de .env : aucun compte créé')
