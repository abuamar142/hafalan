import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { classes, groups, students } from '@/lib/db/schema'

export const GET = handler(async () => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)
  const rows = await db
    .select({
      id: students.id,
      groupId: students.groupId,
      nama: students.nama,
      color: students.color,
      groupName: groups.name,
      className: classes.name,
    })
    .from(students)
    .leftJoin(groups, eq(students.groupId, groups.id))
    .leftJoin(classes, eq(groups.classId, classes.id))

  return ok(
    rows.map((s) => {
      const className = s.className || 'Tanpa Kelas'
      return {
        id: s.id,
        group_id: s.groupId ?? 0,
        nama: s.nama,
        color: s.color || '',
        group_name: s.groupName || 'Tanpa Kelompok',
        class_name: className,
        kelas: className,
      }
    })
  )
})

const createSchema = z.object({
  nama: z.string().min(1, 'Nama santri wajib diisi'),
  groupId: z.number().nullable().optional(),
  color: z.string().optional().default(''),
})

export const POST = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const [created] = await db
    .insert(students)
    .values({
      nama: parsed.data.nama.trim(),
      groupId: parsed.data.groupId ?? null,
      color: parsed.data.color || '',
    })
    .returning()

  if (!created) return err('Gagal menambah santri', 500)
  return ok({ id: created.id, nama: created.nama }, 201)
})
