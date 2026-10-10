'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast-wrapper'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { updateSubmissionAction } from '@/lib/actions/submissions'
import type { SetoranItem } from '@/lib/types'
import { Save, Loader2, Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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

/** Label field yang konsisten. */
function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </label>
  )
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

  const surahOptions = useMemo(() => {
    return ALL_SURAHS.map((s) => ({
      id: s.no,
      label: `${s.no}. ${s.nama}`,
      sublabel: `Juz ${s.juz} • ${s.ayat} Ayat`,
      searchText: `${s.no} ${s.nama} juz ${s.juz}`,
    }))
  }, [])

  const selectedSurah = surahNo
    ? ALL_SURAHS.find((s) => s.no === Number(surahNo))
    : null
  const maxAyat = selectedSurah ? selectedSurah.ayat : 1

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

  useEffect(() => {
    if (
      selectedSurah &&
      submission &&
      Number(surahNo) !== submission.surah_no
    ) {
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Setoran Hafalan</DialogTitle>
          <DialogDescription>
            Perbarui detail setoran hafalan santri.
          </DialogDescription>
        </DialogHeader>

        {submission ? (
          <div className="space-y-5">
            {/* Identitas santri */}
            <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
              <User className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Santri
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {submission.santri_nama}
                </p>
              </div>
            </div>

            {/* Surah + waktu */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="edit-modal-surah">Surah</FieldLabel>
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
              <div>
                <FieldLabel htmlFor="edit-modal-waktu">
                  Waktu Setoran
                </FieldLabel>
                <Input
                  id="edit-modal-waktu"
                  type="datetime-local"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                />
              </div>
            </div>

            {/* Pratinjau surah + rentang ayat */}
            {selectedSurah ? (
              <div className="animate-fade-in space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Surah Terpilih
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-foreground">
                      {selectedSurah.nama}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      Juz {selectedSurah.juz} • {selectedSurah.ayat} Ayat
                    </p>
                  </div>
                  <span className="shrink-0 font-arabic text-2xl leading-none text-primary">
                    {selectedSurah.arab}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Rentang Ayat
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAyatStart(1)
                        setAyatEnd(selectedSurah.ayat)
                      }}
                      className="cursor-pointer text-xs font-medium text-primary hover:underline"
                    >
                      Set semua (1–{selectedSurah.ayat})
                    </button>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label
                        htmlFor="edit-ayat-mulai"
                        className="mb-1 block text-[10px] font-medium text-muted-foreground"
                      >
                        Dari Ayat
                      </label>
                      <Input
                        id="edit-ayat-mulai"
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
                    <span className="pb-2.5 text-xs text-muted-foreground">
                      hingga
                    </span>
                    <div className="flex-1">
                      <label
                        htmlFor="edit-ayat-selesai"
                        className="mb-1 block text-[10px] font-medium text-muted-foreground"
                      >
                        Sampai Ayat
                      </label>
                      <Input
                        id="edit-ayat-selesai"
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
                </div>
              </div>
            ) : null}

            {/* Predikat */}
            <div>
              <FieldLabel>Predikat / Nilai</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {NILAI_OPTIONS.map((n) => {
                  const isSelected = nilai === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNilai(n)}
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-bold transition-all',
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

            {/* Catatan */}
            <div>
              <FieldLabel htmlFor="edit-modal-catatan">
                Catatan (Opsional)
              </FieldLabel>
              <Textarea
                id="edit-modal-catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Evaluasi tajwid atau kelancaran..."
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="cursor-pointer gap-2"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? 'Menyimpan...' : 'Perbarui Setoran'}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
