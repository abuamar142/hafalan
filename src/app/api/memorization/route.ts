import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { memorization } from '@/lib/db/schema'

export const GET = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null))) return err('Belum login', 401)

  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId')
  const idsParam = url.searchParams.get('studentIds')

  let rows
  if (studentId) {
    rows = await db
      .select()
      .from(memorization)
      .where(eq(memorization.studentId, Number(studentId)))
  } else if (idsParam) {
    const ids = idsParam
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
    rows =
      ids.length === 0
        ? []
        : await db
            .select()
            .from(memorization)
            .where(inArray(memorization.studentId, ids))
  } else {
    rows = await db.select().from(memorization)
  }

  return ok(
    rows.map((m) => ({
      id: m.id,
      student_id: m.studentId,
      surah_no: m.surahNo,
      status: m.status ?? 0,
    }))
  )
})

const putSchema = z.object({
  studentId: z.number(),
  surahNo: z.number(),
  status: z.number(),
})

export const PUT = handler(async (req: Request) => {
  if (!(await requireSession().catch(() => null)))
    return err('Belum login', 401)

  const parsed = putSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const { studentId, surahNo, status } = parsed.data
  await db
    .insert(memorization)
    .values({ studentId, surahNo, status })
    .onConflictDoUpdate({
      target: [memorization.studentId, memorization.surahNo],
      set: { status },
    })

  return ok({ ok: true })
})
