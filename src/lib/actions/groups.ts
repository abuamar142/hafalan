'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { groupTeachers, groups, users } from '@/lib/db/schema'

function revalidateGroupPaths() {
  revalidatePath('/kelompok')
  revalidatePath('/kelas')
  revalidatePath('/santri')
}

export async function createGroupAction(formData: FormData) {
  await requireSession()
  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nama kelompok wajib diisi')

  await db.insert(groups).values({ name })
  revalidateGroupPaths()
}

export async function deleteGroupAction(groupId: number) {
  await requireSession()
  await db.delete(groups).where(eq(groups.id, groupId))
  revalidateGroupPaths()
}

export async function addTeacherAction(groupId: number, teacherId: string) {
  await requireSession()
  const tid = Number(teacherId)
  if (!tid) throw new Error('Ustadz tidak valid')

  const [teacher] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, tid))
    .limit(1)

  await db
    .insert(groupTeachers)
    .values({ groupId, teacherId: tid, teacherName: teacher?.name || '' })
    .onConflictDoNothing()

  revalidateGroupPaths()
}

export async function removeTeacherAction(groupId: number, teacherId: string) {
  await requireSession()
  const tid = Number(teacherId)
  if (!tid) return

  await db
    .delete(groupTeachers)
    .where(
      and(eq(groupTeachers.groupId, groupId), eq(groupTeachers.teacherId, tid))
    )

  revalidateGroupPaths()
}

export async function updateGroupAction(
  groupId: number,
  name: string,
  classId: number | null,
  teacherIds: string[]
) {
  await requireSession()
  if (!name.trim()) throw new Error('Nama kelompok wajib diisi')

  // 1. Nama & kelas.
  await db
    .update(groups)
    .set({ name: name.trim(), classId })
    .where(eq(groups.id, groupId))

  // 2. Ganti daftar pengampu (hapus lalu pasang ulang beserta namanya).
  await db.delete(groupTeachers).where(eq(groupTeachers.groupId, groupId))

  const ids = teacherIds.map(Number).filter((n) => !Number.isNaN(n) && n > 0)
  if (ids.length > 0) {
    const rows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, ids))
    const nameMap = new Map(rows.map((r) => [r.id, r.name]))

    await db.insert(groupTeachers).values(
      ids.map((tid) => ({
        groupId,
        teacherId: tid,
        teacherName: nameMap.get(tid) || '',
      }))
    )
  }

  revalidateGroupPaths()
}
