'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../../layout'
import { getSurahNama, formatWaktu } from '@/lib/helpers'
import type { SetoranItem } from '@/lib/types'

const PAGE_SIZE = 20

export default function RiwayatSetoranPage() {
  const { state } = useDashboard()
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelompokFilter, setKelompokFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [page, setPage] = useState(1)

  // Reset to page 1 when filters change
  function applyKelasFilter(val: string) { setKelasFilter(val); setKelompokFilter(''); setPage(1) }
  function applyKelompokFilter(val: string) { setKelompokFilter(val); setPage(1) }
  function applyGuruFilter(val: string) { setGuruFilter(val); setPage(1) }
  function applySearch(val: string) { setSearch(val); setPage(1) }

  // Map santri_id -> { group_id, group_name, class_name }
  const studentLookup = useMemo(() => {
    const map: Record<number, { group_id: number; group_name: string; class_name: string }> = {}
    for (const s of state.students) {
      map[s.id] = {
        group_id: s.group_id,
        group_name: s.group_name || '',
        class_name: s.class_name || '',
      }
    }
    return map
  }, [state.students])

  // Unique guru_nama values from submissions
  const guruOptions = useMemo(() => {
    const names = new Set(
      state.submissions.map((s: SetoranItem) => s.guru_nama).filter(Boolean)
    )
    return Array.from(names).sort()
  }, [state.submissions])

  // Kelompok options filtered by selected kelas
  const kelompokOptions = useMemo(() => {
    if (kelasFilter) {
      return state.groups.filter((g) => g.class_name === kelasFilter)
    }
    return state.groups
  }, [state.groups, kelasFilter])

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return state.submissions.filter((item: SetoranItem) => {
      if (q) {
        const surahName = getSurahNama(item.surah_no).toLowerCase()
        const match =
          item.santri_nama.toLowerCase().includes(q) ||
          surahName.includes(q)
        if (!match) return false
      }
      if (kelasFilter) {
        const info = studentLookup[item.santri_id]
        if (!info || info.class_name !== kelasFilter) return false
      }
      if (kelompokFilter) {
        const info = studentLookup[item.santri_id]
        if (!info || info.group_name !== kelompokFilter) return false
      }
      if (guruFilter && item.guru_nama !== guruFilter) return false
      return true
    })
  }, [state.submissions, search, kelasFilter, kelompokFilter, guruFilter, studentLookup])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      {/* Header */}
      <div className="mb-4 text-sm font-medium text-text">Riwayat Setoran</div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => applySearch(e.target.value)}
          placeholder="Cari nama santri atau surah..."
          aria-label="Cari nama santri"
          className="min-w-0 flex-[2] rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
        />
        <select
          value={kelasFilter}
          onChange={(e) => applyKelasFilter(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary sm:w-44"
        >
          <option value="">Semua Kelas</option>
          {state.classes.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={kelompokFilter}
          onChange={(e) => applyKelompokFilter(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary sm:w-44"
        >
          <option value="">Semua Kelompok</option>
          {kelompokOptions.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={guruFilter}
          onChange={(e) => applyGuruFilter(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary sm:w-40"
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

      {pageItems.map((item) => (
        <div
          key={item.id}
          className="rounded-md bg-card p-3.5 border border-border mb-2"
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
                {formatWaktu(item.waktu).tanggal} &middot; {formatWaktu(item.waktu).jam}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-secondary hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[32px] rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                p === safePage
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-border'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-secondary hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </>
  )
}
