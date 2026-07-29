import { getPct, getTotalHafal } from '../helpers'
import type { SantriWithCount } from '../types'

export interface DashboardStats {
  totalStudents: number
  totalHafal: number
  averageHafal: number
}

/**
 * Compute aggregate dashboard statistics from enriched student list.
 */
export function computeDashboardStats(
  studentsWithCount: SantriWithCount[],
): DashboardStats {
  const totalStudents = studentsWithCount.length
  const totalHafal = studentsWithCount.reduce(
    (sum, s) => sum + getTotalHafal(s),
    0,
  )
  const averageHafal =
    totalStudents > 0 ? Math.round(totalHafal / totalStudents) : 0

  return { totalStudents, totalHafal, averageHafal }
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
  totalHafal: number
  averageHafal: number
  averagePct: number
}

/**
 * Compute report-level aggregate statistics.
 */
export function computeReportStats(
  studentsWithCount: SantriWithCount[],
): ReportStats {
  const totalStudents = studentsWithCount.length
  const totalHafal = studentsWithCount.reduce(
    (sum, s) => sum + getTotalHafal(s),
    0,
  )
  const averageHafal =
    totalStudents > 0 ? Math.round(totalHafal / totalStudents) : 0
  const averagePct =
    totalStudents > 0
      ? Math.round(
          studentsWithCount.reduce((sum, s) => sum + getPct(s), 0) /
            totalStudents,
        )
      : 0

  return { totalStudents, totalHafal, averageHafal, averagePct }
}
