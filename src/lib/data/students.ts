import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types'

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)

  return (data ?? []) as Student[]
}

export async function getStudentIds(): Promise<number[]> {
  const students = await getStudents()
  return students.map((s) => s.id)
}

export async function addStudent(student: {
  id: number
  user_id: string
  nama: string
  kelas: string
  usia: string
  color: string
}): Promise<void> {
  const supabase = createClient()
  await supabase.from('students').insert(student)
}

export async function deleteStudent(id: number): Promise<void> {
  const supabase = createClient()
  await supabase.from('students').delete().eq('id', id)
}
