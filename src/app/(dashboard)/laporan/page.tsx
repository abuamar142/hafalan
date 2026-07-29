'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../layout'
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

export default function LaporanPage() {
  const { state } = useDashboard()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [printHtml, setPrintHtml] = useState<string | null>(null)

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
    const fullSantri = await fetchAllMemorization()

    const html = generateCollectiveReport({
      students: sorted,
      submissions: state.submissions,
      guruName: state.guru,
      fullMemorization: fullSantri,
    })

    setPrintHtml(html)
    setTimeout(() => window.print(), 400)
  }

  // ── Individual Report ──
  async function cetakIndividu() {
    if (!selectedStudent) return

    const sId = Number(selectedStudent)
    const student = sorted.find((s) => s.id === sId)
    if (!student) return

    const { hafalan, submissions } = await fetchStudentData(sId)

    const mappedSubmissions = submissions.map((s) => ({
      id: s.id,
      santri_id: s.student_id,
      santri_nama: s.students?.nama || '',
      surah_no: s.surah_no,
      nilai: s.nilai,
      catatan: s.catatan,
      waktu: s.waktu,
      ayat_start: s.ayat_start ?? null,
      ayat_end: s.ayat_end ?? null,
    }))

    const html = generateIndividualReport({
      student,
      hafalan,
      submissions: mappedSubmissions,
      guruName: state.guru,
    })

    setPrintHtml(html)
    setTimeout(() => window.print(), 400)
  }

  return (
    <>
      {/* Title */}
      <div className="mb-4 text-sm font-medium text-text">Laporan</div>

      {/* Report options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Collective */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-sm font-medium text-text mb-1">
            Laporan Kolektif
          </div>
          <div className="text-[12px] text-text-muted mb-3">
            Ranking seluruh santri dengan statistik ringkasan
          </div>
          <button
            onClick={cetakKolektif}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity"
          >
            Cetak
          </button>
        </div>

        {/* Individual */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-sm font-medium text-text mb-1">
            Laporan Individu
          </div>
          <div className="text-[12px] text-text-muted mb-3">
            Detail progres dan riwayat per santri
          </div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary mb-2"
          >
            <option value="">Pilih Santri</option>
            {state.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kelas || '-'})
              </option>
            ))}
          </select>
          <button
            onClick={cetakIndividu}
            disabled={!selectedStudent}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            Cetak
          </button>
        </div>
      </div>

      {/* Print area */}
      {printHtml && (
        <div id="print-area" dangerouslySetInnerHTML={{ __html: printHtml }} />
      )}
    </>
  )
}
