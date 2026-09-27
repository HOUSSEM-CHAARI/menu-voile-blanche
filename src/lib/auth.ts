/**
 * Back-office authentication: argon2 passwords, database sessions (only a SHA-256 of the token is
 * stored), CSRF tokens bound to the session, login rate limiting and a role → permission map.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'
import type { AstroCookies } from 'astro'
import { and, eq, gt, lt } from 'drizzle-orm'
import { db } from './db/client'
import { loginAttempts, sessions, users } from './db/schema'

export const SESSION_COOKIE = 'vb_session'
const SESSION_DAYS = 7
const DAY = 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW = 15 * 60 * 1000

export type Role = 'owner' | 'manager' | 'staff'

export interface SessionUser {
  id: number
  username: string
  role: Role
  csrfToken: string
}

/** Adding a role later only means adding a line here. */
const PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ['menu:write', 'availability:write', 'settings:write', 'backup', 'users:write'],
  manager: ['menu:write', 'availability:write'],
  staff: ['availability:write'],
}
export type Permission =
  'menu:write' | 'availability:write' | 'settings:write' | 'backup' | 'users:write'

export function can(user: SessionUser | undefined, permission: Permission): boolean {
  return Boolean(user && PERMISSIONS[user.role].includes(permission))
}

export const hashPassword = (password: string) => hash(password)
export const verifyPassword = (passwordHash: string, password: string) =>
  verify(passwordHash, password).catch(() => false)

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const token = () => randomBytes(32).toString('base64url')

export async function createSession(userId: number, cookies: AstroCookies, secure: boolean) {
  const raw = token()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY)
  await db.insert(sessions).values({ id: sha256(raw), userId, csrfToken: token(), expiresAt })
  cookies.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: expiresAt,
  })
}

/** Returns the signed-in user, renewing the session once it is half way to expiry. */
export async function readSession(
  cookies: AstroCookies,
  secure: boolean,
): Promise<SessionUser | null> {
  const raw = cookies.get(SESSION_COOKIE)?.value
  if (!raw) return null
  const id = sha256(raw)
  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .get()
  if (!row) {
    cookies.delete(SESSION_COOKIE, { path: '/' })
    return null
  }
  if (row.session.expiresAt.getTime() - Date.now() < (SESSION_DAYS * DAY) / 2) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY)
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id))
    cookies.set(SESSION_COOKIE, raw, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      expires: expiresAt,
    })
  }
  return {
    id: row.user.id,
    username: row.user.username,
    role: row.user.role,
    csrfToken: row.session.csrfToken,
  }
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const raw = cookies.get(SESSION_COOKIE)?.value
  if (raw) await db.delete(sessions).where(eq(sessions.id, sha256(raw)))
  cookies.delete(SESSION_COOKIE, { path: '/' })
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
}

/** Ends every session of a user (after a password change), except the current one. */
export async function destroyOtherSessions(userId: number, cookies: AstroCookies): Promise<void> {
  const raw = cookies.get(SESSION_COOKIE)?.value
  const keep = raw ? sha256(raw) : ''
  const all = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId))
  for (const session of all) {
    if (session.id !== keep) await db.delete(sessions).where(eq(sessions.id, session.id))
  }
}

export function csrfMatches(expected: string, received: string | null | undefined): boolean {
  if (!received) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

/* ─── Login rate limiting ─────────────────────────────────────────────────── */

export async function isRateLimited(keys: string[]): Promise<boolean> {
  const since = new Date(Date.now() - ATTEMPT_WINDOW)
  for (const key of keys) {
    const row = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).get()
    if (row && row.windowStart > since && row.count >= MAX_ATTEMPTS) return true
  }
  return false
}

export async function recordFailure(keys: string[]): Promise<void> {
  const now = new Date()
  const since = new Date(now.getTime() - ATTEMPT_WINDOW)
  for (const key of keys) {
    const row = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).get()
    if (!row || row.windowStart <= since) {
      await db
        .insert(loginAttempts)
        .values({ key, count: 1, windowStart: now })
        .onConflictDoUpdate({ target: loginAttempts.key, set: { count: 1, windowStart: now } })
    } else {
      await db
        .update(loginAttempts)
        .set({ count: row.count + 1 })
        .where(eq(loginAttempts.key, key))
    }
  }
}

export async function clearFailures(keys: string[]): Promise<void> {
  for (const key of keys) await db.delete(loginAttempts).where(eq(loginAttempts.key, key))
}

/** Creates the admin account from .env if it does not exist yet (used by the seed). */
export async function ensureAdmin(username: string | undefined, password: string | undefined) {
  if (!username || !password) return 'skipped' as const
  const existing = await db.select().from(users).where(eq(users.username, username)).get()
  if (existing) return 'exists' as const
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.')
  await db
    .insert(users)
    .values({ username, passwordHash: await hashPassword(password), role: 'owner' })
  return 'created' as const
}
