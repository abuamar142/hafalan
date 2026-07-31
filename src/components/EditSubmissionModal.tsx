'use client'

import { useEffect, useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-wrapper'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { updateSubmissionAction } from '@/lib/actions/submissions'
import type { SetoranItem } from '@/lib/types'
import { Save, Loader2 } from 'lucide-react'

interface EditSubmissionModalProps {
  submission: SetoranItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditSubmissionModal({
  submission,
  isOpen,
  onClose,
  onSuccess,
}: EditSubmissionModalProps) {
  const { toast } = useToast()

  const [surahNo, setSurahNo] = useState('')
  const [nilai, setNilai] = useState('')
  const [catatan, setCatatan] = useState('')
  const [waktu, setWaktu] = useState('')
  const [ayatStart, setAyatStart] = useState<number>(1)
  const [ayatEnd, setAyatEnd] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  // Map Surahs to Combobox Options
  const surahOptions = useMemo(() => {
    return ALL_SURAHS.map((s) => ({
      id: s.no,
      label: `${s.no}. ${s.nama}`,
      sublabel: `Juz ${s.juz} • ${s.ayat} Ayat`,
      searchText: `${s.no} ${s.nama} juz ${s.juz}`,
    }))
  }, [])

  const selectedSurah = surahNo ? ALL_SURAHS.find(s => s.no === Number(surahNo)) : null
  const maxAyat = selectedSurah ? selectedSurah.ayat : 1

  // Populate form values when submission is loaded
  useEffect(() => {
    if (submission) {
      setSurahNo(String(submission.surah_no))
      setNilai(submission.nilai)
      setCatatan(submission.catatan || '')
      setAyatStart(submission.ayat_start || 1)
      setAyatEnd(submission.ayat_end || 1)
      setWaktu(toLocalDatetimeString(new Date(submission.waktu)))
    }
  }, [submission, isOpen])

  // Reset range if surah changes during editing
  useEffect(() => {
    if (selectedSurah && submission && Number(surahNo) !== submission.surah_no) {
      setAyatStart(1)
      setAyatEnd(selectedSurah.ayat)
    }
  }, [surahNo, selectedSurah, submission])

  async function handleSave() {
    if (!submission) return
    if (!surahNo) {
      toast('Surah harus dipilih', 'error')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('id', String(submission.id))
      formData.append('surah_no', surahNo)
      formData.append('nilai', nilai)
      formData.append('catatan', catatan.trim())
      formData.append('waktu', new Date(waktu).toISOString())
      formData.append('ayat_start', String(ayatStart))
      formData.append('ayat_end', String(ayatEnd === '' ? ayatStart : ayatEnd))

      await updateSubmissionAction(formData)

      toast('Setoran berhasil diperbarui!', 'success')
      onSuccess()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal memperbarui: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Setoran Hafalan</DialogTitle>
        </DialogHeader>
        {submission && (
          <div className="space-y-5">
            {/* Header Santri */}
            <div className="bg-card p-3 rounded-lg border border-border/50 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground block">Santri:</span>
              {submission.santri_nama}
            </div>

            {/* Grid Layout on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Surah */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-modal-surah" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Surah
                  </label>
                  <Combobox
                    id="edit-modal-surah"
                    options={surahOptions}
                    value={surahNo}
                    onChange={setSurahNo}
                    placeholder="Pilih surah..."
                    searchPlaceholder="Ketik nama surah..."
                    emptyText="Surah tidak ditemukan"
                  />
                </div>

                {selectedSurah && (
                  <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border/40 h-[72px]">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Surah Terpilih</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{selectedSurah.nama} (Juz {selectedSurah.juz})</p>
                    </div>
                    <span className="text-xl font-bold text-primary font-serif select-none" style={{ fontFamily: 'var(--font-arabic), serif' }}>
                      {selectedSurah.arab}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Time & Verse Range */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-modal-waktu" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Waktu Setoran
                  </label>
                  <Input
                    id="edit-modal-waktu"
                    type="datetime-local"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                  />
                </div>

                {selectedSurah && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Rentang Ayat
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAyatStart(1)
                          setAyatEnd(selectedSurah.ayat)
                        }}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        Set Semua Ayat
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] text-muted-foreground mb-1 block">Dari Ayat</span>
                        <Input
                          type="number"
                          min={1}
                          max={maxAyat}
                          value={ayatStart}
                          onChange={(e) => setAyatStart(Math.max(1, Math.min(maxAyat, Number(e.target.value) || 1)))}
                        />
                      </div>
                      <span className="text-muted-foreground mt-5 shrink-0 text-xs">hingga</span>
                      <div className="flex-1">
                        <span className="text-[10px] text-muted-foreground mb-1 block">Sampai Ayat</span>
                        <Input
                          type="number"
                          min={1}
                          max={maxAyat}
                          value={ayatEnd}
                          onChange={(e) => setAyatEnd(e.target.value === '' ? '' : Math.max(1, Math.min(maxAyat, Number(e.target.value) || 1)))}
                          placeholder={String(maxAyat)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Score Pills (Pills row is full-width below the columns) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Predikat / Nilai
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {NILAI_OPTIONS.map((n) => {
                  const isSelected = nilai === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNilai(n)}
                      className={`px-2.5 py-2.5 rounded-md text-xs font-semibold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-sm ring-2 ring-primary/20'
                          : 'border-border bg-card text-muted-foreground hover:bg-card/65'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Catatan Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="edit-modal-catatan" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Catatan (Opsional)
              </label>
              <textarea
                id="edit-modal-catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Evaluasi tajwid atau kelancaran..."
                rows={3}
                className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors resize-none text-foreground focus:border-primary font-sans"
              />
            </div>

            {/* Action buttons */}
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan...' : 'Perbarui Setoran'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
