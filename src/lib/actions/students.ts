'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AVATAR_COLORS } from '@/lib/constants'

export async function addStudentAction(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim()
  if (!nama) throw new Error('Nama wajib diisi')

  const groupId = Number(formData.get('groupId'))
  if (isNaN(groupId) || groupId <= 0) throw new Error('Kelompok wajib dipilih')

  const supabase = await createClient()

  // Count current students to assign color index
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id')

  if (fetchError) throw fetchError
  const colorIndex = (students?.length ?? 0) % AVATAR_COLORS.length

  const { error: insertError } = await supabase.from('students').insert({
    group_id: groupId,
    nama,
    color: AVATAR_COLORS[colorIndex],
  })

  if (insertError) throw insertError

  revalidatePath('/santri')
}

export async function deleteStudentAction(studentId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  if (error) throw error
  revalidatePath('/santri')
}

export async function updateStudentAction(
  studentId: number,
  nama: string,
  groupId: number
) {
  if (!nama.trim()) throw new Error('Nama wajib diisi')
  if (isNaN(groupId) || groupId <= 0) throw new Error('Kelompok wajib dipilih')

  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update({
      nama: nama.trim(),
      group_id: groupId,
    })
    .eq('id', studentId)

  if (error) throw error

  revalidatePath('/santri')
}
