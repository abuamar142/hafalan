'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AVATAR_COLORS } from '@/lib/constants'

export async function addStudentAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const nama = (formData.get('nama') as string)?.trim()
  if (!nama) throw new Error('Nama wajib diisi')

  const kelas = (formData.get('kelas') as string)?.trim() ?? ''
  const usia = (formData.get('usia') as string)?.trim() ?? ''

  // Count existing students to pick avatar color
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const colorIndex = (count ?? 0) % AVATAR_COLORS.length

  const { error } = await supabase.from('students').insert({
    id: Date.now(),
    user_id: user.id,
    nama,
    kelas,
    usia,
    color: AVATAR_COLORS[colorIndex],
  })

  if (error) throw error

  revalidatePath('/santri')
}

export async function deleteStudentAction(studentId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (error) throw error

  revalidatePath('/santri')
}
