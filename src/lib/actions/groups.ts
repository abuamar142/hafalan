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
    .insert({ name })
    .select('id')
    .single()

  if (error) throw error

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
  const { data: teachers } = await supabase.rpc('get_all_teachers')
  const teacher = (teachers as Array<{user_id: string, name: string}> | null)?.find(t => t.user_id === teacherId)
  const teacherName = teacher?.name || ''
  const { error } = await supabase
    .from('group_teachers')
    .insert({
      group_id: groupId,
      teacher_id: teacherId,
      teacher_name: teacherName,
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

export async function updateGroupAction(
  groupId: number,
  name: string,
  classId: number | null,
  teacherIds: string[]
) {
  if (!name.trim()) throw new Error('Nama kelompok wajib diisi')

  const supabase = await createClient()

  // 1. Update name and class_id
  const { error: groupError } = await supabase
    .from('groups')
    .update({ name: name.trim(), class_id: classId })
    .eq('id', groupId)

  if (groupError) throw groupError

  // 2. Update teachers (delete existing, insert new list with names)
  const { error: deleteTeachersError } = await supabase
    .from('group_teachers')
    .delete()
    .eq('group_id', groupId)

  if (deleteTeachersError) throw deleteTeachersError

  if (teacherIds.length > 0) {
    // Fetch teacher names
    const { data: teachers } = await supabase.rpc('get_all_teachers')
    const teacherMap: Record<string, string> = {}
    for (const t of (teachers as Array<{user_id: string, name: string}> | null) ?? []) {
      teacherMap[t.user_id] = t.name
    }

    const { error: insertTeachersError } = await supabase
      .from('group_teachers')
      .insert(
        teacherIds.map((tid) => ({
          group_id: groupId,
          teacher_id: tid,
          teacher_name: teacherMap[tid] || '',
        }))
      )

    if (insertTeachersError) throw insertTeachersError
  }

  revalidatePath('/kelompok')
  revalidatePath('/kelas')
  revalidatePath('/santri')
}
