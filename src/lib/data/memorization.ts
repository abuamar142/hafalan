import { createClient } from '@/lib/supabase/client'
import type { Memorization } from '@/lib/types'

export async function getMemorizationByStudentIds(
  studentIds: number[]
): Promise<Memorization[]> {
  if (studentIds.length === 0) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('memorization')
    .select('student_id, surah_no, status')
    .in('student_id', studentIds)

  return (data ?? []) as Memorization[]
}

export async function getStudentMemorization(
  studentId: number
): Promise<Memorization[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('memorization')
    .select('student_id, surah_no, status')
    .eq('student_id', studentId)

  return (data ?? []) as Memorization[]
}

export async function getAllMemorizationMap(): Promise<Record<number, Memorization[]>> {
  const supabase = createClient()
  const { data } = await supabase
    .from('memorization')
    .select('student_id, surah_no, status')

  const rows = (data ?? []) as Memorization[]
  const map: Record<number, Memorization[]> = {}
  for (const m of rows) {
    let arr = map[m.student_id]
    if (!arr) {
      arr = []
      map[m.student_id] = arr
    }
    arr.push(m)
  }
  return map
}
