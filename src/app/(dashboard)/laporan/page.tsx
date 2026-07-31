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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Printer, Users, User, BarChart3, Eye } from 'lucide-react'
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

  // ── Collect full memorization data for all students ──
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

  // ── Collect individual student data ──
  async function fetchStudentData(studentId: number) {
    const memos = await getStudentMemorization(studentId)

    const hafalan: Record<number, number> = {}
    memos.forEach((m) => {
      hafalan[m.surah_no] = m.status
    })

    const subs = await getStudentSubmissions(studentId)

    return { hafalan, submissions: subs || [] }
  }

  // ── Generate preview (no print) ──
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
    window.print()
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

  const cardBase = "border-border/40 shadow-sm flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
  const cardSelected = "ring-2 ring-primary border-primary"

  return (
    <div className="max-w-5xl">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Laporan</h2>
        <p className="text-sm text-muted-foreground mt-1">Pilih jenis laporan, pratinjau, lalu cetak.</p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Collective */}
        <Card
          className={cn(cardBase, activeReport === 'kolektif' && cardSelected)}
          onClick={() => handleCardClick('kolektif')}
        >
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Kolektif</CardTitle>
                <CardDescription className="text-[13px] mt-0.5">Ranking & rekap seluruh santri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="text-sm text-muted-foreground leading-relaxed">
              Laporan ini mencakup daftar seluruh santri yang diurutkan berdasarkan pencapaian hafalan terbanyak. Berguna untuk evaluasi kelas bulanan atau semester.
            </div>
          </CardContent>
        </Card>

        {/* Individual */}
        <Card
          className={cn(cardBase, activeReport === 'individu' && cardSelected)}
        >
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Individu</CardTitle>
                <CardDescription className="text-[13px] mt-0.5">Rapor progres per santri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-4">
            <div className="text-sm text-muted-foreground leading-relaxed">
              Laporan ini berisi detail pencapaian juz, progres hafalan, dan riwayat setoran lengkap untuk satu santri secara spesifik.
            </div>
            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <label className="block text-[13px] font-medium text-muted-foreground">Pilih Santri</label>
              <Combobox
                options={studentOptions}
                value={selectedStudent}
                onChange={setSelectedStudent}
                placeholder="Cari dan pilih santri..."
                searchPlaceholder="Ketik nama santri..."
              />
            </div>
            <Button
              onClick={(e) => { e.stopPropagation(); handleCardClick('individu') }}
              disabled={!selectedStudent || isGenerating}
              variant={selectedStudent ? 'default' : 'secondary'}
              className="w-full gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              {isGenerating && activeReport === 'individu' ? 'Menyiapkan...' : 'Pratinjau'}
            </Button>
          </CardContent>
        </Card>

        {/* Perkembangan Tahfidz */}
        <Card
          className={cn(cardBase, activeReport === 'perkembangan' && cardSelected)}
          onClick={() => handleCardClick('perkembangan')}
        >
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Perkembangan Tahfidz</CardTitle>
                <CardDescription className="text-[13px] mt-0.5">Rekap level juz per kelas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="text-sm text-muted-foreground leading-relaxed">
              Laporan ini menampilkan rekapitulasi pencapaian level juz untuk setiap kelas. Berguna untuk melihat distribusi hafalan santri secara keseluruhan.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print button — only visible when preview loaded */}
      {printHtml && (
        <div className="flex justify-end mb-6">
          <Button onClick={handlePrint} className="gap-2 shadow-sm">
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </Button>
        </div>
      )}

      {/* Preview area */}
      {printHtml && (
        <div id="print-area" dangerouslySetInnerHTML={{ __html: printHtml }} />
      )}
    </div>
  )
}
