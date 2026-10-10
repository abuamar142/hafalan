import { asc } from 'drizzle-orm'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const GET = handler(async () => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)
  const rows = await db
    .select({ id: users.id, name: users.name, username: users.username })
    .from(users)
    .orderBy(asc(users.name))
  return ok(rows)
})
