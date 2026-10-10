import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { hashPassword } from '@/lib/auth/password'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const bodySchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama wajib diisi').max(100),
})

export const POST = handler(async (req: Request) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const { username, password, name } = parsed.data
  const uname = username.trim().toLowerCase()

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, uname))
    .limit(1)

  if (existing) return err('Username sudah dipakai', 409)

  const [created] = await db
    .insert(users)
    .values({ username: uname, passwordHash: await hashPassword(password), name })
    .returning({ id: users.id, username: users.username, name: users.name })

  if (!created) return err('Gagal membuat akun', 500)

  const token = await createSessionToken({
    sub: created.id,
    username: created.username,
    name: created.name,
  })
  await setSessionCookie(token)

  return ok({ user: created }, 201)
})
