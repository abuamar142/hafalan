import { desc, eq } from 'drizzle-orm'
import { err, handler, ok } from '@/lib/api-utils'
import { db } from '@/lib/db'
import {
  classes,
  groups,
  memorization,
  students,
  submissions,
} from '@/lib/db/schema'

export const GET = handler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const studentId = Number((await ctx.params).id)
    if (!studentId || Number.isNaN(studentId)) {
      return err('ID Santri tidak valid')
    }

    const [row] = await db
      .select({
        id: students.id,
        nama: students.nama,
        color: students.color,
        groupId: groups.id,
        groupName: groups.name,
        classId: classes.id,
        className: classes.name,
      })
      .from(students)
      .leftJoin(groups, eq(students.groupId, groups.id))
      .leftJoin(classes, eq(groups.classId, classes.id))
      .where(eq(students.id, studentId))
      .limit(1)

    if (!row) return err('Data santri tidak ditemukan', 404)

    const subs = await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.waktu))

    const memos = await db
      .select({ surahNo: memorization.surahNo, status: memorization.status })
      .from(memorization)
      .where(eq(memorization.studentId, studentId))

    return ok({
      student: {
        id: row.id,
        nama: row.nama,
        color: row.color,
        group: row.groupId
          ? {
              id: row.groupId,
              nama: row.groupName || '',
              class: row.classId
                ? { id: row.classId, nama: row.className || '' }
                : null,
            }
          : null,
      },
      submissions: subs.map((s) => ({
        id: s.id,
        student_id: s.studentId,
        surah_no: s.surahNo,
        nilai: s.nilai || '',
        catatan: s.catatan || '',
        waktu: s.waktu ? s.waktu.toISOString() : '',
        ayat_start: s.ayatStart,
        ayat_end: s.ayatEnd,
        guru_nama: s.guruName,
        updated_at: s.updatedAt ? s.updatedAt.toISOString() : null,
        updated_by_name: s.updatedByName,
      })),
      memorizations: memos.map((m) => ({
        surah_no: m.surahNo,
        status: m.status ?? 0,
      })),
    })
  }
)
