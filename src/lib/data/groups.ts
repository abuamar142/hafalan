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

export async function createGroup(name: string): Promise<void> {
  const supabase = createClient()
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
}

export async function deleteGroup(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function addTeacherToGroup(
  groupId: number,
  teacherId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('group_teachers')
    .insert({
      group_id: groupId,
      teacher_id: teacherId,
    })

  if (error) throw error
}

export async function removeTeacherFromGroup(
  groupId: number,
  teacherId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('group_teachers')
    .delete()
    .eq('group_id', groupId)
    .eq('teacher_id', teacherId)

  if (error) throw error
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
