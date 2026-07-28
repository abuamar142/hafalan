'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../../layout'
import { getSurahNama } from '@/lib/helpers'
import type { SetoranItem } from '@/lib/types'

function formatDate(dateStr: string): string {
  const months: Record<string, string> = {
    Januari: 'Jan',
    Februari: 'Feb',
    Maret: 'Mar',
    April: 'Apr',
    Mei: 'May',
    Juni: 'Jun',
    Juli: 'Jul',
    Agustus: 'Aug',
    September: 'Sep',
    Oktober: 'Oct',
    November: 'Nov',
    Desember: 'Dec',
  }
  for (const [full, short] of Object.entries(months)) {
    if (dateStr.includes(full)) {
      return dateStr.replace(full, short)
    }
  }
  return dateStr
}

export default function RiwayatSetoranPage() {
  const { state } = useDashboard()
  const [search, setSearch] = useState('')
  const [guruFilter, setGuruFilter] = useState('')

  // Unique guru_nama values from submissions
  const guruOptions = useMemo(() => {
    const names = new Set(
      state.submissions.map((s: SetoranItem) => s.guru_nama).filter(Boolean)
    )
    return Array.from(names).sort()
  }, [state.submissions])

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return state.submissions.filter((item: SetoranItem) => {
      // Search filter
      if (q) {
        const surahName = getSurahNama(item.surah_no).toLowerCase()
        const match =
          item.santri_nama.toLowerCase().includes(q) ||
          surahName.includes(q)
        if (!match) return false
      }
      // Guru filter
      if (guruFilter && item.guru_nama !== guruFilter) {
        return false
      }
      return true
    })
  }, [state.submissions, search, guruFilter])

  return (
    <>
      {/* Header */}
      <div className="mb-4 text-sm font-medium text-text">Riwayat Setoran</div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama santri atau surah..."
          className="flex-1 rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
        />
        <select
          value={guruFilter}
          onChange={(e) => setGuruFilter(e.target.value)}
          className="rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary sm:w-56"
        >
          <option value="">Semua Guru</option>
          {guruOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div className="py-7 text-center text-[13px] text-text-muted">
          Belum ada setoran
        </div>
      )}

      {filtered.map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-card p-3.5 border border-border mb-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            {/* Kiri: nama, hafalan, catatan */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text truncate">
                {item.santri_nama}
              </div>
              <div className="text-[13px] text-text-secondary">
                {getSurahNama(item.surah_no)}
                {item.ayat_start != null && item.ayat_end != null && (
                  <span className="text-text-muted">
                    {' '}
                    : {item.ayat_start}
                    {item.ayat_end !== item.ayat_start
                      ? `\u2013${item.ayat_end}`
                      : ''}
                  </span>
                )}
              </div>
              {item.catatan && (
                <div className="mt-1.5 text-[12px] text-text-muted leading-relaxed">
                  {item.catatan}
                </div>
              )}
            </div>

            {/* Kanan: nilai, ustadz, tanggal */}
            <div className="mt-2 flex flex-row items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1">
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">
                {item.nilai}
              </span>
              {item.guru_nama && (
                <div className="text-[12px] text-text-secondary whitespace-nowrap">
                  {item.guru_nama}
                </div>
              )}
              <div className="text-[12px] text-text-muted whitespace-nowrap">
                {formatDate(item.tanggal)} &middot; {item.jam}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
