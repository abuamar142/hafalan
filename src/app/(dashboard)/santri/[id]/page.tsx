'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../../layout'
import { createClient } from '@/lib/supabase/client'
import {
  getSurahNama,
  getJuzSurahs,
  getJuzSurahsFromHafalan,
  getJuzSelesaiFromHafalan,
  getPctFromCount,
  getColor,
  initials,
  formatWaktu,
} from '@/lib/helpers'
import type { Memorization, SetoranItem } from '@/lib/types'

export default function ProfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { state, refreshAll, getStudent, getStudentMemorization } =
    useDashboard()

  const [studentId, setStudentId] = useState<number | null>(null)
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)
  const [toggling, setToggling] = useState(false)

  // Unwrap async params
  useEffect(() => {
    params.then((p) => setStudentId(Number(p.id)))
  }, [params])

  const student = studentId != null ? getStudent(studentId) : undefined

  const memorization =
    studentId != null ? getStudentMemorization(studentId) : []

  // Build hafalan map from memorization
  const hafalan = useMemo(() => {
    const map: Record<number, number> = {}
    memorization.forEach((m) => {
      map[m.surah_no] = m.status
    })
    return map
  }, [memorization])

  // Student submissions
  const studentSubmissions = useMemo(() => {
    if (studentId == null) return []
    return state.submissions
      .filter((s) => s.santri_id === studentId)
      .sort((a, b) => b.id - a.id)
  }, [state.submissions, studentId])

  // Juz percentages
  const juzPcts = useMemo(() => {
    return [...Array(30)].map((_, i) => getJuzSurahsFromHafalan(hafalan, i + 1))
  }, [hafalan])

  const juzSelesai = useMemo(
    () => getJuzSelesaiFromHafalan(hafalan),
    [hafalan]
  )

  const hafalCount = useMemo(
    () => Object.values(hafalan).filter((v) => v === 1).length,
    [hafalan]
  )

  const pct = getPctFromCount(hafalCount)

  const colorIndex = useMemo(() => {
    if (!student) return 0
    return state.students.findIndex((s) => s.id === student.id)
  }, [student, state.students])

  // Toggle surah status
  async function toggleSurah(surahNo: number) {
    if (toggling || studentId == null) return
    setToggling(true)
    try {
      const supabase = createClient()
      const current = hafalan[surahNo] || 0
      const next = (current + 1) % 3

      const { data: existing } = await supabase
        .from('memorization')
        .select('id')
        .eq('student_id', studentId)
        .eq('surah_no', surahNo)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('memorization')
          .update({ status: next })
          .eq('id', existing.id)
      } else {
        await supabase.from('memorization').insert({
          student_id: studentId,
          surah_no: surahNo,
          status: next,
        })
      }

      await refreshAll()
    } catch {
      // silently ignore
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!student || studentId == null) return
    if (!confirm(`Hapus santri "${student.nama}"? Semua data terkait akan dihapus.`)) return
    try {
      await (await import('@/lib/supabase/client')).createClient()
        .from('students')
        .delete()
        .eq('id', studentId)
      await refreshAll()
      router.push('/santri')
    } catch {
      // silently ignore
    }
  }

  // Not found
  if (studentId != null && !student) {
    return (
      <div className="py-7 text-center text-[13px] text-text-muted">
        Santri tidak ditemukan
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-text-muted">Memuat data...</div>
      </div>
    )
  }

  const avatarColor = getColor(student, colorIndex)

  // Surahs for selected juz
  const juzSurahs = selectedJuz ? getJuzSurahs(selectedJuz) : []
  const juzHafalCount = selectedJuz
    ? juzSurahs.filter((s) => hafalan[s.no] === 1).length
    : 0

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.push('/santri')}
        className="mb-4 text-[13px] text-primary hover:opacity-70 transition-opacity"
      >
        ← Kembali
      </button>

      {/* Student info card */}
      <div className="bg-card rounded-xl p-3.5 border border-border mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initials(student.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-text">
              {student.nama}
            </div>
            <div className="text-[11px] text-text-muted">
              {student.kelas || 'Tanpa kelas'}
              {student.usia ? ` · ${student.usia} th` : ''}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-surface p-2.5 text-center border border-border/50">
            <div className="text-base font-bold text-text">{hafalCount}</div>
            <div className="text-[10px] text-text-muted">Hafal</div>
          </div>
          <div className="rounded-lg bg-surface p-2.5 text-center border border-border/50">
            <div className="text-base font-bold text-text">{juzSelesai}</div>
            <div className="text-[10px] text-text-muted">Juz Selesai</div>
          </div>
          <div className="rounded-lg bg-surface p-2.5 text-center border border-border/50">
            <div className="text-base font-bold text-primary">{pct}%</div>
            <div className="text-[10px] text-text-muted">Progress</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/30">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: avatarColor }}
          />
        </div>
      </div>

      {/* Juz view or grid */}
      {selectedJuz ? (
        <div>
          {/* Back to juz grid */}
          <button
            onClick={() => setSelectedJuz(null)}
            className="mb-3 text-[13px] text-primary hover:opacity-70 transition-opacity"
          >
            ← Semua Juz
          </button>

          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-medium text-text">
              Juz {selectedJuz}
            </div>
            <div className="text-[12px] text-text-muted">
              {juzHafalCount}/{juzSurahs.length} surah
            </div>
          </div>

          {juzSurahs.map((s) => {
            const status = hafalan[s.no] || 0
            return (
              <button
                key={s.no}
                onClick={() => toggleSurah(s.no)}
                disabled={toggling}
                className="flex w-full items-center gap-3 py-2.5 border-b border-border/50 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {/* Status icon */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {status === 1 ? (
                    <span className="text-primary">✓</span>
                  ) : status === 2 ? (
                    <span className="text-accent">↻</span>
                  ) : (
                    <span className="text-text-muted">○</span>
                  )}
                </div>

                {/* Surah info */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text">{s.nama}</div>
                  <div className="text-[11px] text-text-muted">
                    {s.ayat} ayat
                  </div>
                </div>

                {/* Arabic */}
                <div className="shrink-0 text-base text-text-muted font-arabic">
                  {s.arab}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <>
          {/* Juz grid */}
          <div className="mb-4 text-sm font-medium text-text">Juz</div>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[...Array(30)].map((_, i) => {
              const j = i + 1
              const p = juzPcts[i]
              return (
                <button
                  key={j}
                  onClick={() => setSelectedJuz(j)}
                  className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-center transition-all hover:opacity-85 ${
                    p === 100
                      ? 'bg-primary text-white'
                      : p > 0
                        ? 'bg-amber-light text-amber'
                        : 'bg-border/20 text-text-muted'
                  }`}
                >
                  <div className="text-[13px] font-semibold">{j}</div>
                  {p > 0 && (
                    <div className="text-[10px] mt-0.5">{p}%</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Riwayat Setoran */}
          <div className="mb-3 text-sm font-medium text-text">
            Riwayat Setoran
          </div>

          {studentSubmissions.length === 0 && (
            <div className="py-7 text-center text-[13px] text-text-muted">
              Belum ada setoran
            </div>
          )}

          {studentSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-card rounded-xl p-3.5 border border-border mb-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text">
                    {getSurahNama(sub.surah_no)}
                    {sub.ayat_start && sub.ayat_end ? (
                      <span className="text-text-muted ml-1">
                        : {sub.ayat_start}{sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[13px] text-text-muted">
                    {formatWaktu(sub.waktu).tanggal} · {formatWaktu(sub.waktu).jam}
                  </div>
                  {sub.catatan && (
                    <div className="mt-1 text-[13px] text-text-secondary">
                      {sub.catatan}
                    </div>
                  )}
                </div>
                <span className="inline-block shrink-0 rounded-full bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5">
                  {sub.nilai}
                </span>
              </div>
            </div>
          ))}

          {/* Delete button */}
          <div className="mt-6">
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red/80 px-4 py-2 text-[13px] font-medium text-white hover:bg-red transition-colors"
            >
              Hapus Santri
            </button>
          </div>
        </>
      )}
    </>
  )
}
