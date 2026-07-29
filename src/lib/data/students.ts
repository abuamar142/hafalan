import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types'

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, nama, kelas, color, group_id, groups(name)')

  if (error) throw error

  const rows = (data ?? []) as any[]
  return rows.map((s) => {
    const groupObj = Array.isArray(s.groups) ? s.groups[0] : s.groups
    return {
      id: s.id,
      group_id: s.group_id,
      nama: s.nama,
      kelas: s.kelas,
      color: s.color,
      group_name: groupObj?.name || 'Tanpa Kelompok',
    }
  })
}

export async function addStudent(student: {
  id: number
  group_id: number
  nama: string
  kelas: string
  color: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').insert(student)
  if (error) throw error
}

export async function deleteStudent(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}
