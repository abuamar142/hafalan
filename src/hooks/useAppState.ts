'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getStudents } from '@/lib/data/students'
import { getMemorizationByStudentIds } from '@/lib/data/memorization'
import { getSubmissions } from '@/lib/data/submissions'
import { getSettings, getGuruNames } from '@/lib/data/settings'
import { getGroups, getAllGroupTeachers } from '@/lib/data/groups'
import { getClasses } from '@/lib/data/classes'
import type { Memorization, Settings, SantriWithCount, SetoranItem, Group, GroupTeacher, Class } from '@/lib/types'
import { computeHafalCounts, computeStudentsWithCount } from '@/lib/domain/hafalan'

const QUERY_KEY = ['dashboard-data']
const STALE_TIME = 30_000 // 30s

export interface AppState {
  students: SantriWithCount[]
  memorization: Memorization[]
  submissions: SetoranItem[]
  settings: Settings[]
  guru: string
  groups: Group[]
  groupTeachers: GroupTeacher[]
  classes: Class[]
}

const initialState: AppState = {
  students: [],
  memorization: [],
  submissions: [],
  settings: [],
  guru: '',
  groups: [],
  groupTeachers: [],
  classes: [],
}

async function fetchDashboardData(): Promise<AppState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return initialState

  // 1. Fetch all parallel
  const [students, settings, subsRaw, groups, groupTeachers, classes] = await Promise.all([
    getStudents(),
    getSettings(),
    getSubmissions(),
    getGroups(),
    getAllGroupTeachers(),
    getClasses(),
  ])

  // 2. Fetch memorization
  const studentIds = students.map((s) => s.id)
  const memorization = await getMemorizationByStudentIds(studentIds)

  // 3. Compute hafal counts
  const hafalCounts = computeHafalCounts(memorization)
  const studentsWithCount = computeStudentsWithCount(students, hafalCounts)

  // 4. Resolve guru names
  const guruNamesMap = await getGuruNames()

  // 5. Build submissions
  const submissions: SetoranItem[] = subsRaw.map((s) => ({
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
    guru_nama: s.guru_id ? (guruNamesMap[s.guru_id] || 'Ustadz') : 'Ustadz',
  }))

  // 6. Parse guru setting
  let guru = ''
  for (const r of settings) {
    if (r.key === 'guru') guru = r.value
  }

  return { students: studentsWithCount, memorization, submissions, settings, guru, groups, groupTeachers, classes }
}

export function useAppState() {
  const queryClient = useQueryClient()

  const { data: state = initialState, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDashboardData,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  })

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }, [queryClient])

  const getStudent = useCallback(
    (id: number) => state.students.find((s) => s.id === id),
    [state.students],
  )

  const getStudentMemorization = useCallback(
    (studentId: number) => state.memorization.filter((m) => m.student_id === studentId),
    [state.memorization],
  )

  return { state, loading: isLoading, refreshAll, getStudent, getStudentMemorization }
}
