'use server'

import { revalidatePath } from 'next/cache'
import {
  createGroup,
  deleteGroup,
  addTeacherToGroup,
  removeTeacherFromGroup,
} from '@/lib/data/groups'

export async function createGroupAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nama kelompok wajib diisi')

  await createGroup(name)
  revalidatePath('/kelompok')
}

export async function deleteGroupAction(groupId: number) {
  await deleteGroup(groupId)
  revalidatePath('/kelompok')
}

export async function addTeacherAction(groupId: number, teacherId: string) {
  await addTeacherToGroup(groupId, teacherId)
  revalidatePath('/kelompok')
}

export async function removeTeacherAction(groupId: number, teacherId: string) {
  await removeTeacherFromGroup(groupId, teacherId)
  revalidatePath('/kelompok')
}
