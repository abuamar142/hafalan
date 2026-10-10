import { NextResponse } from 'next/server'
import { getSession, type SessionPayload } from '@/lib/auth/session'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Sesi wajib — kembalikan null kalau belum login. */
export async function apiSession(): Promise<SessionPayload | null> {
  return getSession()
}

/** Bungkus handler: tangkap error jadi JSON 500 yang rapi. */
export function handler<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[api]', msg)
      return err(msg, 500)
    }
  }
}
