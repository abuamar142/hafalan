import type { Memorization, Student, SantriWithCount } from '../types'

/**
 * Count hafal (done) and inProgress memorization entries per student.
 * Status 1 = hafal (done), Status 2 = murajaah (inProgress).
 */
export function computeHafalCounts(
  hafalan: Memorization[],
): Record<number, { done: number; inProgress: number }> {
  const counts: Record<number, { done: number; inProgress: number }> = {}

  for (const m of hafalan) {
    let entry = counts[m.student_id]
    if (!entry) {
      entry = { done: 0, inProgress: 0 }
      counts[m.student_id] = entry
    }
    if (m.status === 1) {
      entry.done += 1
    } else if (m.status === 2) {
      entry.inProgress += 1
    }
  }

  return counts
}

/**
 * Enrich students with their hafal count (done) for dashboard display.
 */
export function computeStudentsWithCount(
  students: Student[],
  hafalCounts: Record<number, { done: number; inProgress: number }>,
): SantriWithCount[] {
  return students.map((s) => ({
    ...s,
    hafal_count: hafalCounts[s.id]?.done ?? 0,
  }))
}

/**
 * Cycle surah memorization status: 0 → 1 → 2 → 0.
 * 0 = belum, 1 = hafal, 2 = murajaah.
 */
export function toggleSurahCycle(currentStatus: number): number {
  return (currentStatus + 1) % 3
}
