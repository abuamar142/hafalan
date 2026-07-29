import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types'

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, nama, color, group_id, groups(name, class_id, classes(name))')

  if (error) throw error

  const rows = (data ?? []) as any[]
  return rows.map((s) => {
    const groupObj = Array.isArray(s.groups) ? s.groups[0] : s.groups
    const classObj = groupObj?.classes ? (Array.isArray(groupObj.classes) ? groupObj.classes[0] : groupObj.classes) : null
    return {
      id: s.id,
      group_id: s.group_id,
      nama: s.nama,
      color: s.color,
      group_name: groupObj?.name || 'Tanpa Kelompok',
      class_name: classObj?.name || 'Tanpa Kelas',
      kelas: classObj?.name || 'Tanpa Kelas',
    }
  })
}


