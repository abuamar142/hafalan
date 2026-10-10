import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { err, handler, ok } from '@/lib/api-utils'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { groupTeachers, groups, users } from '@/lib/db/schema'

const patchSchema = z.object({
  name: z.string().min(1, 'Nama kelompok wajib diisi'),
  classId: z.number().nullable().optional(),
  teacherIds: z.array(z.number()).optional().default([]),
})

export const PATCH = handler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID kelompok tidak valid')

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const { name, classId, teacherIds } = parsed.data

    await db
      .update(groups)
      .set({ name: name.trim(), classId: classId ?? null })
      .where(eq(groups.id, id))

    // Ganti daftar pengampu: hapus lama, pasang baru (beserta namanya).
    await db.delete(groupTeachers).where(eq(groupTeachers.groupId, id))

    for (const tid of teacherIds) {
      const [u] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, tid))
        .limit(1)
      await db
        .insert(groupTeachers)
        .values({ groupId: id, teacherId: tid, teacherName: u?.name || '' })
    }

    return ok({ ok: true })
  }
)

export const DELETE = handler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    if (!(await requireSession().catch(() => null)))
      return err('Belum login', 401)

    const id = Number((await ctx.params).id)
    if (!id) return err('ID kelompok tidak valid')

    await db.delete(groups).where(eq(groups.id, id))
    return ok({ ok: true })
  }
)
