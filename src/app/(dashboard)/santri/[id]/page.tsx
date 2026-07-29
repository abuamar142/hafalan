'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useDashboard, QK } from '../../layout'
import type { Memorization } from '@/lib/types'
import { toggleMemorizationAction } from '@/lib/actions/memorization'
import { deleteStudentAction } from '@/lib/actions/students'
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
import { toggleSurahCycle } from '@/lib/domain/hafalan'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Trash2, CheckCircle2, RotateCcw, Circle } from 'lucide-react'

export default function ProfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { state, refreshStudents, refreshMemorization, getStudent, getStudentMemorization } =
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
    const current = hafalan[surahNo] || 0
    const next = toggleSurahCycle(current)

    // Optimistic update
    const prev = queryClient.getQueryData(QK.memorization)
    queryClient.setQueryData<Memorization[]>(QK.memorization, (old) => {
      if (!old) return old
      const idx = old.findIndex((m) => m.student_id === studentId && m.surah_no === surahNo)
      if (idx >= 0) {
        const updated = [...old]
        updated[idx] = { ...updated[idx], status: next }
        return updated
      }
      return [...old, { student_id: studentId, surah_no: surahNo, status: next } as Memorization]
    })

    try {
      await toggleMemorizationAction(studentId, surahNo, next)
      await refreshMemorization()
    } catch {
      // Rollback on error
      queryClient.setQueryData(QK.memorization, prev)
    }
  }

  async function handleDelete() {
    if (!student || studentId == null) return
    if (!confirm(`Hapus santri "${student.nama}"? Semua data terkait akan dihapus.`)) return
    try {
      await deleteStudentAction(studentId)
      await refreshStudents()
      router.push('/santri')
    } catch {
      // silently ignore
    }
  }

  // Not found
  if (studentId != null && !student) {
    return (
      <div className="py-16 text-center text-sm text-text-muted border border-border/50 rounded-lg bg-surface border-dashed">
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
    <div className="max-w-4xl pb-10">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/santri')}
        className="mb-6 -ml-3 text-text-secondary hover:text-text"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      {/* Student info card */}
      <Card className="mb-8 border-border/40 shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary/10 to-accent/5"></div>
        <CardContent className="p-6 pt-0 sm:flex sm:items-end sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-5 -mt-8 sm:-mt-10 mb-6 sm:mb-0 items-center sm:items-end">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl text-3xl font-semibold text-white shadow-md ring-4 ring-surface"
              style={{ backgroundColor: avatarColor }}
            >
              {initials(student.nama)}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-text mb-1">
                {student.nama}
              </h1>
              <div className="text-sm font-medium text-text-secondary flex items-center justify-center sm:justify-start gap-2">
                <span className="bg-background px-2.5 py-0.5 rounded-md border border-border">{student.kelas || 'Tanpa kelas'}</span>
                {student.group_name && <span>• {student.group_name}</span>}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="rounded-md bg-background p-3 text-center border border-border/50 shadow-sm">
              <div className="text-xl font-bold text-text">{hafalCount}</div>
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Surah</div>
            </div>
            <div className="rounded-md bg-background p-3 text-center border border-border/50 shadow-sm">
              <div className="text-xl font-bold text-text">{juzSelesai}</div>
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Juz Selesai</div>
            </div>
            <div className="rounded-md bg-background p-3 text-center border border-border/50 shadow-sm">
              <div className="text-xl font-bold text-primary">{pct}%</div>
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-0.5">Progress</div>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6 pt-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: avatarColor }}
            />
          </div>
        </div>
      </Card>

      {/* Juz view or grid */}
      {selectedJuz ? (
        <Card className="border-border/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedJuz(null)} className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-bold text-text">Juz {selectedJuz}</h3>
                  <p className="text-xs font-medium text-text-muted">
                    {juzHafalCount} dari {juzSurahs.length} surah dihafal
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {juzSurahs.map((s) => {
                const status = hafalan[s.no] || 0
                return (
                  <button
                    key={s.no}
                    onClick={() => toggleSurah(s.no)}
                    disabled={toggling}
                    className="group flex w-full items-center gap-4 rounded-md p-3 text-left transition-all hover:bg-card border border-transparent hover:border-border/50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {/* Status Toggle */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      status === 1 ? 'bg-primary/10 text-primary border border-primary/20' : 
                      status === 2 ? 'bg-accent/10 text-accent border border-accent/20' : 
                      'bg-background text-text-muted border border-border group-hover:border-border-hover'
                    }`}>
                      {status === 1 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : status === 2 ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5 opacity-40" />
                      )}
                    </div>

                    {/* Surah info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-text">{s.no}. {s.nama}</div>
                      <div className="text-[12px] font-medium text-text-muted mt-0.5">
                        {s.ayat} ayat
                      </div>
                    </div>

                    {/* Arabic */}
                    <div className="shrink-0 text-xl text-text-muted font-arabic pr-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {s.arab}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text">Pencapaian Juz</h3>
              <span className="text-xs font-medium text-text-muted bg-card px-2.5 py-1 rounded-md border border-border">Pilih juz untuk detail</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {[...Array(30)].map((_, i) => {
                const j = i + 1
                const p = juzPcts[i]
                return (
                  <button
                    key={j}
                    onClick={() => setSelectedJuz(j)}
                    className={`group relative flex flex-col items-center justify-center rounded-[var(--radius)] p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      p === 100
                        ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5'
                        : p > 0
                          ? 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 hover:-translate-y-0.5'
                          : 'bg-surface border border-border text-text-muted hover:border-text-muted/30 hover:text-text-secondary hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="text-[15px] font-bold">{j}</div>
                    {p > 0 && p < 100 && (
                      <div className="text-[10px] font-semibold mt-1 bg-accent/20 px-1.5 py-0.5 rounded text-accent-dark">{p}%</div>
                    )}
                    {p === 100 && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-3 h-3 text-white/70" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-text mb-4">Riwayat Setoran</h3>
            
            {studentSubmissions.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-muted border border-border/50 rounded-lg bg-surface border-dashed">
                Belum ada setoran
              </div>
            ) : (
              <div className="space-y-3">
                {studentSubmissions.map((sub) => (
                  <Card key={sub.id} className="border-border/40 shadow-sm overflow-hidden group">
                    <div className="flex">
                      <div className="w-1.5 bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="font-semibold text-[14px] text-text">
                            {getSurahNama(sub.surah_no)}
                            {sub.ayat_start && sub.ayat_end ? (
                              <span className="text-text-muted font-normal ml-1">
                                ayat {sub.ayat_start}{sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}
                              </span>
                            ) : null}
                          </div>
                          <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-bold border border-primary/20">
                            {sub.nilai}
                          </span>
                        </div>
                        <div className="text-[12px] font-medium text-text-muted mb-2">
                          {formatWaktu(sub.waktu).tanggal} · {formatWaktu(sub.waktu).jam}
                        </div>
                        {sub.catatan && (
                          <div className="text-[13px] text-text-secondary bg-background rounded-md p-2.5 border border-border/50">
                            {sub.catatan}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-10 border-t border-border pt-6">
              <Button
                variant="destructive"
                className="w-full gap-2 opacity-90 hover:opacity-100"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Hapus Data Santri
              </Button>
              <p className="text-[11px] text-text-muted text-center mt-2">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
