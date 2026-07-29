'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGroupAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nama kelompok wajib diisi')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('groups')
    .insert({ name, user_id: user.id })
    .select('id')
    .single()

  if (error) throw error

  const { error: relationError } = await supabase
    .from('group_teachers')
    .insert({
      group_id: data.id,
      teacher_id: user.id,
    })

  if (relationError) throw relationError

  revalidatePath('/kelompok')
}

export async function deleteGroupAction(groupId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
  revalidatePath('/kelompok')
}

export async function addTeacherAction(groupId: number, teacherId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('group_teachers')
    .insert({
      group_id: groupId,
      teacher_id: teacherId,
    })

  if (error) throw error
  revalidatePath('/kelompok')
}

export async function removeTeacherAction(groupId: number, teacherId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('group_teachers')
    .delete()
    .eq('group_id', groupId)
    .eq('teacher_id', teacherId)

  if (error) throw error
  revalidatePath('/kelompok')
}
