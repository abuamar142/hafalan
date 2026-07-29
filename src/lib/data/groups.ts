import { createClient } from '@/lib/supabase/client'
import type { Group } from '@/lib/types'

export async function getGroups(): Promise<Group[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  return (data ?? []) as Group[]
}

export async function getGroupTeachers(
  groupId: number
): Promise<{ teacher_id: string }[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_teachers')
    .select('teacher_id')
    .eq('group_id', groupId)

  if (error) throw error
  return (data ?? []) as { teacher_id: string }[]
}

export async function getAllGroupTeachers(): Promise<{ id: number; group_id: number; teacher_id: string }[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_teachers')
    .select('*')

  if (error) throw error
  return (data ?? []) as { id: number; group_id: number; teacher_id: string }[]
}
