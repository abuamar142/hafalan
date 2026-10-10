import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { verifyPassword } from '@/lib/auth/password'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const bodySchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const POST = handler(async (req: Request) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const uname = parsed.data.username.trim().toLowerCase()
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, uname))
    .limit(1)

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return err('Username atau password salah', 401)
  }

  const token = await createSessionToken({
    sub: user.id,
    username: user.username,
    name: user.name,
  })
  await setSessionCookie(token)

  return ok({
    user: { id: user.id, username: user.username, name: user.name },
  })
})
