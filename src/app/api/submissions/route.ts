import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { students, submissions } from '@/lib/db/schema'

export const GET = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)

  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId')

  const base = db
    .select({
      id: submissions.id,
      studentId: submissions.studentId,
      surahNo: submissions.surahNo,
      nilai: submissions.nilai,
      catatan: submissions.catatan,
      waktu: submissions.waktu,
      guruId: submissions.guruId,
      guruName: submissions.guruName,
      ayatStart: submissions.ayatStart,
      ayatEnd: submissions.ayatEnd,
      updatedAt: submissions.updatedAt,
      updatedBy: submissions.updatedBy,
      updatedByName: submissions.updatedByName,
      studentNama: students.nama,
    })
    .from(submissions)
    .leftJoin(students, eq(submissions.studentId, students.id))

  const rows = studentId
    ? await base
        .where(eq(submissions.studentId, Number(studentId)))
        .orderBy(desc(submissions.id))
    : await base.orderBy(desc(submissions.id)).limit(999)

  return ok(
    rows.map((s) => ({
      id: s.id,
      student_id: s.studentId,
      surah_no: s.surahNo,
      nilai: s.nilai || '',
      catatan: s.catatan || '',
      waktu: s.waktu ? s.waktu.toISOString() : '',
      guru_id: s.guruId != null ? String(s.guruId) : null,
      guru_name: s.guruName,
      ayat_start: s.ayatStart,
      ayat_end: s.ayatEnd,
      updated_at: s.updatedAt ? s.updatedAt.toISOString() : null,
      updated_by: s.updatedBy != null ? String(s.updatedBy) : null,
      updated_by_name: s.updatedByName,
      students: s.studentNama ? { nama: s.studentNama } : null,
    }))
  )
})

const createSchema = z.object({
  studentId: z.number(),
  surahNo: z.number(),
  nilai: z.string().optional().default(''),
  catatan: z.string().optional().default(''),
  waktu: z.string().optional().nullable(),
  ayatStart: z.number().optional().default(1),
  ayatEnd: z.number().optional().nullable(),
})

export const POST = handler(async (req: Request) => {
  const session = await requireSession().catch(() => null)
  if (!session) return err('Belum login', 401)

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const d = parsed.data
  const [created] = await db
    .insert(submissions)
    .values({
      studentId: d.studentId,
      surahNo: d.surahNo,
      nilai: d.nilai || '',
      catatan: d.catatan || '',
      waktu: d.waktu ? new Date(d.waktu) : new Date(),
      guruId: session.sub,
      guruName: session.name,
      ayatStart: d.ayatStart ?? 1,
      ayatEnd: d.ayatEnd ?? null,
    })
    .returning()

  if (!created) return err('Gagal menyimpan setoran', 500)
  return ok({ id: created.id }, 201)
})
