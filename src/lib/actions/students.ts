'use server'

import { revalidatePath } from 'next/cache'
import { AVATAR_COLORS } from '@/lib/constants'
import { getStudents, addStudent, deleteStudent } from '@/lib/data/students'

export async function addStudentAction(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim()
  if (!nama) throw new Error('Nama wajib diisi')

  const kelas = (formData.get('kelas') as string)?.trim() ?? ''
  const groupId = Number(formData.get('groupId'))

  const students = await getStudents()
  const colorIndex = students.length % AVATAR_COLORS.length

  await addStudent({
    id: Date.now(),
    group_id: groupId,
    nama,
    kelas,
    color: AVATAR_COLORS[colorIndex],
  })

  revalidatePath('/santri')
}

export async function deleteStudentAction(studentId: number) {
  await deleteStudent(studentId)
  revalidatePath('/santri')
}
