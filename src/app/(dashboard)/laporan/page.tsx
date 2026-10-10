'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import { createClient } from '@/lib/supabase/client'
import type { SetoranItem } from '@/lib/types'
import {
  getStudentMemorization,
  getAllMemorizationMap,
} from '@/lib/data/memorization'
import { getStudentSubmissions } from '@/lib/data/submissions'
import { computeRanking } from '@/lib/domain/statistics'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { PageHeader } from '@/components/app/page-header'
import { SectionCard } from '@/components/app/section-card'
import { Alert } from '@/components/app/alert'
import {
  Printer,
  Users,
  User,
  BarChart3,
  Eye,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ReportType = 'kolektif' | 'individu' | 'perkembangan'

export default function LaporanPage() {
  const { state } = useDashboard()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [printHtml, setPrintHtml] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

  const studentOptions = useMemo(() => {
    return state.students.map((s) => ({
      id: s.id,
      label: s.nama + (s.kelas ? ` (${s.kelas})` : ''),
      searchText: s.nama + (s.kelas ? ` ${s.kelas}` : ''),
    }))
  }, [state.students])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserName((data.user?.user_metadata?.name as string) || '')
    })
  }, [])

  const sorted = useMemo(
    () => computeRanking(state.students),
    [state.students]
  )

  async function fetchAllMemorization(): Promise<
    Record<number, Record<number, number>>
  > {
    const memMap = await getAllMemorizationMap()
    const fullSantri: Record<number, Record<number, number>> = {}
    for (const [studentIdStr, memos] of Object.entries(memMap)) {
      const studentId = Number(studentIdStr)
      fullSantri[studentId] = {}
      for (const m of memos) {
        fullSantri[studentId][m.surah_no] = m.status
      }
    }
    return fullSantri
  }

  async function fetchStudentData(studentId: number) {
    const memos = await getStudentMemorization(studentId)
    const hafalan: Record<number, number> = {}
    memos.forEach((m) => {
      hafalan[m.surah_no] = m.status
    })
    const subs = await getStudentSubmissions(studentId)
    return { hafalan, submissions: subs || [] }
  }

  async function generateKolektif() {
    setIsGenerating(true)
    try {
      const fullSantri = await fetchAllMemorization()
      const { generateCollectiveReport } = await import('@/lib/domain/reports')
      const html = generateCollectiveReport({
        students: sorted,
        submissions: state.submissions,
        guruName: currentUserName,
        fullMemorization: fullSantri,
      })
      setActiveReport('kolektif')
      setPrintHtml(html)
    } finally {
      setIsGenerating(false)
    }
  }

  async function generateIndividu() {
    if (!selectedStudent) return
    setIsGenerating(true)
    try {
      const sId = Number(selectedStudent)
      const student = sorted.find((s) => s.id === sId)
      if (!student) return

      const { hafalan, submissions } = await fetchStudentData(sId)

      const mappedSubmissions: SetoranItem[] = submissions.map((s) => ({
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
        guru_nama: s.guru_name || '',
      }))

      const { generateIndividualReport } = await import('@/lib/domain/reports')
      const html = generateIndividualReport({
        student,
        hafalan,
        submissions: mappedSubmissions,
        guruName: currentUserName,
      })
      setActiveReport('individu')
      setPrintHtml(html)
    } finally {
      setIsGenerating(false)
    }
  }

  async function generatePerkembangan() {
    setIsGenerating(true)
    try {
      const fullSantri = await fetchAllMemorization()
      const { generateDevelopmentReport } = await import('@/lib/domain/reports')
      const html = generateDevelopmentReport({
        students: sorted,
        fullMemorization: fullSantri,
      })
      setActiveReport('perkembangan')
      setPrintHtml(html)
    } finally {
      setIsGenerating(false)
    }
  }

  function handlePrint() {
    if (!printHtml) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Cetak Laporan</title>
<style>
  @page { size: landscape; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #2C2C2A; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { border-collapse: separate; border-spacing: 0; width: 100%; }
  th, td { border: 1px solid #d1d5db; padding: 6px 10px; font-size: 12px; }
  img { max-width: 100%; }
</style></head><body>${printHtml}</body></html>`)
    win.document.close()
    win.onload = () => {
      win.print()
      win.close()
    }
  }

  function handleCardClick(type: ReportType) {
    if (isGenerating) return
    if (type === 'individu') {
      generateIndividu()
    } else if (type === 'kolektif') {
      generateKolektif()
    } else {
      generatePerkembangan()
    }
  }

  const reports: {
    type: ReportType
    title: string
    subtitle: string
    description: string
    icon: React.ReactNode
    tone: 'primary' | 'accent' | 'purple'
  }[] = [
    {
      type: 'kolektif',
      title: 'Kolektif',
      subtitle: 'Ranking & rekap seluruh santri',
      description:
        'Daftar seluruh santri yang diurutkan berdasarkan pencapaian hafalan terbanyak. Berguna untuk evaluasi bulanan atau semester.',
      icon: <Users />,
      tone: 'primary',
    },
    {
      type: 'individu',
      title: 'Individu',
      subtitle: 'Rapor progres per santri',
      description:
        'Detail pencapaian juz, progres hafalan, dan riwayat setoran lengkap untuk satu santri.',
      icon: <User />,
      tone: 'accent',
    },
    {
      type: 'perkembangan',
      title: 'Perkembangan Tahfidz',
      subtitle: 'Rekap level juz per kelas',
      description:
        'Rekapitulasi pencapaian level juz untuk setiap kelas, untuk melihat distribusi hafalan santri.',
      icon: <BarChart3 />,
      tone: 'purple',
    },
  ]

  const toneStyles = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    purple: 'bg-purple/10 text-purple',
  } as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Pilih jenis laporan, pratinjau, lalu cetak."
        icon={<FileText />}
      />

      {state.students.length === 0 ? (
        <Alert variant="info" title="Belum ada data">
          Tambahkan santri terlebih dahulu untuk dapat membuat laporan.
        </Alert>
      ) : null}

      {/* Kartu jenis laporan */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {reports.map((r) => {
          const isActive = activeReport === r.type
          const isLoadingThis = isGenerating && isActive
          return (
            <button
              key={r.type}
              type="button"
              onClick={() => handleCardClick(r.type)}
              disabled={isGenerating}
              className={cn(
                'flex flex-col rounded-2xl border bg-card p-5 text-left shadow-soft transition-all duration-200',
                'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-lg',
                'disabled:cursor-not-allowed disabled:opacity-70',
                isActive
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border/70'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
                    toneStyles[r.tone]
                  )}
                >
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {r.subtitle}
                  </p>
                </div>
                {isActive ? (
                  <CheckCircle2 className="ml-auto size-5 shrink-0 text-primary" />
                ) : null}
              </div>

              <p className="mt-3.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {r.description}
              </p>

              {/* Pemilih santri untuk laporan individu */}
              {r.type === 'individu' ? (
                <div
                  className="mt-4"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <Combobox
                    options={studentOptions}
                    value={selectedStudent}
                    onChange={setSelectedStudent}
                    placeholder="Pilih santri..."
                    searchPlaceholder="Ketik nama santri..."
                  />
                </div>
              ) : null}

              <div className="mt-4">
                <span
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <Eye className="size-4" />
                  {isLoadingThis
                    ? 'Menyiapkan...'
                    : r.type === 'individu' && !selectedStudent
                      ? 'Pilih santri dulu'
                      : 'Pratinjau'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tombol cetak */}
      {printHtml ? (
        <div className="flex justify-end">
          <Button onClick={handlePrint} size="lg" className="gap-2">
            <Printer className="size-4" />
            Cetak Laporan
          </Button>
        </div>
      ) : null}

      {/* Area pratinjau */}
      {printHtml ? (
        <SectionCard
          title="Pratinjau Laporan"
          description="Inilah yang akan tercetak."
          icon={<FileText />}
          contentClassName="p-0 overflow-x-auto bg-white"
        >
          <div
            id="print-area"
            className="min-w-full p-4 text-black"
            dangerouslySetInnerHTML={{ __html: printHtml }}
          />
        </SectionCard>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Eye className="size-6" />
          </span>
          <h3 className="text-sm font-bold text-foreground">
            Belum ada pratinjau
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Pilih salah satu jenis laporan di atas untuk menampilkan pratinjau
            sebelum dicetak.
          </p>
        </div>
      )}
    </div>
  )
}
