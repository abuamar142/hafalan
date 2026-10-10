import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { submissions } from '@/lib/db/schema'

const patchSchema = z.object({
  nilai: z.string().optional(),
  catatan: z.string().optional(),
  surahNo: z.number().optional(),
  ayatStart: z.number().optional(),
  ayatEnd: z.number().nullable().optional(),
  waktu: z.string().nullable().optional(),
})

export const PATCH = handler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireSession().catch(() => null)
    if (!session) return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID setoran tidak valid')

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const d = parsed.data
    const patch: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: session.sub,
      updatedByName: session.name,
    }
    if (d.nilai !== undefined) patch.nilai = d.nilai
    if (d.catatan !== undefined) patch.catatan = d.catatan
    if (d.surahNo !== undefined) patch.surahNo = d.surahNo
    if (d.ayatStart !== undefined) patch.ayatStart = d.ayatStart
    if (d.ayatEnd !== undefined) patch.ayatEnd = d.ayatEnd
    if (d.waktu !== undefined) patch.waktu = d.waktu ? new Date(d.waktu) : null

    await db.update(submissions).set(patch).where(eq(submissions.id, id))
    return ok({ ok: true })
  }
)

export const DELETE = handler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID setoran tidak valid')

    await db.delete(submissions).where(eq(submissions.id, id))
    return ok({ ok: true })
  }
)
