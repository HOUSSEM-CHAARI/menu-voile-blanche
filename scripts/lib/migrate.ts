import { migrate } from 'drizzle-orm/libsql/migrator'
import { client, db } from '../../src/lib/db/client'

export async function runMigrations(): Promise<void> {
  await client.execute('PRAGMA journal_mode = WAL')
  await migrate(db, { migrationsFolder: './drizzle' })
}
