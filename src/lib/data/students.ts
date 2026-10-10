import { apiGet } from '@/lib/api-client'
import type { Student } from '@/lib/types'

export async function getStudents(): Promise<Student[]> {
  return apiGet<Student[]>('/api/students')
}
