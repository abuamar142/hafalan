'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ALL_SURAHS } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  Printer,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react'
import { initials, getColor, getSurahNama, formatWaktu } from '@/lib/helpers'

interface ReportDetailClientProps {
  student: {
    id: number
    nama: string
    color: string
    group: {
      id: number
      nama: string
      class: {
        id: number
        nama: string
      } | null
    } | null
  }
  submissions: {
    id: number
    student_id: number
    surah_no: number
    nilai: string
    catatan: string
    waktu: string
    ayat_start: number | null
    ayat_end: number | null
    guru_nama: string | null
  }[]
  memorizations: {
    surah_no: number
    status: number
  }[]
}

export default function ReportDetailClient({
  student,
  submissions,
  memorizations,
}: ReportDetailClientProps) {
  const router = useRouter()

  // Build memorization map
  const memorizationMap = useMemo(() => {
    const map: Record<number, number> = {}
    memorizations.forEach((m) => {
      map[m.surah_no] = m.status
    })
    return map
  }, [memorizations])

  // Total surahs memorized (status = 1)
  const totalHafal = useMemo(() => {
    return Object.values(memorizationMap).filter((status) => status === 1).length
  }, [memorizationMap])

  // Progress percentage
  const pct = useMemo(() => {
    return Math.round((totalHafal / ALL_SURAHS.length) * 100)
  }, [totalHafal])

  // Total verses setoran
  const totalVerses = useMemo(() => {
    return submissions.reduce((sum, s) => {
      if (s.ayat_start != null && s.ayat_end != null) {
        return sum + (s.ayat_end - s.ayat_start + 1)
      }
      return sum
    }, 0)
  }, [submissions])

  // Last active date
  const lastActive = useMemo(() => {
    if (submissions.length === 0) return null
    return submissions[0]?.waktu
  }, [submissions])

  // Juz Statuses
  const juzStatuses = useMemo(() => {
    return [...Array(30)].map((_, i) => {
      const juzNo = i + 1
      const juzSurahs = ALL_SURAHS.filter((s) => s.juz === juzNo)
      if (juzSurahs.length === 0) return { number: juzNo, status: 'empty', pct: 0 }

      const hafalCountInJuz = juzSurahs.filter((s) => memorizationMap[s.no] === 1).length
      const percentage = Math.round((hafalCountInJuz / juzSurahs.length) * 100)

      let status: 'empty' | 'partial' | 'full' = 'empty'
      if (percentage === 100) {
        status = 'full'
      } else if (hafalCountInJuz > 0) {
        status = 'partial'
      }

      return {
        number: juzNo,
        status,
        pct: percentage,
      }
    })
  }, [memorizationMap])

  // Radial Ring Circle Parameters
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  function handlePrint() {
    window.print()
  }

  return (
    <div className="relative min-h-screen bg-background text-text pb-16 print:bg-white print:text-black print:pb-0">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl pointer-events-none print:hidden" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/5 blur-3xl pointer-events-none print:hidden" />

      {/* Top Navbar (Print hidden) */}
      <header className="relative w-full max-w-5xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-border/20 mb-8 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="gap-2 cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pencarian
        </Button>

        <Button
          onClick={handlePrint}
          size="sm"
          className="gap-2 bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-md shadow-primary/10"
        >
          <Printer className="w-4 h-4" />
          Cetak Rapor
        </Button>
      </header>

      {/* Main Printable Area */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-8 print:p-0 print:max-w-full">
        
        {/* Printable Header (Visible only in print) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-black/85 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo.jpg"
              alt="Logo"
              width={50}
              height={50}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-black uppercase tracking-tight">SMA ISLAM BUNGA BANGSA</h1>
              <p className="text-xs text-black/70 font-semibold tracking-wide">LAPORAN RAPORT TAHFIDZ AL-QURAN</p>
            </div>
          </div>
          <div className="text-right text-xs text-black/60">
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Student Identity Card */}
        <Card className="border-border/40 shadow-md bg-surface print:shadow-none print:border-black/35 overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-primary/15 via-accent/5 to-transparent print:hidden"></div>
          <CardContent className="p-6 pt-6 sm:flex sm:items-center sm:justify-between print:p-4">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-center -mt-0">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: getColor(student, student.id) }}
              >
                {initials(student.nama)}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-extrabold text-text print:text-black tracking-tight mb-1">
                  {student.nama}
                </h1>
                <div className="text-sm font-semibold text-text-secondary flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="bg-background print:bg-white px-2.5 py-0.5 rounded-md border border-border print:border-black/35 font-bold">
                    Kelas {student.group?.class?.nama || 'Tanpa kelas'}
                  </span>
                  <span>•</span>
                  <span>Kelompok {student.group?.nama || 'Tanpa kelompok'}</span>
                </div>
              </div>
            </div>

            <div className="hidden print:block text-right">
              <div className="inline-flex flex-col gap-1 text-xs">
                <p className="font-semibold">Nama Lembaga: <span className="font-bold">SMA Islam Bunga Bangsa</span></p>
                <p className="font-semibold">Evaluator: <span className="font-bold">Ustadz Pembina Halaqah</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bento stats and Juz Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
          
          {/* Progress Overview Card */}
          <Card className="border-border/40 shadow-sm bg-surface flex flex-col justify-between p-6 print:border-black/35 print:p-4">
            <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
              <Award className="w-5 h-5 text-accent shrink-0" />
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Ringkasan Progres</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center my-2">
              {/* Radial Progress Ring */}
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    className="stroke-border/40 print:stroke-black/10 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    className="stroke-primary fill-none transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-text print:text-black leading-none">{pct}%</span>
                  <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wide">Dihafal</span>
                </div>
              </div>

              {/* Quick statistics */}
              <div className="space-y-3 flex-1 min-w-[120px] w-full text-sm">
                <div className="bg-card print:bg-white p-2.5 rounded-lg border border-border/50 print:border-black/35 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase leading-none">Total Surah</p>
                    <p className="font-bold text-text mt-0.5">{totalHafal} Surah</p>
                  </div>
                </div>

                <div className="bg-card print:bg-white p-2.5 rounded-lg border border-border/50 print:border-black/35 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase leading-none">Total Ayat</p>
                    <p className="font-bold text-text mt-0.5">{totalVerses} Ayat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Last active info */}
            <div className="mt-4 pt-3 border-t border-border/30 text-xs text-text-muted flex items-center justify-between">
              <span>Keaktifan Terakhir:</span>
              <span className="font-semibold text-text-secondary">
                {lastActive ? formatWaktu(lastActive).tanggal : 'Belum aktif'}
              </span>
            </div>
          </Card>

          {/* Juz Grid Card */}
          <Card className="lg:col-span-2 border-border/40 shadow-sm bg-surface p-6 print:border-black/35 print:p-4 print:col-span-1">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Pemetaan Juz</h3>
              </div>
              
              {/* Legend (Print hidden) */}
              <div className="flex items-center gap-3 text-[10px] font-semibold text-text-muted print:hidden">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-primary"></div>
                  <span>Lengkap</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-accent/25 border border-accent/20"></div>
                  <span>Progres</span>
                </div>
              </div>
            </div>

            {/* Grid 1 - 30 */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
              {juzStatuses.map((j) => {
                return (
                  <div
                    key={j.number}
                    className={`relative flex flex-col items-center justify-center rounded-md py-2.5 text-center transition-all ${
                      j.status === 'full'
                        ? 'bg-primary text-white font-bold shadow-sm'
                        : j.status === 'partial'
                          ? 'bg-accent/10 text-accent border border-accent/20 font-bold'
                          : 'bg-card border border-border text-text-muted'
                    }`}
                    title={`${j.pct}% Hafal`}
                  >
                    <span className="text-xs">Juz</span>
                    <span className="text-sm font-bold leading-none mt-0.5">{j.number}</span>
                    {j.status === 'partial' && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-accent"></span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Timeline of Submissions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Calendar className="w-5 h-5 text-text-secondary shrink-0" />
            <h3 className="text-base font-bold text-text">Riwayat Setoran Hafalan</h3>
          </div>

          {submissions.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border border-border/50 border-dashed rounded-lg bg-surface">
              Belum ada riwayat setoran hafalan.
            </div>
          ) : (
            <div className="relative border-l border-border/70 print:border-black/35 pl-5 ml-3 space-y-6">
              {submissions.map((sub) => {
                const surah = ALL_SURAHS.find((s) => s.no === sub.surah_no)
                return (
                  <div key={sub.id} className="relative group">
                    
                    {/* Circle Indicator on line */}
                    <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-surface border-2 border-primary group-hover:scale-110 transition-transform print:border-black" />

                    <div className="rounded-lg border border-border/40 bg-surface p-4 shadow-sm hover:shadow transition-shadow print:shadow-none print:border-black/30 print:p-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2.5">
                        
                        {/* Surah Name & Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2.5">
                            <h4 className="text-[15px] font-bold text-text print:text-black">
                              {getSurahNama(sub.surah_no)}
                            </h4>
                            {surah?.arab && (
                              <span className="text-sm font-semibold text-primary/70 font-arabic print:text-black/60">
                                ({surah.arab})
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-2">
                            <span>
                              Ayat {sub.ayat_start}{sub.ayat_end && sub.ayat_end !== sub.ayat_start ? ` \u2013 ${sub.ayat_end}` : ''}
                            </span>
                            <span>•</span>
                            <span>Juz {surah?.juz || '?'}</span>
                            <span>•</span>
                            <span className="font-semibold text-text-secondary">Ustadz {sub.guru_nama || 'Pembina'}</span>
                          </div>
                        </div>

                        {/* Badge for Score */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 text-xs font-bold leading-normal">
                            {sub.nilai}
                          </span>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">
                            {formatWaktu(sub.waktu).tanggal}
                          </span>
                        </div>
                      </div>

                      {/* Catatan Evaluasi */}
                      {sub.catatan && (
                        <div className="mt-2 text-xs text-text-secondary bg-card/60 p-2.5 rounded border border-border/40 leading-relaxed font-sans print:bg-white print:border-black/20">
                          <p className="font-semibold text-[10px] uppercase text-text-muted tracking-wide mb-1 leading-none">Catatan Pembina:</p>
                          {sub.catatan}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Signature Box (Visible only in print) */}
        <div className="hidden print:grid grid-cols-2 gap-10 mt-16 text-center text-xs">
          <div className="space-y-16">
            <p className="font-semibold">Mengetahui,<br/>Orang Tua / Wali Murid</p>
            <div className="border-t border-black/40 w-44 mx-auto pt-1 font-bold">....................................</div>
          </div>
          <div className="space-y-16">
            <p className="font-semibold">Samarinda, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pembina Halaqah</p>
            <div className="border-t border-black/40 w-44 mx-auto pt-1 font-bold">Ustadz {submissions[0]?.guru_nama || 'Pembina'}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
