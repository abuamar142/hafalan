'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStudents } from '@/lib/data/students'
import { getMemorizationByStudentIds } from '@/lib/data/memorization'
import { getSubmissions } from '@/lib/data/submissions'
import { getSettings, getGuruNames } from '@/lib/data/settings'
import { getGroups, getAllGroupTeachers } from '@/lib/data/groups'
import type { Memorization, Settings, SantriWithCount, SetoranItem, Group, GroupTeacher } from '@/lib/types'
import { computeHafalCounts, computeStudentsWithCount } from '@/lib/domain/hafalan'

interface AppState {
  students: SantriWithCount[]
  memorization: Memorization[]
  submissions: SetoranItem[]
  settings: Settings[]
  guru: string
  groups: Group[]
  groupTeachers: GroupTeacher[]
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    students: [],
    memorization: [],
    submissions: [],
    settings: [],
    guru: '',
    groups: [],
    groupTeachers: [],
  })
  const [loading, setLoading] = useState(true)

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setState({ students: [], memorization: [], submissions: [], settings: [], guru: '', groups: [], groupTeachers: [] })
        setLoading(false)
        return
      }

      // 1. Fetch students, settings, submissions in parallel
      const [students, settings, subsRaw, groups, groupTeachers] = await Promise.all([
        getStudents(),
        getSettings(),
        getSubmissions(),
        getGroups(),
        getAllGroupTeachers(),
      ])

      // 2. Fetch memorization for all students to compute hafal counts
      const studentIds = students.map((s) => s.id)
      const memorization = await getMemorizationByStudentIds(studentIds)

      // Compute hafal_count per student
      const hafalCounts = computeHafalCounts(memorization)
      const studentsWithCount = computeStudentsWithCount(students, hafalCounts)

      // 3. Resolve guru names from settings
      const guruNamesMap = await getGuruNames()

      // 4. Build submissions
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

      // 5. Parse current user's guru setting
      let guru = ''
      for (const r of settings) {
        if (r.key === 'guru') guru = r.value
      }

      setState({ students: studentsWithCount, memorization, submissions, settings, guru, groups, groupTeachers })
    } catch (err) {
      console.error('useAppState fetchAll', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

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
    refreshAll: fetchAll,
    getStudent,
    getStudentMemorization,
  }
}
