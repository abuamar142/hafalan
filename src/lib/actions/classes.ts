'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClassAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nama kelas wajib diisi')

  const groupIdsRaw = formData.get('groupIds') as string
  const groupIds = groupIdsRaw ? groupIdsRaw.split(',').map(Number).filter(id => !isNaN(id) && id > 0) : []

  const supabase = await createClient()

  // Create the class
  const { data: newClass, error: insertError } = await supabase
    .from('classes')
    .insert({ name })
    .select('*')
    .single()

  if (insertError) throw insertError

  // Assign groups to the class
  if (groupIds.length > 0) {
    const { error: assignError } = await supabase
      .from('groups')
      .update({ class_id: newClass.id })
      .in('id', groupIds)

    if (assignError) throw assignError
  }

  revalidatePath('/kelas')
  revalidatePath('/kelompok')
  revalidatePath('/santri')
}

export async function deleteClassAction(classId: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)

  if (error) throw error

  revalidatePath('/kelas')
  revalidatePath('/kelompok')
  revalidatePath('/santri')
}

export async function updateClassAction(
  classId: number,
  name: string,
  groupIds: number[]
) {
  if (!name.trim()) throw new Error('Nama kelas wajib diisi')

  const supabase = await createClient()
  const { error: classError } = await supabase
    .from('classes')
    .update({ name: name.trim() })
    .eq('id', classId)

  if (classError) throw classError

  // 1. Clear class_id of other groups that were previously in this class
  const { error: clearError } = await supabase
    .from('groups')
    .update({ class_id: null })
    .eq('class_id', classId)

  if (clearError) throw clearError

  // 2. Assign class_id to new group list
  if (groupIds.length > 0) {
    const { error: assignError } = await supabase
      .from('groups')
      .update({ class_id: classId })
      .in('id', groupIds)

    if (assignError) throw assignError
  }

  revalidatePath('/kelas')
  revalidatePath('/kelompok')
  revalidatePath('/santri')
}
