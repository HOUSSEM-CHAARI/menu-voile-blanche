import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./data/menu.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  PUBLIC_BASE_URL: z.url().default('http://localhost:4321'),
  UPLOAD_DIR: z.string().min(1).default('./data/uploads'),
  /** Set automatically by a connected Vercel Blob store in production. */
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  NODE_ENV: z.string().optional(),
})

/** Empty strings in .env mean "not set". */
function clean(source: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

export const env = schema.parse(clean(process.env))

export const baseUrl = env.PUBLIC_BASE_URL.replace(/\/+$/, '')
