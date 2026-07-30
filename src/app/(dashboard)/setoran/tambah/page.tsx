'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '../../layout'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { addSubmissionAction } from '@/lib/actions/submissions'
import { Button, Input, Combobox, useKumoToastManager } from '@cloudflare/kumo'
import { Card, CardContent } from '@/components/ui/Card'
import { FloppyDisk, BookOpen, ClockCounterClockwise } from '@phosphor-icons/react'
import { getColor, initials, getPct, getTotalHafal, formatWaktu, getSurahNama } from '@/lib/helpers'

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TambahSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()
  const toastManager = useKumoToastManager()

  const [selectedStudentItem, setSelectedStudentItem] = useState<Record<string, unknown> | null>(null)
  const [selectedSurahItem, setSelectedSurahItem] = useState<Record<string, unknown> | null>(null)
  const [nilai, setNilai] = useState(NILAI_OPTIONS[0] || '')
  const [catatan, setCatatan] = useState('')
  const [waktu, setWaktu] = useState('')
  const [saving, setSaving] = useState(false)
  const [ayatStart, setAyatStart] = useState<number>(1)
  const [ayatEnd, setAyatEnd] = useState<number | ''>('')

  // Selected entities
  const selectedStudent = selectedStudentItem ? state.students.find(s => s.id === selectedStudentItem.id) : null
  const selectedSurah = selectedSurahItem ? ALL_SURAHS.find(s => s.no === selectedSurahItem.no) : null
  const maxAyat = selectedSurah ? selectedSurah.ayat : 1

  // Student recent history
  const studentHistory = state.submissions
    .filter((sub) => sub.santri_id === (selectedStudentItem?.id as number | undefined))
    .slice(0, 3)

  // Reset ayat defaults when surah changes
  useEffect(() => {
    if (selectedSurah) {
      setAyatStart(1)
      setAyatEnd(selectedSurah.ayat)
    }
  }, [selectedSurah])

  const resetDatetime = useCallback(() => {
    setWaktu(toLocalDatetimeString(new Date()))
  }, [])

  // Set initial datetime on mount
  useEffect(() => {
    resetDatetime()
  }, [resetDatetime])

  // Re-set datetime when tab becomes visible
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        resetDatetime()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [resetDatetime])

  // Map items for Kumo Combobox
  const santriItems = state.students.map((s) => ({
    id: s.id,
    nama: s.nama,
    kelas: s.kelas ?? '',
    group_name: s.group_name ?? '',
    _label: s.nama,
    _sublabel: `${s.kelas || 'Tanpa Kelas'} ${s.group_name ? `• ${s.group_name}` : ''}`,
  }))

  const surahItems = ALL_SURAHS.map((s) => ({
    no: s.no,
    nama: s.nama,
    arab: s.arab,
    juz: s.juz,
    ayat: s.ayat,
    _label: `${s.no}. ${s.nama}`,
    _sublabel: `Juz ${s.juz} • ${s.ayat} Ayat`,
  }))

  async function handleSubmit() {
    if (!selectedStudentItem || !selectedSurahItem) {
      toastManager.add({ title: 'Santri dan Surah harus dipilih', variant: 'error' })
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('student_id', String(selectedStudentItem.id))
      formData.append('surah_no', String(selectedSurahItem.no))
      formData.append('nilai', nilai)
      formData.append('catatan', catatan.trim())
      formData.append('waktu', new Date(waktu).toISOString())
      formData.append('ayat_start', String(ayatStart))
      formData.append('ayat_end', String(ayatEnd === '' ? ayatStart : ayatEnd))

      await addSubmissionAction(formData)

      // Reset form
      setSelectedStudentItem(null)
      setSelectedSurahItem(null)
      setNilai(NILAI_OPTIONS[0] || '')
      setCatatan('')
      setAyatStart(1)
      setAyatEnd('')
      resetDatetime()

      await refreshSubmissions()
      toastManager.add({ title: 'Setoran berhasil disimpan!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toastManager.add({ title: 'Gagal menyimpan: ' + msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-text">Tambah Setoran</h2>
        <p className="text-sm text-text-muted mt-1">
          Catat setoran hafalan harian santri.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm bg-surface">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Searchable Santri Select */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary">Santri</label>
                  <Combobox
                    items={santriItems}
                    value={selectedStudentItem}
                    onValueChange={(item) => setSelectedStudentItem(item as Record<string, unknown> | null)}
                    itemToStringLabel={(item) => `${(item as Record<string, string>)._label} ${(item as Record<string, string>).kelas || ''} ${(item as Record<string, string>).group_name || ''}`}
                  >
                    <Combobox.TriggerInput placeholder="Cari dan pilih santri..." />
                    <Combobox.Content>
                      <Combobox.List>
                        {(item) => (
                          <Combobox.Item value={item}>
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{(item as Record<string, string>)._label}</div>
                              <div className="text-[11px] text-text-muted truncate mt-0.5 font-normal">{(item as Record<string, string>)._sublabel}</div>
                            </div>
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                      <Combobox.Empty>Siswa tidak ditemukan</Combobox.Empty>
                    </Combobox.Content>
                  </Combobox>
                </div>

                {/* Searchable Surah Select */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary">Surah</label>
                  <Combobox
                    items={surahItems}
                    value={selectedSurahItem}
                    onValueChange={(item) => setSelectedSurahItem(item as Record<string, unknown> | null)}
                    itemToStringLabel={(item) => `${(item as Record<string, string>).no} ${(item as Record<string, string>).nama} juz ${(item as Record<string, string>).juz}`}
                  >
                    <Combobox.TriggerInput placeholder="Cari dan pilih surah..." />
                    <Combobox.Content>
                      <Combobox.List>
                        {(item) => (
                          <Combobox.Item value={item}>
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{(item as Record<string, string>)._label}</div>
                              <div className="text-[11px] text-text-muted truncate mt-0.5 font-normal">{(item as Record<string, string>)._sublabel}</div>
                            </div>
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                      <Combobox.Empty>Surah tidak ditemukan</Combobox.Empty>
                    </Combobox.Content>
                  </Combobox>
                </div>

                {/* Interactive Surah & Ayat Preview */}
                {selectedSurah && (
                  <div className="space-y-3.5 p-4 bg-card/40 rounded-lg border border-border/40 md:col-span-2">
                    {/* Surah details */}
                    <div className="flex items-center justify-between border-b border-border/30 pb-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Surah Terpilih</p>
                        <h4 className="text-sm font-bold text-text">
                          {selectedSurah.no}. {selectedSurah.nama}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Juz {selectedSurah.juz} • {selectedSurah.ayat} Ayat
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary select-none leading-none block" style={{ fontFamily: 'var(--font-arabic), serif' }}>
                          {selectedSurah.arab}
                        </span>
                      </div>
                    </div>

                    {/* Ayat Range Inputs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-secondary">Rentang Ayat</label>
                        <button
                          type="button"
                          onClick={() => {
                            setAyatStart(1)
                            setAyatEnd(selectedSurah.ayat)
                          }}
                          className="text-xs font-medium text-primary hover:underline cursor-pointer"
                        >
                          Set Semua Ayat (1 - {selectedSurah.ayat})
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label htmlFor="ayat-mulai" className="text-[10px] text-text-muted mb-1 block">Dari Ayat</label>
                          <Input
                            id="ayat-mulai"
                            type="number"
                            min={1}
                            max={maxAyat}
                            value={ayatStart}
                            onChange={(e) => setAyatStart(Math.max(1, Math.min(maxAyat, Number(e.target.value) || 1)))}
                          />
                        </div>
                        <span className="text-text-muted mt-5 shrink-0 text-sm">hingga</span>
                        <div className="flex-1">
                          <label htmlFor="ayat-selesai" className="text-[10px] text-text-muted mb-1 block">Sampai Ayat</label>
                          <Input
                            id="ayat-selesai"
                            type="number"
                            min={1}
                            max={maxAyat}
                            value={ayatEnd}
                            onChange={(e) => setAyatEnd(e.target.value === '' ? '' : Math.max(1, Math.min(maxAyat, Number(e.target.value) || 1)))}
                            placeholder={String(maxAyat)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">
                        Total: <span className="font-semibold text-text-secondary">{ayatEnd === '' ? '1' : Number(ayatEnd) - Number(ayatStart) + 1}</span> ayat
                      </p>
                    </div>
                  </div>
                )}

                {/* Predikat / Nilai direct selection */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="nilai-select" className="block text-sm font-medium text-text-secondary">Predikat / Nilai</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {NILAI_OPTIONS.map((n) => {
                      const isSelected = nilai === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNilai(n)}
                          className={`px-3 py-2.5 rounded-md text-xs font-semibold border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-primary border-primary text-white shadow-sm ring-2 ring-primary/20'
                              : 'border-border bg-surface text-text-secondary hover:bg-card/65'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Waktu Setoran */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="waktu-input" className="block text-sm font-medium text-text-secondary">Waktu Setoran</label>
                  <Input
                    id="waktu-input"
                    type="datetime-local"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                  />
                </div>

                {/* Catatan */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="catatan-textarea" className="block text-sm font-medium text-text-secondary">Catatan (Opsional)</label>
                  <textarea
                    id="catatan-textarea"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tuliskan evaluasi tajwid atau kelancaran..."
                    rows={3}
                    className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors resize-none text-text focus:border-primary font-sans"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 px-6 shadow-sm cursor-pointer">
              <FloppyDisk size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Setoran'}
            </Button>
          </div>
        </div>

        {/* Sidebar Status Column */}
        <div className="lg:col-span-1">
          {!selectedStudent ? (
            <Card className="border-border/30 bg-card/20 border-dashed h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <BookOpen size={24} />
              </div>
              <h4 className="text-sm font-semibold text-text">Belum ada Santri Terpilih</h4>
              <p className="text-xs text-text-muted max-w-xs mt-1.5 leading-relaxed">
                Pilih santri dari kolom sebelah kiri untuk melihat ringkasan hafalan, pencapaian juz, serta riwayat setoran terbaru mereka.
              </p>
            </Card>
          ) : (
            <Card className="border-border/40 shadow-sm bg-surface sticky top-6">
              <CardContent className="p-5 space-y-5">
                {/* Student Profile Info */}
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm ring-1 ring-black/5"
                    style={{ backgroundColor: getColor(selectedStudent, selectedStudent.id) }}
                  >
                    {initials(selectedStudent.nama)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-text truncate">{selectedStudent.nama}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-muted">
                      <span className="bg-card px-2 py-0.5 rounded-md border border-border/50 font-medium">
                        {selectedStudent.kelas || 'Tanpa kelas'}
                      </span>
                      {selectedStudent.group_name && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="truncate">{selectedStudent.group_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Metrics */}
                <div className="space-y-2 bg-card p-3 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium">Progress Hafalan</span>
                    <span className="font-bold text-primary">{getPct(selectedStudent)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${getPct(selectedStudent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-text-muted">Total Surah Dihafal</span>
                    <span className="font-semibold text-text-secondary">{getTotalHafal(selectedStudent)} surah</span>
                  </div>
                </div>

                {/* Recent Submissions History */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <ClockCounterClockwise size={14} className="text-text-muted" />
                    Riwayat Setoran Terbaru
                  </h5>
                  <div className="space-y-2">
                    {studentHistory.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-3 text-center bg-card/20 rounded-md border border-dashed border-border/40">
                        Belum ada riwayat setoran.
                      </p>
                    ) : (
                      studentHistory.map((sub) => (
                        <div key={sub.id} className="p-2.5 rounded-lg border border-border/30 bg-card/10 hover:bg-card/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-text truncate">
                              {getSurahNama(sub.surah_no)}
                            </span>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {sub.nilai}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-muted mt-1 flex justify-between">
                            <span>
                              Ayat {sub.ayat_start}{sub.ayat_end && sub.ayat_end !== sub.ayat_start ? ` - ${sub.ayat_end}` : ''}
                            </span>
                            <span>
                              {formatWaktu(sub.waktu).tanggal}
                            </span>
                          </div>
                          {sub.catatan && (
                            <p className="text-[10px] text-text-secondary mt-1 bg-surface p-1 rounded border border-border/40 line-clamp-2">
                              {sub.catatan}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
