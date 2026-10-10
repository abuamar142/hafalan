import { apiGet } from '@/lib/api-client'
import type { Memorization } from '@/lib/types'

export async function getMemorizationByStudentIds(
  studentIds: number[]
): Promise<Memorization[]> {
  if (studentIds.length === 0) return []
  return apiGet<Memorization[]>(
    `/api/memorization?studentIds=${studentIds.join(',')}`
  )
}

export async function getStudentMemorization(
  studentId: number
): Promise<Memorization[]> {
  return apiGet<Memorization[]>(`/api/memorization?studentId=${studentId}`)
}

export async function getAllMemorizationMap(): Promise<
  Record<number, Memorization[]>
> {
  const rows = await apiGet<Memorization[]>('/api/memorization')
  const map: Record<number, Memorization[]> = {}
  for (const m of rows) {
    const arr = map[m.student_id]
    if (arr) arr.push(m)
    else map[m.student_id] = [m]
  }
  return map
}
