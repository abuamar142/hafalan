'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AVATAR_COLORS } from '@/lib/constants'
import type { Student, Memorization, Submission, Settings, SantriWithCount, SetoranItem } from '@/lib/types'

interface AppState {
  students: SantriWithCount[]
  memorization: Memorization[]
  submissions: SetoranItem[]
  settings: Settings[]
  guru: string
}

export function useAppState() {
  const supabase = createClient()

  const [state, setState] = useState<AppState>({
    students: [],
    memorization: [],
    submissions: [],
    settings: [],
    guru: '',
  })
  const [loading, setLoading] = useState(true)

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setState({ students: [], memorization: [], submissions: [], settings: [], guru: '' })
        setLoading(false)
        return
      }

      const [studentsRes, settingsRes, submissionsRes] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', user.id),
        supabase.from('settings').select('key, value, user_id').eq('user_id', user.id),
        supabase
          .from('submissions')
          .select('*, students(nama)')
          .order('id', { ascending: false })
          .limit(999),
      ])

      const students = (studentsRes.data ?? []) as Student[]
      const settings = (settingsRes.data ?? []) as Settings[]

      // Fetch memorization for all students
      const studentIds = students.map((s) => s.id)
      let memorization: Memorization[] = []
      if (studentIds.length > 0) {
        const { data: memos } = await supabase
          .from('memorization')
          .select('student_id, surah_no, status')
          .in('student_id', studentIds)
        memorization = (memos ?? []) as Memorization[]
      }

      // Compute hafal_count per student
      const hafalCounts: Record<number, number> = {}
      for (const m of memorization) {
        if (m.status === 1) {
          hafalCounts[m.student_id] = (hafalCounts[m.student_id] || 0) + 1
        }
      }

      const studentsWithCount: SantriWithCount[] = students.map((s) => ({
        ...s,
        hafal_count: hafalCounts[s.id] || 0,
      }))

      // Parse submissions
      const subsRaw = (submissionsRes.data ?? []) as Array<
        Submission & { students?: { nama: string } | null }
      >

      // Build guru names map from settings (user_id -> guru name)
      // We need to fetch all guru settings for all users to resolve guru_names
      const guruIds = [...new Set(subsRaw.map((s) => s.guru_id).filter(Boolean))] as string[]
      const guruNamesMap: Record<string, string> = {}
      if (guruIds.length > 0) {
        const { data: guruSettings } = await supabase
          .from('settings')
          .select('value, user_id')
          .eq('key', 'guru')
          .in('user_id', guruIds)
        for (const gs of guruSettings ?? []) {
          guruNamesMap[gs.user_id] = gs.value
        }
      }

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

      // Parse settings
      let guru = ''
      for (const r of settings) {
        if (r.key === 'guru') guru = r.value
      }

      setState({ students: studentsWithCount, memorization, submissions, settings, guru })
    } catch (err) {
      console.error('useAppState fetchAll', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

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

  // ── Mutations ──

  const addStudent = useCallback(
    async (nama: string, kelas: string, usia: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newId = Date.now()
      const colorIndex = state.students.length % AVATAR_COLORS.length

      await supabase.from('students').insert({
        id: newId,
        user_id: user.id,
        nama,
        kelas,
        usia,
        color: AVATAR_COLORS[colorIndex],
      })

      await fetchAll()
    },
    [supabase, state.students.length, fetchAll],
  )

  const updateGuru = useCallback(
    async (guruName: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('settings').upsert({
        key: 'guru',
        value: guruName,
        user_id: user.id,
      })

      setState((prev) => ({ ...prev, guru: guruName }))
    },
    [supabase],
  )

  return {
    state,
    loading,
    refreshAll: fetchAll,
    getStudent,
    getStudentMemorization,
    addStudent,
    updateGuru,
  }
}
