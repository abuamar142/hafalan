import { createClient } from '@/lib/supabase/client'
import type { Submission } from '@/lib/types'

type SubmissionRow = Submission & { students?: { nama: string } | null }

export async function getSubmissions(): Promise<SubmissionRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('*, students(nama)')
    .order('id', { ascending: false })
    .limit(999)

  return (data ?? []) as SubmissionRow[]
}

export async function getStudentSubmissions(
  studentId: number
): Promise<SubmissionRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('*, students(nama)')
    .eq('student_id', studentId)
    .order('id', { ascending: false })

  return (data ?? []) as SubmissionRow[]
}


