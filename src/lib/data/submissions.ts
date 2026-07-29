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

export async function addSubmission(submission: {
  student_id: number
  surah_no: number
  nilai: string
  catatan: string
  waktu: string
  guru_id: string | null
  ayat_start?: number | null
  ayat_end?: number | null
}): Promise<void> {
  const supabase = createClient()
  await supabase.from('submissions').insert(submission)
}
