import type { AstroCookies } from 'astro'

const COOKIE = 'vb_flash'

export interface Flash {
  type: 'success' | 'error'
  text: string
}

/** One-shot confirmation shown after a redirect ("Plat enregistré"). */
export function setFlash(
  cookies: AstroCookies,
  text: string,
  type: Flash['type'] = 'success',
): void {
  cookies.set(COOKIE, JSON.stringify({ type, text }), {
    path: '/admin',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60,
  })
}

export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(COOKIE)?.value
  if (!raw) return null
  cookies.delete(COOKIE, { path: '/admin' })
  try {
    const value = JSON.parse(raw) as Flash
    return typeof value.text === 'string' ? value : null
  } catch {
    return null
  }
}
