import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE_NAME = 'hafalan_session'
export const MAX_AGE_SECONDS = 7 * 24 * 60 * 60

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'insecure-dev-secret-ganti-di-production'
)

export interface SessionPayload {
  sub: number
  username: string
  name: string
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ username: payload.username, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (!payload.sub) return null
    return {
      sub: Number(payload.sub),
      username: String(payload.username ?? ''),
      name: String(payload.name ?? ''),
    }
  } catch {
    return null
  }
}
