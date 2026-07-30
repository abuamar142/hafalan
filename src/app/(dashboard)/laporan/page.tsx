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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button, Combobox } from '@cloudflare/kumo'
import { FileText, Printer, Users, User } from '@phosphor-icons/react'

export default function LaporanPage() {
  const { state } = useDashboard()
  const [selectedStudent, setSelectedStudent] = useState<Record<string, unknown> | null>(null)
  const [printHtml, setPrintHtml] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

  const studentItems = useMemo(() => {
    return state.students.map((s) => ({
      id: s.id,
      nama: s.nama,
      kelas: s.kelas ?? '',
      group_name: s.group_name ?? '',
      _label: s.nama + (s.kelas ? ` (${s.kelas})` : ''),
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

  // ── Collective Report ──
  async function cetakKolektif() {
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
      const studentId = (selectedStudent as Record<string, number>).id ?? 0
      const student = sorted.find((s) => s.id === studentId)
      if (!student) return

      const { hafalan, submissions } = await fetchStudentData(studentId)

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
                <Users size={20} />
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
              <Printer size={16} />
              {isGenerating ? 'Menyiapkan...' : 'Cetak Rekap Kelas'}
            </Button>
          </CardContent>
        </Card>

        {/* Individual */}
        <Card className="border-border/40 shadow-sm flex flex-col">
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                <User size={20} />
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
                <Combobox
                  items={studentItems}
                  value={selectedStudent}
                  onValueChange={(item) => setSelectedStudent(item as Record<string, unknown> | null)}
                  itemToStringLabel={(item) => (item as Record<string, string>)._label ?? ''}
                >
                  <Combobox.TriggerInput placeholder="Cari dan pilih santri..." />
                  <Combobox.Content>
                    <Combobox.List>
                      {(item) => <Combobox.Item value={item}>{(item as Record<string, string>)._label}</Combobox.Item>}
                    </Combobox.List>
                    <Combobox.Empty>Tidak ditemukan</Combobox.Empty>
                  </Combobox.Content>
                </Combobox>
              </div>
            </div>
            <Button
              onClick={cetakIndividu}
              disabled={!selectedStudent || isGenerating}
              variant={selectedStudent ? 'primary' : 'secondary'}
              className="w-full gap-2 shadow-sm"
            >
              <FileText size={16} />
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
