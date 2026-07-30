'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../../layout'
import { getSurahNama, formatWaktu } from '@/lib/helpers'
import type { SetoranItem } from '@/lib/types'
import { Combobox, Input, Badge, Pagination } from '@cloudflare/kumo'
import { Edit } from 'lucide-react'
import EditSubmissionModal from '@/components/EditSubmissionModal'

const PAGE_SIZE = 20

function nilaiBadgeVariant(nilai: string) {
  const norm = nilai.toLowerCase()
  if (norm.includes('mumtaz')) return 'success' as const
  if (norm.includes('jiddan')) return 'primary' as const
  if (norm.includes('jayyid')) return 'info' as const
  if (norm.includes('maqbul')) return 'warning' as const
  return 'error' as const
}

export default function RiwayatSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelompokFilter, setKelompokFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [page, setPage] = useState(1)

  // Edit Submission state
  const [editingSubmission, setEditingSubmission] = useState<SetoranItem | null>(null)

  // Reset to page 1 when filters change
  function applyKelasFilter(val: string) { setKelasFilter(val); setKelompokFilter(''); setPage(1) }
  function applyKelompokFilter(val: string) { setKelompokFilter(val); setPage(1) }
  function applyGuruFilter(val: string) { setGuruFilter(val); setPage(1) }
  function applySearch(val: string) { setSearch(val); setPage(1) }
  function handleKelasChange(item: { id: string; label: string } | null) { applyKelasFilter(item?.id ?? '') }
  function handleKelompokChange(item: { id: string; label: string } | null) { applyKelompokFilter(item?.id ?? '') }
  function handleGuruChange(item: { id: string; label: string } | null) { applyGuruFilter(item?.id ?? '') }

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

  // Items mapped for Kumo Combobox
  const kelasItems = useMemo(() => {
    return [
      { id: '', label: 'Semua Kelas' },
      ...state.classes.map((c) => ({
        id: c.name,
        label: c.name,
      })),
    ]
  }, [state.classes])

  const kelompokItems = useMemo(() => {
    return [
      { id: '', label: 'Semua Kelompok' },
      ...kelompokOptions.map((g) => ({
        id: g.name,
        label: g.name,
      })),
    ]
  }, [kelompokOptions])

  const guruItems = useMemo(() => {
    return [
      { id: '', label: 'Semua Guru' },
      ...guruOptions.map((g) => ({
        id: g,
        label: g,
      })),
    ]
  }, [guruOptions])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-text">Riwayat Setoran</h2>
        <p className="text-sm text-text-muted mt-1">Daftar riwayat setoran hafalan santri.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap items-center">
        <div className="relative w-full sm:min-w-0 sm:flex-[2]">
          <Input
            type="text"
            value={search}
            onChange={(e) => applySearch(e.target.value)}
            placeholder="Cari nama santri atau surah..."
            aria-label="Cari nama santri"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            items={kelasItems}
            value={kelasItems.find((i) => i.id === kelasFilter) || kelasItems[0]}
            onValueChange={handleKelasChange}
            itemToStringLabel={(item: { id: string; label: string }) => item.label}
          >
            <Combobox.TriggerInput placeholder="Semua Kelas" />
            <Combobox.Content>
              <Combobox.List>
                {(item: { id: string; label: string }) => <Combobox.Item value={item}>{item.label}</Combobox.Item>}
              </Combobox.List>
            </Combobox.Content>
          </Combobox>
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            items={kelompokItems}
            value={kelompokItems.find((i) => i.id === kelompokFilter) || kelompokItems[0]}
            onValueChange={handleKelompokChange}
            itemToStringLabel={(item: { id: string; label: string }) => item.label}
          >
            <Combobox.TriggerInput placeholder="Semua Kelompok" />
            <Combobox.Content>
              <Combobox.List>
                {(item: { id: string; label: string }) => <Combobox.Item value={item}>{item.label}</Combobox.Item>}
              </Combobox.List>
            </Combobox.Content>
          </Combobox>
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            items={guruItems}
            value={guruItems.find((i) => i.id === guruFilter) || guruItems[0]}
            onValueChange={handleGuruChange}
            itemToStringLabel={(item: { id: string; label: string }) => item.label}
          >
            <Combobox.TriggerInput placeholder="Semua Guru" />
            <Combobox.Content>
              <Combobox.List>
                {(item: { id: string; label: string }) => <Combobox.Item value={item}>{item.label}</Combobox.Item>}
              </Combobox.List>
            </Combobox.Content>
          </Combobox>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-text-muted border border-border/50 border-dashed rounded-lg bg-surface">
          Belum ada setoran
        </div>
      ) : (
        <div className="space-y-3">
          {pageItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-surface p-4 border border-border/50 hover:shadow-md transition-all duration-200 bento-shadow flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              {/* Left: nama, hafalan, catatan */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[15px] font-bold text-text truncate">
                  {item.santri_nama}
                </div>
                <div className="text-xs font-semibold text-text-secondary">
                  {getSurahNama(item.surah_no)}
                  {item.ayat_start != null && item.ayat_end != null && (
                    <span className="text-text-muted font-normal">
                      {' '}
                      : {item.ayat_start}
                      {item.ayat_end !== item.ayat_start
                        ? `\u2013${item.ayat_end}`
                        : ''}
                    </span>
                  )}
                </div>
                {item.catatan && (
                  <div className="mt-2 text-xs text-text-muted leading-relaxed bg-card p-2 rounded-md border border-border/40 max-w-2xl">
                    {item.catatan}
                  </div>
                )}
              </div>

              {/* Right: nilai, ustadz, tanggal, edit */}
              <div className="mt-3 flex flex-row items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSubmission(item)}
                    className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
                    title="Edit Setoran"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <Badge variant={nilaiBadgeVariant(item.nilai)}>{item.nilai}</Badge>
                </div>
                {item.guru_nama && (
                  <div className="text-xs font-medium text-text-secondary whitespace-nowrap">
                    {item.guru_nama}
                  </div>
                )}
                <div className="text-[11px] text-text-muted whitespace-nowrap">
                  {formatWaktu(item.waktu).tanggal} &middot; {formatWaktu(item.waktu).jam}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={safePage} setPage={setPage} totalCount={filtered.length} perPage={PAGE_SIZE}>
        <Pagination.Controls />
      </Pagination>

      {/* Edit Submission Modal */}
      <EditSubmissionModal
        submission={editingSubmission}
        isOpen={!!editingSubmission}
        onClose={() => setEditingSubmission(null)}
        onSuccess={refreshSubmissions}
      />
    </div>
  )
}
