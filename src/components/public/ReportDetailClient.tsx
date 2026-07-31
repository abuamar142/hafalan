'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ALL_SURAHS } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Printer,
  Calendar,
  Award,
  FileText,
  Star,
  Check,
  CheckSquare,
  User,
  GraduationCap,
  BookOpen
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
    updated_at?: string | null
    updated_by_name?: string | null
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

  // Selesai Juz (all surahs in that Juz are status = 1)
  const juzSelesai = useMemo(() => {
    return [...Array(30)].filter((_, i) => {
      const juzNo = i + 1
      const juzSurahs = ALL_SURAHS.filter((s) => s.juz === juzNo)
      if (juzSurahs.length === 0) return false
      return juzSurahs.every((s) => memorizationMap[s.no] === 1)
    }).length
  }, [memorizationMap])

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
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  function handlePrint() {
    window.print()
  }

  // Get dynamic grading properties
  const getGradeBadge = (nilai: string) => {
    const norm = nilai.toLowerCase()
    if (norm.includes('mumtaz')) {
      return {
        bg: 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400',
        label: 'Mumtaz',
        icon: <Star className="w-3.5 h-3.5 fill-teal-500 text-teal-500 inline-block mr-1" />
      }
    }
    if (norm.includes('jiddan')) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        label: 'Jayyid Jiddan',
        icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-500 inline-block mr-1" />
      }
    }
    if (norm.includes('jayyid')) {
      return {
        bg: 'bg-primary/10 border-primary/30 text-primary',
        label: 'Jayyid',
        icon: <Check className="w-3.5 h-3.5 text-primary inline-block mr-1" />
      }
    }
    if (norm.includes('maqbul')) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        label: 'Maqbul',
        icon: null
      }
    }
    return {
      bg: 'bg-destructive/10 border-destructive/30 text-destructive',
      label: 'Perlu Ulang',
      icon: null
    }
  }

  return (
    <div id="raport-print-area" className="relative min-h-screen bg-background text-foreground pb-16 print:bg-white print:text-black print:pb-0 overflow-x-hidden">
      {/* Repeating Islamic Geometric Pattern (Print Hidden) */}
      <div className="absolute inset-0 text-primary/10 opacity-[0.03] pointer-events-none print:hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M40 12 L68 40 L40 68 L12 40 Z" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <path d="M40 24 L56 40 L40 56 L24 40 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="3" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      {/* Decorative Glow elements (Print Hidden) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl pointer-events-none print:hidden" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/5 blur-3xl pointer-events-none print:hidden" />

      {/* Top Navbar (Print hidden) */}
      <header className="relative w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-border/20 mb-8 print:hidden z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="gap-2 cursor-pointer text-xs font-semibold hover:bg-card"
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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-8 print:p-0 print:max-w-full relative z-10">
        
        {/* Printable Header (Visible only in print) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-black/80 pb-4 mb-6">
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

        {/* 2-Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:w-full">
          
          {/* Left Column (1/3 width on Desktop, Stacked on Mobile/Print) */}
          <div className="lg:col-span-4 space-y-6 print:block print:w-full">
            
            {/* Student Identity Card */}
            <Card className="border-border/40 shadow-md bg-card print:shadow-none print:border-black/30 overflow-hidden print:break-inside-avoid">
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
                    <h1 className="text-2xl font-extrabold text-foreground print:text-black tracking-tight mb-1">
                      {student.nama}
                    </h1>
                    <div className="text-sm font-semibold text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="bg-background print:bg-white px-2.5 py-0.5 rounded-md border border-border print:border-black/30 font-bold text-muted-foreground print:text-black">
                        Kelas {student.group?.class?.nama || 'Tanpa kelas'}
                      </span>
                      <span className="print:text-black/55">•</span>
                      <span className="print:text-black">Kelompok {student.group?.nama || 'Tanpa kelompok'}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden print:block text-right">
                  <div className="inline-flex flex-col gap-1 text-xs text-black">
                    <p className="font-semibold">Nama Lembaga: <span className="font-bold">SMA Islam Bunga Bangsa</span></p>
                    <p className="font-semibold">Evaluator: <span className="font-bold">Ustadz Pembina Halaqah</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview Card */}
            <Card className="border-border/40 shadow-sm bg-card flex flex-col justify-between p-6 print:border-black/30 print:p-4 print:break-inside-avoid">
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                  <Award className="w-5 h-5 text-accent shrink-0" />
                  <h3 className="text-sm font-bold text-muted-foreground print:text-black uppercase tracking-wider">Ringkasan Progres</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center my-4">
                  {/* Radial Progress Ring with Circle Animation */}
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
                      <span className="text-2xl font-black text-foreground print:text-black leading-none">{pct}%</span>
                      <span className="text-[10px] text-muted-foreground print:text-black/60 font-bold block uppercase tracking-wide">Dihafal</span>
                    </div>
                  </div>

                  {/* Legend & Target metrics */}
                  <div className="space-y-2 flex-1 w-full text-xs text-muted-foreground print:text-black font-semibold">
                    <div className="flex justify-between py-1 border-b border-border/20">
                      <span>Target Akhir</span>
                      <span className="font-bold text-foreground print:text-black">30 Juz</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/20">
                      <span>Juz Selesai</span>
                      <span className="font-bold text-primary">{juzSelesai} Juz</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/20">
                      <span>Surah Hafal</span>
                      <span className="font-bold text-foreground print:text-black">{totalHafal} / {ALL_SURAHS.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total verses setoran & keaktifan */}
              <div className="space-y-2 pt-3 border-t border-border/30 text-xs text-muted-foreground print:text-black">
                <div className="flex justify-between">
                  <span>Total Ayat Setoran:</span>
                  <span className="font-bold text-foreground print:text-black">{totalVerses} Ayat</span>
                </div>
                <div className="flex justify-between">
                  <span>Keaktifan Terakhir:</span>
                  <span className="font-bold text-foreground print:text-black">
                    {lastActive ? formatWaktu(lastActive).tanggal : 'Belum aktif'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Juz Map Legend Card (Print Hidden) */}
            <Card className="border-border/40 shadow-sm bg-card p-4 print:hidden">
              <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keterangan Warna</h4>
              </div>
              <div className="space-y-2 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-primary font-bold">Lengkap (100%)</span>
                  <span className="text-[10px] text-primary/80 uppercase font-extrabold">Satu Juz</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/25">
                  <span className="text-accent font-bold">Progres (1% - 99%)</span>
                  <span className="text-[10px] text-accent/80 uppercase font-extrabold">Sedang Dihafal</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card/40 border border-border">
                  <span className="text-muted-foreground font-bold">Belum Hafal (0%)</span>
                  <span className="text-[10px] text-muted-foreground/80 uppercase font-extrabold">Belum Mulai</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column (2/3 width on Desktop, Stacked on Mobile/Print) */}
          <div className="lg:col-span-8 space-y-6 print:block print:w-full">
            
            {/* Juz Grid Card */}
            <Card className="border-border/40 shadow-sm bg-card p-6 print:border-black/30 print:p-4 print:break-inside-avoid">
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-sm font-bold text-muted-foreground print:text-black uppercase tracking-wider">Pemetaan Juz</h3>
                </div>
                
                {/* Legend (Print hidden) */}
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground print:hidden">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-sm"></div>
                    <span>Lengkap</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-accent/20 border border-accent/30"></div>
                    <span>Progres</span>
                  </div>
                </div>
              </div>

              {/* Grid 1 - 30 */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {juzStatuses.map((j) => {
                  return (
                    <div
                      key={j.number}
                      className={`relative flex flex-col items-center justify-center rounded-lg py-2.5 text-center transition-all border ${
                        j.status === 'full'
                          ? 'bg-primary border-primary text-white font-bold shadow-md shadow-primary/5 hover:bg-primary/95 hover:scale-[1.03]'
                          : j.status === 'partial'
                            ? 'bg-accent/10 border-accent/25 text-accent font-bold hover:bg-accent/15 hover:scale-[1.03]'
                            : 'bg-card/40 border-border text-muted-foreground hover:border-text-muted/40 hover:scale-[1.03]'
                      }`}
                      title={`${j.pct}% Hafal`}
                    >
                      <span className="text-[9px] uppercase tracking-wide opacity-80 leading-none">Juz</span>
                      <span className="text-sm font-extrabold leading-none mt-1">{j.number}</span>
                      {j.status === 'partial' && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      )}
                    </div>
                  )
                })}
              </div>
              {submissions.length === 0 && (
                <div className="mt-4 p-3 rounded-lg border border-dashed border-border/40 bg-card/25 text-center text-xs text-muted-foreground">
                  Belum ada progres hafalan yang tercatat untuk Juz 1-30.
                </div>
              )}
            </Card>

            {/* Timeline of Submissions */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Calendar className="w-5 h-5 text-muted-foreground print:text-black shrink-0" />
                <h3 className="text-base font-bold text-foreground print:text-black">Riwayat Setoran Hafalan</h3>
              </div>

              {submissions.length === 0 ? (
                <div className="py-12 px-6 text-center border border-border/40 border-dashed rounded-xl bg-card/50 backdrop-blur-sm space-y-4 max-w-lg mx-auto print:border-black/20">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Belum Ada Setoran Hafalan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      Ananda belum memulai penyetoran hafalan Quran untuk periode rapor ini.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border/30 text-[11px] text-muted-foreground leading-relaxed text-left print:bg-white print:border-black/15">
                    <span className="font-bold text-foreground block mb-1">Langkah Selanjutnya:</span>
                    Silakan berkoordinasi dengan Ustadz Pembina Halaqah untuk menjadwalkan setoran harian ananda di kelas tahfidz.
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 ml-3 space-y-6">
                  {/* Premium Gradient Line Connector */}
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary-medium/50 to-border/30 print:bg-black/25" />

                  {submissions.map((sub) => {
                    const surah = ALL_SURAHS.find((s) => s.no === sub.surah_no)
                    const gradeInfo = getGradeBadge(sub.nilai)
                    return (
                      <div key={sub.id} className="relative group print:break-inside-avoid">
                        
                        {/* Pulsing indicator on timeline line */}
                        <div className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-card border-2 border-primary group-hover:scale-125 transition-transform duration-300 print:bg-black print:border-black" />

                        <div className="rounded-xl border border-border/40 bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 print:shadow-none print:border-black/20 print:p-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2.5">
                            
                            {/* Surah Name & Details */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center flex-wrap gap-2.5">
                                <h4 className="text-base font-bold text-foreground print:text-black">
                                  {getSurahNama(sub.surah_no)}
                                </h4>
                                {surah?.arab && (
                                  <span className="text-sm font-semibold text-primary/75 font-arabic print:text-black/60">
                                    ({surah.arab})
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground print:text-black/60 flex flex-wrap items-center gap-2 font-medium">
                                <span className="bg-card print:bg-white border border-border/50 print:border-black/20 px-2 py-0.5 rounded text-[11px] font-bold text-muted-foreground print:text-black">
                                  Ayat {sub.ayat_start}{sub.ayat_end && sub.ayat_end !== sub.ayat_start ? ` \u2013 ${sub.ayat_end}` : ''}
                                </span>
                                <span>•</span>
                                <span>Juz {surah?.juz || '?'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 opacity-60" />
                                  Ustadz {sub.guru_nama || 'Pembina'}
                                </span>
                                {sub.updated_at && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[10px] text-accent/80 font-bold bg-accent/5 border border-accent/25 px-1.5 py-0.5 rounded" title={`Diedit pada ${formatWaktu(sub.updated_at).tanggal} oleh Ustadz ${sub.updated_by_name || 'Pembina'}`}>
                                      Diedit
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Grade Badge & Date */}
                            <div className="flex items-center gap-3 self-start sm:self-center">
                              <span className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-bold leading-normal shadow-sm ${gradeInfo.bg}`}>
                                {gradeInfo.icon}
                                {gradeInfo.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground print:text-black/75 whitespace-nowrap font-medium">
                                {formatWaktu(sub.waktu).tanggal}
                              </span>
                            </div>
                          </div>

                          {/* Evaluator Notes */}
                          {sub.catatan && (
                            <div className="mt-2.5 text-xs text-muted-foreground bg-card/40 p-3 rounded-lg border border-border/30 leading-relaxed font-sans print:bg-white print:border-black/15">
                              <p className="font-bold text-[10px] uppercase text-muted-foreground print:text-black/60 tracking-wider mb-1 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Catatan Pembina
                              </p>
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

            {/* Signature Box (Visible only in print - Optimized layout) */}
            <div className="hidden print:grid grid-cols-2 gap-10 mt-20 text-center text-xs text-black print:break-inside-avoid">
              <div className="space-y-16">
                <p className="font-bold">Mengetahui,<br/>Orang Tua / Wali Murid</p>
                <div className="border-t border-black/40 w-44 mx-auto pt-1.5 font-bold">....................................</div>
              </div>
              <div className="space-y-16">
                <p className="font-bold">Samarinda, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pembina Halaqah</p>
                <div className="border-t border-black/40 w-44 mx-auto pt-1.5 font-bold">Ustadz {submissions[0]?.guru_nama || 'Pembina'}</div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
