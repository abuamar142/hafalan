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
import {
  generateCollectiveReport,
  generateIndividualReport,
} from '@/lib/domain/reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Printer, Users, User } from 'lucide-react'

export default function LaporanPage() {
  const { state } = useDashboard()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [printHtml, setPrintHtml] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

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

  // ── Collective Report ──
  async function cetakKolektif() {
    setIsGenerating(true)
    try {
      const fullSantri = await fetchAllMemorization()

      const html = generateCollectiveReport({
        students: sorted,
        submissions: state.submissions,
        guruName: currentUserName,
        fullMemorization: fullSantri,
      })

      setPrintHtml(html)
      setTimeout(() => window.print(), 400)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Individual Report ──
  async function cetakIndividu() {
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

      const html = generateIndividualReport({
        student,
        hafalan,
        submissions: mappedSubmissions,
        guruName: currentUserName,
      })

      setPrintHtml(html)
      setTimeout(() => window.print(), 400)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-text">Laporan</h2>
        <p className="text-sm text-text-muted mt-1">Cetak rekapitulasi hafalan santri.</p>
      </div>

      {/* Report options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Collective */}
        <Card className="border-border/40 shadow-sm flex flex-col">
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
          <CardContent className="pt-6 flex-1 flex flex-col justify-between gap-6">
            <div className="text-sm text-text-secondary leading-relaxed bg-surface border border-border/50 rounded-lg p-4">
              Laporan ini mencakup daftar seluruh santri yang diurutkan berdasarkan pencapaian hafalan terbanyak. Berguna untuk evaluasi kelas bulanan atau semester.
            </div>
            <Button 
              onClick={cetakKolektif}
              disabled={isGenerating}
              className="w-full gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              {isGenerating ? 'Menyiapkan...' : 'Cetak Rekap Kelas'}
            </Button>
          </CardContent>
        </Card>

        {/* Individual */}
        <Card className="border-border/40 shadow-sm flex flex-col">
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
          <CardContent className="pt-6 flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="text-sm text-text-secondary leading-relaxed bg-surface border border-border/50 rounded-lg p-4">
                Laporan ini berisi detail pencapaian juz, progres hafalan, dan riwayat setoran lengkap untuk satu santri secara spesifik.
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-text-secondary">Pilih Santri</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                >
                  <option value="">-- Pilih Santri --</option>
                  {state.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} {s.kelas ? `(${s.kelas})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={cetakIndividu}
              disabled={!selectedStudent || isGenerating}
              variant={selectedStudent ? 'default' : 'secondary'}
              className="w-full gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              {isGenerating ? 'Menyiapkan...' : 'Cetak Rapor Santri'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Print area */}
      {printHtml && (
        <div id="print-area" dangerouslySetInnerHTML={{ __html: printHtml }} />
      )}
    </div>
  )
}
