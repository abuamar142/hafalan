'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '../../layout'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { addSubmissionAction } from '@/lib/actions/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckCircle2, Save } from 'lucide-react'

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TambahSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()

  const [santriId, setSantriId] = useState('')
  const [surahNo, setSurahNo] = useState('')
  const [nilai, setNilai] = useState(NILAI_OPTIONS[0] || '')
  const [catatan, setCatatan] = useState('')
  const [waktu, setWaktu] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ayatStart, setAyatStart] = useState<number>(1)
  const [ayatEnd, setAyatEnd] = useState<number | ''>('')

  // Get max ayat for selected surah segment
  const maxAyat = surahNo ? ALL_SURAHS.find(s => s.no === Number(surahNo))?.ayat : 1

  // Reset ayat defaults when surah changes
  useEffect(() => {
    if (surahNo) {
      const surah = ALL_SURAHS.find(s => s.no === Number(surahNo))
      if (surah) {
        setAyatStart(1)
        setAyatEnd(surah.ayat)
      }
    }
  }, [surahNo])

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

  async function handleSubmit() {
    if (!santriId || !surahNo) {
      setError('Santri dan Surah harus dipilih')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

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

      // Reset form
      setSantriId('')
      setSurahNo('')
      setNilai(NILAI_OPTIONS[0] || '')
      setCatatan('')
      setAyatStart(1)
      setAyatEnd('')
      resetDatetime()

      await refreshSubmissions()

      // Show success toast briefly
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal menyimpan: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text">Tambah Setoran</h2>
        <p className="text-sm text-text-muted mt-1">
          Catat setoran hafalan harian santri.
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-md border-l-[3px] border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" />
          Setoran berhasil disimpan!
        </div>
      )}

      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-6 space-y-5">
          {error && (
            <div className="rounded-md border-l-[3px] border-red bg-red-light px-3 py-2.5 text-sm text-red">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="santri-select" className="block text-sm font-medium text-text-secondary">Santri</label>
              <select
                id="santri-select"
                value={santriId}
                onChange={(e) => setSantriId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
              >
                <option value="">Pilih Santri</option>
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} {s.kelas ? `(${s.kelas})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="surah-select" className="block text-sm font-medium text-text-secondary">Surah</label>
              <select
                id="surah-select"
                value={surahNo}
                onChange={(e) => setSurahNo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
              >
                <option value="">Pilih Surah</option>
                {ALL_SURAHS.map((s) => (
                  <option key={s.no} value={s.no}>
                    {s.no}. {s.nama} (Juz {s.juz})
                  </option>
                ))}
              </select>
            </div>

             {surahNo && (
              <div className="space-y-1.5 md:col-span-2">
                <span className="block text-sm font-medium text-text-secondary">
                  Rentang Ayat
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label htmlFor="ayat-mulai" className="sr-only">Ayat Mulai</label>
                    <Input
                      id="ayat-mulai"
                      type="number"
                      min={1}
                      max={maxAyat}
                      value={ayatStart}
                      onChange={(e) => setAyatStart(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <span className="text-text-muted">hingga</span>
                  <div className="flex-1">
                    <label htmlFor="ayat-selesai" className="sr-only">Ayat Selesai</label>
                    <Input
                      id="ayat-selesai"
                      type="number"
                      min={1}
                      max={maxAyat}
                      value={ayatEnd}
                      onChange={(e) => setAyatEnd(e.target.value === '' ? '' : Math.max(1, Math.min(maxAyat || 999, Number(e.target.value) || 1)))}
                      placeholder={String(maxAyat)}
                    />
                  </div>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Total: <span className="font-medium">{ayatEnd === '' ? '1' : ayatEnd - ayatStart + 1}</span> ayat
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="nilai-select" className="block text-sm font-medium text-text-secondary">Predikat / Nilai</label>
              <select
                id="nilai-select"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
              >
                {NILAI_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Waktu Setoran</label>
              <Input
                type="datetime-local"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary">Catatan (Opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan evaluasi tajwid atau kelancaran..."
                rows={3}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit} disabled={saving} className="gap-2 px-6">
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Setoran'}
        </Button>
      </div>
    </div>
  )
}
