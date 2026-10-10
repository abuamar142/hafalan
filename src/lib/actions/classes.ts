'use server'

import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { classes, groups } from '@/lib/db/schema'

function parseGroupIds(raw: FormDataEntryValue | null): number[] {
  if (typeof raw !== 'string' || !raw) return []
  return raw
    .split(',')
    .map(Number)
    .filter((id) => !Number.isNaN(id) && id > 0)
}

function revalidateClassPaths() {
  revalidatePath('/kelas')
  revalidatePath('/kelompok')
  revalidatePath('/santri')
}

export async function createClassAction(formData: FormData) {
  await requireSession()

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nama kelas wajib diisi')

  const groupIds = parseGroupIds(formData.get('groupIds'))

  const [created] = await db.insert(classes).values({ name }).returning()
  if (!created) throw new Error('Gagal membuat kelas')

  if (groupIds.length > 0) {
    await db
      .update(groups)
      .set({ classId: created.id })
      .where(inArray(groups.id, groupIds))
  }

  revalidateClassPaths()
}

export async function deleteClassAction(classId: number) {
  await requireSession()
  await db.delete(classes).where(eq(classes.id, classId))
  revalidateClassPaths()
}

export async function updateClassAction(
  classId: number,
  name: string,
  groupIds: number[]
) {
  await requireSession()
  if (!name.trim()) throw new Error('Nama kelas wajib diisi')

  await db
    .update(classes)
    .set({ name: name.trim() })
    .where(eq(classes.id, classId))

  // 1. Lepas semua kelompok yang sebelumnya di kelas ini.
  await db.update(groups).set({ classId: null }).where(eq(groups.classId, classId))

  // 2. Pasang daftar kelompok yang baru.
  if (groupIds.length > 0) {
    await db
      .update(groups)
      .set({ classId })
      .where(inArray(groups.id, groupIds))
  }

  revalidateClassPaths()
}
