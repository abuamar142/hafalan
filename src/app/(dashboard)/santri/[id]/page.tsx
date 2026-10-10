'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useDashboard, QK } from '../../layout'
import type { Memorization } from '@/lib/types'
import { toggleMemorizationAction } from '@/lib/actions/memorization'
import { deleteStudentAction } from '@/lib/actions/students'
import { deleteSubmissionAction } from '@/lib/actions/submissions'
import {
  getSurahNama,
  getJuzSurahs,
  getJuzSurahsFromHafalan,
  getJuzSelesaiFromHafalan,
  getPct,
  getColor,
  initials,
  formatWaktu,
} from '@/lib/helpers'
import { toggleSurahCycle } from '@/lib/domain/hafalan'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast-wrapper'
import { SectionCard } from '@/components/app/section-card'
import { ProgressBar } from '@/components/app/progress-bar'
import { EmptyState } from '@/components/app/empty-state'
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Circle,
  BookOpen,
  User,
  Layers,
  GraduationCap,
  History,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'

export default function ProfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    state,
    refreshStudents,
    refreshMemorization,
    getStudent,
    getStudentMemorization,
  } = useDashboard()
  const { toast } = useToast()

  const [studentId, setStudentId] = useState<number | null>(null)
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteSubmissionTarget, setDeleteSubmissionTarget] = useState<{
    id: number
    surahName: string
  } | null>(null)

  useEffect(() => {
    params.then((p) => setStudentId(Number(p.id)))
  }, [params])

  const student = studentId != null ? getStudent(studentId) : undefined
  const memorization =
    studentId != null ? getStudentMemorization(studentId) : []

  const hafalan = useMemo(() => {
    const map: Record<number, number> = {}
    memorization.forEach((m) => {
      map[m.surah_no] = m.status
    })
    return map
  }, [memorization])

  const studentSubmissions = useMemo(() => {
    if (studentId == null) return []
    return state.submissions
      .filter((s) => s.santri_id === studentId)
      .sort((a, b) => b.id - a.id)
  }, [state.submissions, studentId])

  const juzPcts = useMemo(() => {
    return [...Array(30)].map((_, i) =>
      getJuzSurahsFromHafalan(hafalan, i + 1)
    )
  }, [hafalan])

  const juzSelesai = useMemo(
    () => getJuzSelesaiFromHafalan(hafalan),
    [hafalan]
  )

  const hafalCount = useMemo(
    () => Object.values(hafalan).filter((v) => v === 1).length,
    [hafalan]
  )

  const pct = student ? getPct(student) : 0

  const colorIndex = useMemo(() => {
    if (!student) return 0
    return state.students.findIndex((s) => s.id === student.id)
  }, [student, state.students])

  async function toggleSurah(surahNo: number) {
    if (studentId == null) return
    const current = hafalan[surahNo] || 0
    const next = toggleSurahCycle(current)

    const prev = queryClient.getQueryData(QK.memorization)
    queryClient.setQueryData<Memorization[]>(QK.memorization, (old) => {
      if (!old) return old
      const idx = old.findIndex(
        (m) => m.student_id === studentId && m.surah_no === surahNo
      )
      const existing = old[idx]
      if (idx >= 0 && existing) {
        const updated = [...old]
        updated[idx] = { ...existing, status: next }
        return updated
      }
      return [
        ...old,
        {
          student_id: studentId,
          surah_no: surahNo,
          status: next,
        } as Memorization,
      ]
    })

    try {
      await toggleMemorizationAction(studentId, surahNo, next)
      await refreshMemorization()
      toast('Status hafalan berhasil diperbarui!')
    } catch (e: unknown) {
      queryClient.setQueryData(QK.memorization, prev)
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal memperbarui status hafalan: ' + msg, 'error')
    }
  }

  async function handleDeleteConfirmed() {
    if (!student || studentId == null) return
    try {
      await deleteStudentAction(studentId)
      await refreshStudents()
      toast('Santri berhasil dihapus!')
      router.push('/santri')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus data santri: ' + msg, 'error')
    }
  }

  async function handleDeleteSubmissionConfirmed() {
    if (!deleteSubmissionTarget) return
    try {
      await deleteSubmissionAction(deleteSubmissionTarget.id)
      setDeleteSubmissionTarget(null)
      await refreshStudents()
      toast('Setoran berhasil dihapus!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus setoran: ' + msg, 'error')
    }
  }

  if (studentId != null && !student) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/santri')}
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <EmptyState
          icon={<User />}
          title="Santri tidak ditemukan"
          description="Data santri yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Button onClick={() => router.push('/santri')}>
              Kembali ke Daftar Siswa
            </Button>
          }
        />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm font-medium text-muted-foreground">
          Memuat data...
        </p>
      </div>
    )
  }

  const avatarColor = getColor(student, colorIndex)
  const juzSurahs = selectedJuz ? getJuzSurahs(selectedJuz) : []
  const juzHafalCount = selectedJuz
    ? juzSurahs.filter((s) => hafalan[s.no] === 1).length
    : 0

  return (
    <>
      <div className="space-y-6 pb-10">
        {/* Tombol kembali */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/santri')}
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Siswa
        </Button>

        {/* Kartu identitas + statistik */}
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="h-20 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent" />
          <div className="px-5 pb-5 sm:px-6">
            <div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <span
                className="flex size-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-soft-lg ring-4 ring-card"
                style={{ backgroundColor: avatarColor }}
              >
                {initials(student.nama)}
              </span>
              <div className="pb-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {student.nama}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/10 text-primary"
                  >
                    <GraduationCap className="size-3" />
                    {student.kelas || 'Tanpa kelas'}
                  </Badge>
                  {student.group_name ? (
                    <Badge variant="secondary">
                      <Layers className="size-3" />
                      {student.group_name}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Statistik */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Surah', value: hafalCount, tone: 'text-foreground' },
                {
                  label: 'Juz Selesai',
                  value: juzSelesai,
                  tone: 'text-foreground',
                },
                { label: 'Progress', value: `${pct}%`, tone: 'text-primary' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-border/70 bg-muted/30 px-3 py-3 text-center"
                >
                  <div className={cn('tabular text-xl font-bold', m.tone)}>
                    {m.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <ProgressBar value={pct} size="md" />
            </div>
          </div>
        </section>

        {/* Detail juz atau grid */}
        {selectedJuz ? (
          <SectionCard
            title={`Juz ${selectedJuz}`}
            description={`${juzHafalCount} dari ${juzSurahs.length} surah dihafal`}
            icon={<BookOpen />}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJuz(null)}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Kembali
              </Button>
            }
            flush
          >
            <div className="divide-y divide-border/50">
              {juzSurahs.map((s) => {
                const status = hafalan[s.no] || 0
                return (
                  <button
                    key={s.no}
                    onClick={() => toggleSurah(s.no)}
                    className="group flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                        status === 1
                          ? 'border-primary/25 bg-primary/10 text-primary'
                          : status === 2
                            ? 'border-accent/25 bg-accent/10 text-accent'
                            : 'border-border bg-background text-muted-foreground group-hover:border-primary/30'
                      )}
                    >
                      {status === 1 ? (
                        <CheckCircle2 className="size-4" />
                      ) : status === 2 ? (
                        <RotateCcw className="size-4" />
                      ) : (
                        <Circle className="size-4 opacity-40" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {s.no}. {s.nama}
                      </span>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {s.ayat} ayat
                      </span>
                    </span>

                    <span className="shrink-0 pr-1 font-arabic text-lg text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100">
                      {s.arab}
                    </span>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Peta juz */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Pencapaian Juz"
                description="Pilih juz untuk melihat dan mengubah status surah."
                icon={<BookOpen />}
                action={
                  <div className="hidden items-center gap-3 text-[10px] font-bold text-muted-foreground sm:flex">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-primary" />
                      Lengkap
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm border border-accent/40 bg-accent/20" />
                      Progres
                    </span>
                  </div>
                }
              >
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {[...Array(30)].map((_, i) => {
                    const j = i + 1
                    const p = juzPcts[i] ?? 0
                    return (
                      <button
                        key={j}
                        onClick={() => setSelectedJuz(j)}
                        className={cn(
                          'group relative flex flex-col items-center justify-center rounded-xl border py-3 text-center transition-all hover:-translate-y-0.5',
                          p === 100
                            ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                            : p > 0
                              ? 'border-accent/30 bg-accent/10 text-accent'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                        )}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                          Juz
                        </span>
                        <span className="tabular mt-0.5 text-base font-bold leading-none">
                          {j}
                        </span>
                        {p > 0 && p < 100 ? (
                          <span className="tabular mt-1 rounded bg-accent/20 px-1 text-[9px] font-bold text-accent">
                            {p}%
                          </span>
                        ) : null}
                        {p === 100 ? (
                          <CheckCircle2 className="absolute right-1 top-1 size-3 text-primary-foreground/70" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Riwayat setoran */}
            <div>
              <SectionCard
                title="Riwayat Setoran"
                icon={<History />}
                action={
                  <span className="text-xs font-medium text-muted-foreground">
                    {studentSubmissions.length}
                  </span>
                }
                flush
              >
                {studentSubmissions.length === 0 ? (
                  <EmptyState
                    icon={<History />}
                    title="Belum ada setoran"
                    description="Setoran hafalan santri akan tampil di sini."
                    className="border-0 bg-transparent"
                  />
                ) : (
                  <div className="max-h-[520px] divide-y divide-border/50 overflow-y-auto">
                    {studentSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="group flex gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                      >
                        <span className="w-1 shrink-0 rounded-full bg-primary/25" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-sm font-bold text-foreground">
                              {getSurahNama(sub.surah_no)}
                              {sub.ayat_start && sub.ayat_end ? (
                                <span className="ml-1 font-normal text-muted-foreground">
                                  :{sub.ayat_start}
                                  {sub.ayat_end !== sub.ayat_start
                                    ? `–${sub.ayat_end}`
                                    : ''}
                                </span>
                              ) : null}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() =>
                                  setDeleteSubmissionTarget({
                                    id: sub.id,
                                    surahName: getSurahNama(sub.surah_no),
                                  })
                                }
                                title="Hapus Setoran"
                                aria-label="Hapus setoran"
                                className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                              <Badge
                                variant="outline"
                                className="border-primary/20 bg-primary/10 text-primary"
                              >
                                {sub.nilai}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                            {formatWaktu(sub.waktu).tanggal} ·{' '}
                            {formatWaktu(sub.waktu).jam}
                          </div>
                          {sub.catatan ? (
                            <p className="mt-1.5 rounded-lg border border-border/50 bg-muted/40 p-2 text-xs leading-relaxed text-muted-foreground">
                              {sub.catatan}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Zona hapus */}
              <div className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-destructive">
                  Zona Berbahaya
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menghapus santri akan menghapus seluruh riwayat hafalan dan
                  setorannya secara permanen.
                </p>
                <Button
                  variant="destructive"
                  className="mt-3 w-full gap-2"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Hapus Data Santri
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Santri?"
        description={`Hapus santri "${student?.nama}"? Semua data terkait akan dihapus.`}
        confirmText="Hapus"
        onConfirm={handleDeleteConfirmed}
      />
      <ConfirmDialog
        open={deleteSubmissionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSubmissionTarget(null)
        }}
        title="Hapus Setoran?"
        description={`Hapus setoran ${
          deleteSubmissionTarget?.surahName || ''
        }? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus"
        onConfirm={handleDeleteSubmissionConfirmed}
      />
    </>
  )
}
