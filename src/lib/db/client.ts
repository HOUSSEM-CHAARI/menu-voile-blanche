import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { env } from '../env'
import * as schema from './schema'

type Db = LibSQLDatabase<typeof schema>

const globalForDb = globalThis as unknown as { __vbClient?: Client; __vbDb?: Db }

function ensureLocalDirectory(url: string): void {
  if (!url.startsWith('file:')) return
  const path = url.slice('file:'.length)
  mkdirSync(dirname(path), { recursive: true })
}

function connect(): Client {
  ensureLocalDirectory(env.DATABASE_URL)
  const client = createClient({
    url: env.DATABASE_URL,
    ...(env.DATABASE_AUTH_TOKEN ? { authToken: env.DATABASE_AUTH_TOKEN } : {}),
  })
  void client.execute('PRAGMA foreign_keys = ON')
  return client
}

// Reuse one connection across dev-server reloads.
export const client: Client = (globalForDb.__vbClient ??= connect())
export const db: Db = (globalForDb.__vbDb ??= drizzle(client, { schema }))
