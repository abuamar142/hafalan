import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'

const patchSchema = z.object({
  nama: z.string().min(1).optional(),
  groupId: z.number().nullable().optional(),
  color: z.string().optional(),
})

export const PATCH = handler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID santri tidak valid')

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.nama !== undefined) patch.nama = parsed.data.nama.trim()
    if (parsed.data.groupId !== undefined) patch.groupId = parsed.data.groupId
    if (parsed.data.color !== undefined) patch.color = parsed.data.color

    if (Object.keys(patch).length > 0) {
      await db.update(students).set(patch).where(eq(students.id, id))
    }

    return ok({ ok: true })
  }
)

export const DELETE = handler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID santri tidak valid')

    await db.delete(students).where(eq(students.id, id))
    return ok({ ok: true })
  }
)
