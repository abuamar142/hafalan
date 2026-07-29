import { createClient } from '@/lib/supabase/client'
import type { Group } from '@/lib/types'

export async function getGroups(): Promise<Group[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*, classes(name)')
    .order('name', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as any[]
  return rows.map((g) => {
    const classObj = Array.isArray(g.classes) ? g.classes[0] : g.classes
    return {
      id: g.id,
      name: g.name,
      created_at: g.created_at,
      class_id: g.class_id,
      class_name: classObj?.name || 'Tanpa Kelas',
    }
  })
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
