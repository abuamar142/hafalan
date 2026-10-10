import { asc, eq } from 'drizzle-orm'
import { err, handler, ok } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'

export const GET = handler(async (req: Request) => {
  const groupId = Number(new URL(req.url).searchParams.get('groupId'))
  if (!groupId) return err('groupId wajib diisi')

  const rows = await db
    .select({ id: students.id, nama: students.nama, color: students.color })
    .from(students)
    .where(eq(students.groupId, groupId))
    .orderBy(asc(students.nama))
  return ok(rows)
})
