'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../../layout'
import { getSurahNama, formatWaktu } from '@/lib/helpers'
import type { SetoranItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Edit, Trash2 } from 'lucide-react'
import EditSubmissionModal from '@/components/EditSubmissionModal'
import { deleteSubmissionAction } from '@/lib/actions/submissions'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/ui/toast-wrapper'

const PAGE_SIZE = 20

export default function RiwayatSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelompokFilter, setKelompokFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [page, setPage] = useState(1)

  // Edit Submission state
  const [editingSubmission, setEditingSubmission] = useState<SetoranItem | null>(null)

  // Delete Submission state
  const [deleteTarget, setDeleteTarget] = useState<SetoranItem | null>(null)
  const { toast } = useToast()

  // Reset to page 1 when filters change
  function applyKelasFilter(val: string) { setKelasFilter(val); setKelompokFilter(''); setPage(1) }
  function applyKelompokFilter(val: string) { setKelompokFilter(val); setPage(1) }
  function applyGuruFilter(val: string) { setGuruFilter(val); setPage(1) }
  function applySearch(val: string) { setSearch(val); setPage(1) }

  function handleDelete(item: SetoranItem) {
    setDeleteTarget(item)
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    try {
      await deleteSubmissionAction(deleteTarget.id)
      setDeleteTarget(null)
      await refreshSubmissions()
      toast('Setoran berhasil dihapus!')
    } catch (e: any) {
      toast('Gagal menghapus setoran: ' + (e?.message || 'Unknown error'), 'error')
    }
  }

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

  // Options mapped for Combobox
  const kelasComboboxOptions = useMemo(() => {
    return [
      { id: '', label: 'Semua Kelas', searchText: 'semua kelas' },
      ...state.classes.map((c) => ({
        id: c.name,
        label: c.name,
        searchText: c.name,
      })),
    ]
  }, [state.classes])

  const kelompokComboboxOptions = useMemo(() => {
    return [
      { id: '', label: 'Semua Kelompok', searchText: 'semua kelompok' },
      ...kelompokOptions.map((g) => ({
        id: g.name,
        label: g.name,
        searchText: g.name,
      })),
    ]
  }, [kelompokOptions])

  const guruComboboxOptions = useMemo(() => {
    return [
      { id: '', label: 'Semua Guru', searchText: 'semua guru' },
      ...guruOptions.map((g) => ({
        id: g,
        label: g,
        searchText: g,
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Riwayat Setoran</h2>
        <p className="text-sm text-muted-foreground mt-1">Daftar riwayat setoran hafalan santri.</p>
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
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            options={kelasComboboxOptions}
            value={kelasFilter}
            onChange={applyKelasFilter}
            placeholder="Semua Kelas"
            searchPlaceholder="Cari kelas..."
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            options={kelompokComboboxOptions}
            value={kelompokFilter}
            onChange={applyKelompokFilter}
            placeholder="Semua Kelompok"
            searchPlaceholder="Cari kelompok..."
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Combobox
            options={guruComboboxOptions}
            value={guruFilter}
            onChange={applyGuruFilter}
            placeholder="Semua Guru"
            searchPlaceholder="Cari guru..."
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border border-border/50 border-dashed rounded-lg bg-card">
          Belum ada setoran
        </div>
      ) : (
        <div className="space-y-3">
          {pageItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-card p-4 border border-border/50 hover:shadow-md transition-all duration-200 bento-shadow flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              {/* Left: nama, hafalan, catatan */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[15px] font-bold text-foreground truncate">
                  {item.santri_nama}
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {getSurahNama(item.surah_no)}
                  {item.ayat_start != null && item.ayat_end != null && (
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      : {item.ayat_start}
                      {item.ayat_end !== item.ayat_start
                        ? `\u2013${item.ayat_end}`
                        : ''}
                    </span>
                  )}
                </div>
                {item.catatan && (
                  <div className="mt-2 text-xs text-muted-foreground leading-relaxed bg-card p-2 rounded-md border border-border/40 max-w-2xl">
                    {item.catatan}
                  </div>
                )}
              </div>

              {/* Right: nilai, ustadz, tanggal, edit */}
              <div className="mt-3 flex flex-row items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingSubmission(item)}
                    title="Edit Setoran"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(item)}
                    title="Hapus Setoran"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary animate-in fade-in">
                    {item.nilai}
                  </span>
                </div>
                {item.guru_nama && (
                  <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {item.guru_nama}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatWaktu(item.waktu).tanggal} &middot; {formatWaktu(item.waktu).jam}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            Sebelumnya
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === safePage ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPage(p)}
              className={`min-w-[32px] px-2 ${
                p !== safePage ? 'border border-transparent hover:border-border/50' : ''
              }`}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Edit Submission Modal */}
      <EditSubmissionModal
        submission={editingSubmission}
        isOpen={!!editingSubmission}
        onClose={() => setEditingSubmission(null)}
        onSuccess={refreshSubmissions}
      />
      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus Setoran?"
        description={`Hapus setoran ${deleteTarget ? getSurahNama(deleteTarget.surah_no) + ' oleh ' + deleteTarget.santri_nama : ''}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
