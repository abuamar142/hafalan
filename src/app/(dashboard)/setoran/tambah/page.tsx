'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '../../layout'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { addSubmissionAction } from '@/lib/actions/submissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, BookOpen, History, Check, User } from 'lucide-react'
import { getPct, formatWaktu, getSurahNama, initials } from '@/lib/helpers'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/toast-wrapper'
import { PageHeader } from '@/components/app/page-header'
import { SectionCard } from '@/components/app/section-card'
import { ProgressBar } from '@/components/app/progress-bar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Label kecil yang konsisten untuk semua field form. */
function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
    >
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </label>
  )
}

export default function TambahSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()
  const { toast } = useToast()

  const [santriId, setSantriId] = useState('')
  const [surahNo, setSurahNo] = useState('')
  const [nilai, setNilai] = useState(NILAI_OPTIONS[0] || '')
  const [catatan, setCatatan] = useState('')
  const [waktu, setWaktu] = useState('')
  const [saving, setSaving] = useState(false)
  const [ayatStart, setAyatStart] = useState<number>(1)
  const [ayatEnd, setAyatEnd] = useState<number | ''>('')

  const selectedStudent = state.students.find((s) => s.id === Number(santriId))
  const selectedSurah = surahNo
    ? ALL_SURAHS.find((s) => s.no === Number(surahNo))
    : null
  const maxAyat = selectedSurah ? selectedSurah.ayat : 1

  const studentHistory = state.submissions
    .filter((sub) => sub.santri_id === Number(santriId))
    .slice(0, 3)

  useEffect(() => {
    if (selectedSurah) {
      setAyatStart(1)
      setAyatEnd(selectedSurah.ayat)
    }
  }, [surahNo, selectedSurah])

  const resetDatetime = useCallback(() => {
    setWaktu(toLocalDatetimeString(new Date()))
  }, [])

  useEffect(() => {
    resetDatetime()
  }, [resetDatetime])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        resetDatetime()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [resetDatetime])

  const santriOptions = state.students.map((s) => ({
    id: s.id,
    label: s.nama,
    sublabel: `${s.kelas || 'Tanpa Kelas'}${s.group_name ? ` • ${s.group_name}` : ''}`,
    searchText: `${s.nama} ${s.kelas || ''} ${s.group_name || ''}`,
  }))

  const surahOptions = ALL_SURAHS.map((s) => ({
    id: s.no,
    label: `${s.no}. ${s.nama}`,
    sublabel: `Juz ${s.juz} • ${s.ayat} Ayat`,
    searchText: `${s.no} ${s.nama} juz ${s.juz}`,
  }))

  async function handleSubmit() {
    if (!santriId || !surahNo) {
      toast('Santri dan Surah harus dipilih', 'error')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('student_id', santriId)
      formData.append('surah_no', surahNo)
      formData.append('nilai', nilai)
      formData.append('catatan', catatan.trim())
      formData.append('waktu', new Date(waktu).toISOString())
      formData.append('ayat_start', String(ayatStart))
      formData.append('ayat_end', String(ayatEnd === '' ? ayatStart : ayatEnd))

      await addSubmissionAction(formData)

      setSantriId('')
      setSurahNo('')
      setNilai(NILAI_OPTIONS[0] || '')
      setCatatan('')
      setAyatStart(1)
      setAyatEnd('')
      resetDatetime()

      await refreshSubmissions()
      toast('Setoran berhasil disimpan!', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menyimpan: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const totalAyat =
    ayatEnd === '' ? 1 : Number(ayatEnd) - Number(ayatStart) + 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Setoran"
        description="Catat setoran hafalan harian santri."
        icon={<BookOpen />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom form */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Formulir Setoran"
            description="Lengkapi data setoran di bawah ini."
            icon={<BookOpen />}
          >
            <div className="space-y-5">
              {/* Santri */}
              <div>
                <FieldLabel htmlFor="santri-select" required>
                  Santri
                </FieldLabel>
                <Combobox
                  id="santri-select"
                  options={santriOptions}
                  value={santriId}
                  onChange={setSantriId}
                  placeholder="Cari dan pilih santri..."
                  searchPlaceholder="Ketik nama atau kelas santri..."
                  emptyText="Siswa tidak ditemukan"
                />
              </div>

              {/* Surah */}
              <div>
                <FieldLabel htmlFor="surah-select" required>
                  Surah
                </FieldLabel>
                <Combobox
                  id="surah-select"
                  options={surahOptions}
                  value={surahNo}
                  onChange={setSurahNo}
                  placeholder="Cari dan pilih surah..."
                  searchPlaceholder="Ketik nama atau nomor surah..."
                  emptyText="Surah tidak ditemukan"
                />
              </div>

              {/* Pratinjau surah */}
              {selectedSurah ? (
                <div className="animate-fade-in space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Surah Terpilih
                      </p>
                      <h4 className="mt-0.5 text-base font-bold text-foreground">
                        {selectedSurah.no}. {selectedSurah.nama}
                      </h4>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        Juz {selectedSurah.juz} • {selectedSurah.ayat} Ayat
                      </p>
                    </div>
                    <span className="shrink-0 font-arabic text-3xl leading-none text-primary">
                      {selectedSurah.arab}
                    </span>
                  </div>

                  {/* Rentang ayat */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-foreground">
                        Rentang Ayat
                      </label>
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setAyatStart(1)
                          setAyatEnd(selectedSurah.ayat)
                        }}
                        className="h-auto p-0 text-xs"
                      >
                        Set semua (1–{selectedSurah.ayat})
                      </Button>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label
                          htmlFor="ayat-mulai"
                          className="mb-1 block text-[10px] font-medium text-muted-foreground"
                        >
                          Dari Ayat
                        </label>
                        <Input
                          id="ayat-mulai"
                          type="number"
                          min={1}
                          max={maxAyat}
                          value={ayatStart}
                          onChange={(e) =>
                            setAyatStart(
                              Math.max(
                                1,
                                Math.min(maxAyat, Number(e.target.value) || 1)
                              )
                            )
                          }
                        />
                      </div>
                      <span className="pb-2.5 text-sm text-muted-foreground">
                        hingga
                      </span>
                      <div className="flex-1">
                        <label
                          htmlFor="ayat-selesai"
                          className="mb-1 block text-[10px] font-medium text-muted-foreground"
                        >
                          Sampai Ayat
                        </label>
                        <Input
                          id="ayat-selesai"
                          type="number"
                          min={1}
                          max={maxAyat}
                          value={ayatEnd}
                          onChange={(e) =>
                            setAyatEnd(
                              e.target.value === ''
                                ? ''
                                : Math.max(
                                    1,
                                    Math.min(
                                      maxAyat,
                                      Number(e.target.value) || 1
                                    )
                                  )
                            )
                          }
                          placeholder={String(maxAyat)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total{' '}
                      <span className="font-bold text-foreground">
                        {totalAyat}
                      </span>{' '}
                      ayat
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Predikat */}
              <div>
                <FieldLabel required>Predikat / Nilai</FieldLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {NILAI_OPTIONS.map((n) => {
                    const isSelected = nilai === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNilai(n)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {isSelected ? <Check className="size-3.5" /> : null}
                        {n}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Waktu */}
              <div>
                <FieldLabel htmlFor="waktu-input">Waktu Setoran</FieldLabel>
                <Input
                  id="waktu-input"
                  type="datetime-local"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                />
              </div>

              {/* Catatan */}
              <div>
                <FieldLabel htmlFor="catatan-textarea">
                  Catatan (Opsional)
                </FieldLabel>
                <Textarea
                  id="catatan-textarea"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan evaluasi tajwid atau kelancaran..."
                  rows={3}
                />
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              size="lg"
              className="cursor-pointer gap-2 px-6"
            >
              <Save className="size-4" />
              {saving ? 'Menyimpan...' : 'Simpan Setoran'}
            </Button>
          </div>
        </div>

        {/* Kolom status */}
        <div className="lg:col-span-1">
          {!selectedStudent ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Belum ada santri terpilih
              </h4>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Pilih santri untuk melihat ringkasan hafalan, pencapaian juz,
                serta riwayat setoran terbarunya.
              </p>
            </div>
          ) : (
            <SectionCard
              title="Ringkasan Santri"
              icon={<User />}
              className="sticky top-20"
            >
              <div className="space-y-5">
                {/* Profil */}
                <div className="flex items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
                    {initials(selectedStudent.nama)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-bold text-foreground">
                      {selectedStudent.nama}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                      >
                        {selectedStudent.kelas || 'Tanpa kelas'}
                      </Badge>
                      {selectedStudent.group_name ? (
                        <span className="truncate text-xs font-medium text-muted-foreground">
                          {selectedStudent.group_name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Progres */}
                <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">
                      Progress Hafalan
                    </span>
                    <span className="tabular font-bold text-primary">
                      {getPct(selectedStudent)}%
                    </span>
                  </div>
                  <ProgressBar value={getPct(selectedStudent)} size="md" />
                  <div className="flex items-center justify-between pt-0.5 text-xs">
                    <span className="text-muted-foreground">Juz Selesai</span>
                    <span className="font-semibold text-foreground">
                      {selectedStudent.juz_selesai || 0} juz
                    </span>
                  </div>
                </div>

                {/* Riwayat terbaru */}
                <div className="space-y-2.5">
                  <h5 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Setoran Terbaru
                  </h5>
                  <div className="space-y-2">
                    {studentHistory.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-4 text-center text-xs italic text-muted-foreground">
                        Belum ada riwayat setoran.
                      </p>
                    ) : (
                      studentHistory.map((sub) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-xs font-bold text-foreground">
                              {getSurahNama(sub.surah_no)}
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-primary/20 bg-primary/10 text-[10px] text-primary"
                            >
                              {sub.nilai}
                            </Badge>
                          </div>
                          <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                            <span>
                              Ayat {sub.ayat_start}
                              {sub.ayat_end &&
                              sub.ayat_end !== sub.ayat_start
                                ? `–${sub.ayat_end}`
                                : ''}
                            </span>
                            <span>{formatWaktu(sub.waktu).tanggal}</span>
                          </div>
                          {sub.catatan ? (
                            <p className="mt-1.5 line-clamp-2 rounded-md border border-border/50 bg-muted/40 p-1.5 text-[10px] text-muted-foreground">
                              {sub.catatan}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
