'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPublicClassesAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama:name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPublicGroupsAction(kelasId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('id, nama')
    .eq('kelas_id', kelasId)
    .order('nama', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPublicStudentsAction(groupId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, nama, color')
    .eq('group_id', groupId)
    .order('nama', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPublicStudentReportAction(studentId: number) {
  const supabase = await createClient()

  // Fetch student info with class & group names
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      id,
      nama,
      color,
      group:groups (
        id,
        nama,
        class:classes (
          id,
          nama:name
        )
      )
    `)
    .eq('id', studentId)
    .single()

  if (studentError) throw studentError
  if (!student) throw new Error('Santri tidak ditemukan')

  // Fetch submissions (history)
  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId)
    .order('waktu', { ascending: false })

  if (subError) throw subError

  // Fetch memorized status
  const { data: memorizations, error: memError } = await supabase
    .from('memorization')
    .select('surah_no, status')
    .eq('student_id', studentId)

  if (memError) throw memError

  return {
    student,
    submissions: submissions || [],
    memorizations: memorizations || []
  }
}
