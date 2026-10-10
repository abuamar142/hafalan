import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { classes, groupTeachers, groups } from '@/lib/db/schema'

export const GET = handler(async () => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      classId: groups.classId,
      className: classes.name,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .leftJoin(classes, eq(groups.classId, classes.id))
    .orderBy(asc(groups.name))

  return ok(
    rows.map((g) => ({
      id: g.id,
      name: g.name,
      class_id: g.classId,
      class_name: g.className || 'Tanpa Kelas',
      created_at: g.createdAt,
    }))
  )
})

const createSchema = z.object({ name: z.string().min(1, 'Nama kelompok wajib diisi') })

export const POST = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const [created] = await db
    .insert(groups)
    .values({ name: parsed.data.name.trim() })
    .returning()

  if (!created) return err('Gagal membuat kelompok', 500)
  return ok({ id: created.id, name: created.name }, 201)
})

// Dipakai halaman kelompok: daftar penugasan ustadz (join nama dari users).
export const PUT = handler(async () => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)
  const rows = await db.select().from(groupTeachers)
  return ok(
    rows.map((r) => ({
      id: r.id,
      group_id: r.groupId,
      teacher_id: String(r.teacherId),
      teacher_name: r.teacherName || '',
    }))
  )
})
