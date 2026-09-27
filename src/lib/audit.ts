import { db } from './db/client'
import { auditLog } from './db/schema'
import type { SessionUser } from './auth'

type Row = Record<string, unknown>

const IGNORED = new Set(['updatedAt', 'createdAt', 'image', 'draftFields'])

/** Only the fields that changed, so the history reads "old value → new value". */
export function diff(
  before: Row | null,
  after: Row | null,
): { before: Row | null; after: Row | null } {
  if (!before || !after) return { before, after }
  const b: Row = {}
  const a: Row = {}
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (IGNORED.has(key)) continue
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      b[key] = before[key]
      a[key] = after[key]
    }
  }
  return { before: b, after: a }
}

export async function audit(
  user: SessionUser,
  action: string,
  entity: 'dish' | 'category' | 'settings' | 'user' | 'backup',
  entityId: number | null,
  before: Row | null = null,
  after: Row | null = null,
): Promise<void> {
  const changes = diff(before, after)
  await db.insert(auditLog).values({
    userId: user.id,
    username: user.username,
    action,
    entity,
    entityId,
    before: changes.before,
    after: changes.after,
  })
}
