import { asc, eq } from 'drizzle-orm'
import { err, handler, ok } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { groups } from '@/lib/db/schema'

export const GET = handler(async (req: Request) => {
  const classId = Number(new URL(req.url).searchParams.get('classId'))
  if (!classId) return err('classId wajib diisi')

  const rows = await db
    .select({ id: groups.id, nama: groups.name })
    .from(groups)
    .where(eq(groups.classId, classId))
    .orderBy(asc(groups.name))
  return ok(rows)
})
