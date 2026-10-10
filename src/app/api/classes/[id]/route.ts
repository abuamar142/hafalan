import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { classes, groups } from '@/lib/db/schema'

const patchSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  groupIds: z.array(z.number()).optional().default([]),
})

export const PATCH = handler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID kelas tidak valid')

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    await db
      .update(classes)
      .set({ name: parsed.data.name.trim() })
      .where(eq(classes.id, id))

    // Kosongkan dulu, lalu pasang daftar kelompok yang baru.
    await db.update(groups).set({ classId: null }).where(eq(groups.classId, id))
    for (const gid of parsed.data.groupIds) {
      await db.update(groups).set({ classId: id }).where(eq(groups.id, gid))
    }

    return ok({ ok: true })
  }
)

export const DELETE = handler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID kelas tidak valid')

    await db.delete(classes).where(eq(classes.id, id))
    return ok({ ok: true })
  }
)
