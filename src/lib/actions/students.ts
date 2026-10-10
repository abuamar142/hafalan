'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { AVATAR_COLORS } from '@/lib/constants'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'

export async function addStudentAction(formData: FormData) {
  await requireSession()

  const nama = (formData.get('nama') as string)?.trim()
  if (!nama) throw new Error('Nama wajib diisi')

  const groupId = Number(formData.get('groupId'))
  if (Number.isNaN(groupId) || groupId <= 0)
    throw new Error('Kelompok wajib dipilih')

  // Warna avatar bergilir sesuai jumlah santri yang ada.
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
  const colorIndex = (row?.count ?? 0) % AVATAR_COLORS.length

  await db
    .insert(students)
    .values({ groupId, nama, color: AVATAR_COLORS[colorIndex] })

  revalidatePath('/santri')
}

export async function deleteStudentAction(studentId: number) {
  await requireSession()
  await db.delete(students).where(eq(students.id, studentId))
  revalidatePath('/santri')
}

export async function updateStudentAction(
  studentId: number,
  nama: string,
  groupId: number
) {
  await requireSession()
  if (!nama.trim()) throw new Error('Nama wajib diisi')
  if (Number.isNaN(groupId) || groupId <= 0)
    throw new Error('Kelompok wajib dipilih')

  await db
    .update(students)
    .set({ nama: nama.trim(), groupId })
    .where(eq(students.id, studentId))

  revalidatePath('/santri')
}
