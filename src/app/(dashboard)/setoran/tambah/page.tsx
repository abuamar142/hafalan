'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '../../layout'
import { ALL_SURAHS, NILAI_OPTIONS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TambahSetoranPage() {
  const { state, refreshAll } = useDashboard()

  const [santriId, setSantriId] = useState('')
  const [surahNo, setSurahNo] = useState('')
  const [nilai, setNilai] = useState(NILAI_OPTIONS[0])
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
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const wDate = new Date(waktu)

      await supabase.from('submissions').insert({
        id: Date.now(),
        student_id: Number(santriId),
        surah_no: Number(surahNo),
        nilai,
        catatan: catatan.trim(),
        waktu: wDate.toISOString(),
        guru_id: user?.id || null,
        ayat_start: ayatStart,
        ayat_end: ayatEnd === '' ? ayatStart : ayatEnd,
      })

      // Reset form
      setSantriId('')
      setSurahNo('')
      setNilai(NILAI_OPTIONS[0])
      setCatatan('')
      setAyatStart(1)
      setAyatEnd('')
      resetDatetime()

      await refreshAll()

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
    <>
      {/* Header */}
      <h1 className="mb-4 text-lg font-semibold text-text">Tambah Setoran</h1>

      {/* Success toast */}
      {success && (
        <div className="mb-3 rounded-lg border-l-[3px] border-primary bg-primary/10 px-3 py-2.5 text-xs text-primary leading-relaxed transition-all">
          Setoran berhasil disimpan!
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl bg-card p-4 border border-border mb-4">
        {error && (
          <div className="mb-3 rounded-lg border-l-[3px] border-red bg-red-light px-3 py-2.5 text-xs text-red leading-relaxed">
            {error}
          </div>
        )}

        {/* Pilih Santri */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Santri
          </label>
          <select
            value={santriId}
            onChange={(e) => setSantriId(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">Pilih Santri</option>
            {state.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kelas})
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Surah */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Surah
          </label>
          <select
            value={surahNo}
            onChange={(e) => setSurahNo(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">Pilih Surah</option>
            {ALL_SURAHS.map((s) => (
              <option key={s.no} value={s.no}>
                {s.nama} (Juz {s.juz})
              </option>
            ))}
          </select>
        </div>

        {/* Ayat Range */}
        {surahNo && (
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-text-secondary">
              Ayat (dari — sampai)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={maxAyat}
                value={ayatStart}
                onChange={(e) => setAyatStart(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
              <span className="text-sm text-text-muted">—</span>
              <input
                type="number"
                min={1}
                max={maxAyat}
                value={ayatEnd}
                onChange={(e) => setAyatEnd(e.target.value === '' ? '' : Math.max(1, Math.min(maxAyat || 999, Number(e.target.value) || 1)))}
                placeholder={String(maxAyat)}
                className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              {ayatEnd === '' ? '1 ayat saja' : `${ayatEnd - ayatStart + 1} ayat`}
            </div>
          </div>
        )}

        {/* Nilai */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Nilai
          </label>
          <select
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            {NILAI_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Waktu */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Waktu
          </label>
          <input
            type="datetime-local"
            value={waktu}
            onChange={(e) => setWaktu(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        {/* Catatan */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Catatan (opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan..."
            rows={2}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Setoran'}
          </button>
        </div>
      </div>
    </>
  )
}
