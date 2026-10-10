import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { createSessionToken, getSession, setSessionCookie } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const bodySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
})

export const PATCH = handler(async (req: Request) => {
  const session = await getSession()
  if (!session) return err('Belum login', 401)

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const name = parsed.data.name.trim()
  await db.update(users).set({ name }).where(eq(users.id, session.sub))

  // Perbarui cookie agar nama baru langsung terpakai di laporan.
  const token = await createSessionToken({
    sub: session.sub,
    username: session.username,
    name,
  })
  await setSessionCookie(token)

  return ok({ user: { ...session, name } })
})
