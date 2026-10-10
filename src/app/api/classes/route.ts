import { asc } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { classes, groups } from '@/lib/db/schema'

export const GET = handler(async () => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)
  const rows = await db.select().from(classes).orderBy(asc(classes.name))
  return ok(rows.map((c) => ({ id: c.id, name: c.name, created_at: c.createdAt })))
})

const createSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  groupIds: z.array(z.number()).optional().default([]),
})

export const POST = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const [created] = await db
    .insert(classes)
    .values({ name: parsed.data.name.trim() })
    .returning()

  if (!created) return err('Gagal membuat kelas', 500)

  for (const gid of parsed.data.groupIds) {
    await db.update(groups).set({ classId: created.id }).where(eq(groups.id, gid))
  }

  return ok({ id: created.id, name: created.name }, 201)
})
