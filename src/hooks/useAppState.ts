'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStudents } from '@/lib/data/students'
import { getMemorizationByStudentIds } from '@/lib/data/memorization'
import { getSubmissions } from '@/lib/data/submissions'
import { getGroups, getAllGroupTeachers } from '@/lib/data/groups'
import { getClasses } from '@/lib/data/classes'
import type { Memorization, SantriWithCount, SetoranItem, Group, GroupTeacher, Class } from '@/lib/types'
import { computeHafalCounts, computeStudentsWithCount } from '@/lib/domain/hafalan'

// ── Query keys (exported for selective invalidation from pages) ──
export const QK = {
  classes: ['classes'],
  groups: ['groups'],
  groupTeachers: ['group-teachers'],
  students: ['students'],
  memorization: ['memorization'],
  submissions: ['submissions'],
} as const

const STALE = {
  rare: 5 * 60_000,
  medium: 2 * 60_000,
  frequent: 30_000,
}

export interface AppState {
  students: SantriWithCount[]
  memorization: Memorization[]
  submissions: SetoranItem[]
  groups: Group[]
  groupTeachers: GroupTeacher[]
  classes: Class[]
}

export function useAppState() {
  const queryClient = useQueryClient()

  // ── Rarely-changing (5 min) ──
  const cq = useQuery({ queryKey: QK.classes, queryFn: getClasses, staleTime: STALE.rare })
  const gq = useQuery({ queryKey: QK.groups, queryFn: getGroups, staleTime: STALE.rare })
  const gtq = useQuery({ queryKey: QK.groupTeachers, queryFn: getAllGroupTeachers, staleTime: STALE.rare })

  // ── Medium-changing (2 min) ──
  const stq = useQuery({ queryKey: QK.students, queryFn: getStudents, staleTime: STALE.medium })

  // ── Frequently-changing (30s) ──
  const students = stq.data ?? []
  const mq = useQuery({
    queryKey: QK.memorization,
    queryFn: () => getMemorizationByStudentIds(students.map((s) => s.id)),
    staleTime: STALE.frequent,
    enabled: students.length > 0,
  })
  const subq = useQuery({ queryKey: QK.submissions, queryFn: getSubmissions, staleTime: STALE.frequent })

  // ── Derived state ──
  const hafalCounts = useMemo(() => computeHafalCounts(mq.data ?? []), [mq.data])
  const studentsWithCount = useMemo(
    () => computeStudentsWithCount(students, hafalCounts),
    [students, hafalCounts],
  )

  const submissions: SetoranItem[] = useMemo(
    () =>
      (subq.data ?? []).map((s: any) => ({
        id: s.id,
        santri_id: s.student_id,
        santri_nama: s.students?.nama || '',
        surah_no: s.surah_no,
        nilai: s.nilai,
        catatan: s.catatan,
        waktu: s.waktu,
        ayat_start: s.ayat_start ?? null,
        ayat_end: s.ayat_end ?? null,
        guru_id: s.guru_id ?? null,
        guru_nama: s.guru_name || 'Ustadz',
      })),
    [subq.data],
  )

  // ── Loading (initial fetch only) ──
  const loading = cq.isLoading || gq.isLoading || gtq.isLoading
    || stq.isLoading || subq.isLoading
    || (students.length > 0 && mq.isLoading)

  // ── Selective invalidation ──
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries()
  }, [queryClient])

  const refreshStudents = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QK.students }),
      queryClient.invalidateQueries({ queryKey: QK.memorization }),
    ])
  }, [queryClient])

  const refreshSubmissions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QK.submissions })
  }, [queryClient])

  const refreshMemorization = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QK.memorization })
  }, [queryClient])

  const refreshClasses = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QK.classes }),
      queryClient.invalidateQueries({ queryKey: QK.groups }),
    ])
  }, [queryClient])

  // ── Aggregate state ──
  const state: AppState = useMemo(() => ({
    students: studentsWithCount,
    memorization: mq.data ?? [],
    submissions,
    groups: gq.data ?? [],
    groupTeachers: gtq.data ?? [],
    classes: cq.data ?? [],
  }), [studentsWithCount, mq.data, submissions, gq.data, gtq.data, cq.data])

  // ── Helpers ──
  const getStudent = useCallback(
    (id: number) => state.students.find((s) => s.id === id),
    [state.students],
  )

  const getStudentMemorization = useCallback(
    (studentId: number) => state.memorization.filter((m) => m.student_id === studentId),
    [state.memorization],
  )

  return {
    state,
    loading,
    refreshAll,
    refreshStudents,
    refreshSubmissions,
    refreshMemorization,
    refreshClasses,
    getStudent,
    getStudentMemorization,
  }
}
