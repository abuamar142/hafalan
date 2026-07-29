'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AVATAR_COLORS } from '@/lib/constants'

export async function addStudentAction(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim()
  if (!nama) throw new Error('Nama wajib diisi')

  const kelas = (formData.get('kelas') as string)?.trim() ?? ''
  const groupId = Number(formData.get('groupId'))

  const supabase = await createClient()

  // Count current students to assign color index
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id')

  if (fetchError) throw fetchError
  const colorIndex = (students?.length ?? 0) % AVATAR_COLORS.length

  const { error: insertError } = await supabase.from('students').insert({
    id: Date.now(),
    group_id: groupId,
    nama,
    kelas,
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
