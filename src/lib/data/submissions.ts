import { apiGet } from '@/lib/api-client'
import type { Submission } from '@/lib/types'

type SubmissionRow = Submission & { students?: { nama: string } | null }

export async function getSubmissions(): Promise<SubmissionRow[]> {
  return apiGet<SubmissionRow[]>('/api/submissions')
}

export async function getStudentSubmissions(
  studentId: number
): Promise<SubmissionRow[]> {
  return apiGet<SubmissionRow[]>(`/api/submissions?studentId=${studentId}`)
}
