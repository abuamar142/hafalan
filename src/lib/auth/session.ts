import { cookies } from 'next/headers'
import {
  MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from './jwt'

export { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME }
export type { SessionPayload }

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE_NAME)
}

/** Sesi user saat ini (dari cookie httpOnly). */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Lempar error bila belum login — dipakai di server action. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}
