import { getPct } from '../helpers'
import type { SantriWithCount } from '../types'

export interface DashboardStats {
  totalStudents: number
  totalJuz: number
  averageJuz: number
}

/**
 * Compute aggregate dashboard statistics from enriched student list.
 */
export function computeDashboardStats(
  studentsWithCount: SantriWithCount[],
): DashboardStats {
  const totalStudents = studentsWithCount.length
  const totalJuz = studentsWithCount.reduce(
    (sum, s) => sum + (s.juz_selesai || 0),
    0,
  )
  const averageJuz =
    totalStudents > 0 ? Math.round(totalJuz / totalStudents) : 0

  return { totalStudents, totalJuz, averageJuz }
}

/**
 * Return students sorted by hafal percentage (descending).
 */
export function computeRanking(
  studentsWithCount: SantriWithCount[],
): SantriWithCount[] {
  return [...studentsWithCount].sort((a, b) => getPct(b) - getPct(a))
}

export interface ReportStats {
  totalStudents: number
  totalJuz: number
  averageJuz: number
  averagePct: number
}

/**
 * Compute report-level aggregate statistics.
 */
export function computeReportStats(
  studentsWithCount: SantriWithCount[],
): ReportStats {
  const totalStudents = studentsWithCount.length
  const totalJuz = studentsWithCount.reduce(
    (sum, s) => sum + (s.juz_selesai || 0),
    0,
  )
  const averageJuz =
    totalStudents > 0 ? Math.round(totalJuz / totalStudents) : 0
  const averagePct =
    totalStudents > 0
      ? Math.round(
          studentsWithCount.reduce((sum, s) => sum + getPct(s), 0) /
            totalStudents,
        )
      : 0

  return { totalStudents, totalJuz, averageJuz, averagePct }
}
