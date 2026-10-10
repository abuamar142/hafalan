import { asc } from 'drizzle-orm'
import { handler, ok } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { classes } from '@/lib/db/schema'

export const GET = handler(async () => {
  const rows = await db
    .select({ id: classes.id, nama: classes.name })
    .from(classes)
    .orderBy(asc(classes.name))
  return ok(rows)
})
