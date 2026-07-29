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


