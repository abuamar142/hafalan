'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../../layout'
import { getSurahNama, formatWaktu } from '@/lib/helpers'
import type { SetoranItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import {
  Edit,
  Trash2,
  History,
  Search,
  SearchX,
  Filter,
  User,
} from 'lucide-react'
import EditSubmissionModal from '@/components/EditSubmissionModal'
import { deleteSubmissionAction } from '@/lib/actions/submissions'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/ui/toast-wrapper'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function RiwayatSetoranPage() {
  const { state, refreshSubmissions } = useDashboard()
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelompokFilter, setKelompokFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [page, setPage] = useState(1)

  const [editingSubmission, setEditingSubmission] = useState<SetoranItem | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<SetoranItem | null>(null)
  const { toast } = useToast()

  function applyKelasFilter(val: string) {
    setKelasFilter(val)
    setKelompokFilter('')
    setPage(1)
  }
  function applyKelompokFilter(val: string) {
    setKelompokFilter(val)
    setPage(1)
  }
  function applyGuruFilter(val: string) {
    setGuruFilter(val)
    setPage(1)
  }
  function applySearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    try {
      await deleteSubmissionAction(deleteTarget.id)
      setDeleteTarget(null)
      await refreshSubmissions()
      toast('Setoran berhasil dihapus!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus setoran: ' + msg, 'error')
    }
  }

  const studentLookup = useMemo(() => {
    const map: Record<
      number,
      { group_id: number; group_name: string; class_name: string }
    > = {}
    for (const s of state.students) {
      map[s.id] = {
        group_id: s.group_id,
        group_name: s.group_name || '',
        class_name: s.class_name || '',
      }
    }
    return map
  }, [state.students])

  const guruOptions = useMemo(() => {
    const names = new Set(
      state.submissions.map((s: SetoranItem) => s.guru_nama).filter(Boolean)
    )
    return Array.from(names).sort()
  }, [state.submissions])

  const kelompokOptions = useMemo(() => {
    if (kelasFilter) {
      return state.groups.filter((g) => g.class_name === kelasFilter)
    }
    return state.groups
  }, [state.groups, kelasFilter])

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
      ...guruOptions.map((g) => ({ id: g, label: g, searchText: g })),
    ]
  }, [guruOptions])

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
  }, [
    state.submissions,
    search,
    kelasFilter,
    kelompokFilter,
    guruFilter,
    studentLookup,
  ])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  const hasActiveFilter = Boolean(
    search || kelasFilter || kelompokFilter || guruFilter
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Setoran"
        description={
          <span className="inline-flex items-center gap-1.5">
            <History className="size-3.5" />
            {filtered.length} setoran tercatat
          </span>
        }
        icon={<History />}
      />

      {/* Panel filter */}
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="size-3.5" />
          Filter &amp; Pencarian
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:min-w-0 sm:flex-[2]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Cari nama santri atau surah..."
              aria-label="Cari nama santri"
              className="h-10 pl-9"
            />
          </div>
          <div className="w-full shrink-0 sm:w-44">
            <Combobox
              options={kelasComboboxOptions}
              value={kelasFilter}
              onChange={applyKelasFilter}
              placeholder="Semua Kelas"
              searchPlaceholder="Cari kelas..."
            />
          </div>
          <div className="w-full shrink-0 sm:w-44">
            <Combobox
              options={kelompokComboboxOptions}
              value={kelompokFilter}
              onChange={applyKelompokFilter}
              placeholder="Semua Kelompok"
              searchPlaceholder="Cari kelompok..."
            />
          </div>
          <div className="w-full shrink-0 sm:w-44">
            <Combobox
              options={guruComboboxOptions}
              value={guruFilter}
              onChange={applyGuruFilter}
              placeholder="Semua Guru"
              searchPlaceholder="Cari guru..."
            />
          </div>
        </div>
      </div>

      {/* Daftar */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={hasActiveFilter ? <SearchX /> : <History />}
          title={hasActiveFilter ? 'Tidak ada hasil' : 'Belum ada setoran'}
          description={
            hasActiveFilter
              ? 'Coba ubah kata kunci atau filter Anda.'
              : 'Setoran yang Anda catat akan muncul di sini.'
          }
          action={
            hasActiveFilter ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setKelasFilter('')
                  setKelompokFilter('')
                  setGuruFilter('')
                  setPage(1)
                }}
              >
                Reset Filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((item) => {
              const info = studentLookup[item.santri_id]
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-all duration-200 hover:border-primary/30 hover:shadow-soft-lg sm:flex-row sm:items-start sm:justify-between"
                >
                  {/* Kiri: santri, surah, catatan */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-foreground">
                        {item.santri_nama}
                      </span>
                      {info?.class_name ? (
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/10 text-primary"
                        >
                          {info.class_name}
                        </Badge>
                      ) : null}
                      {info?.group_name ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {info.group_name}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-sm font-semibold text-muted-foreground">
                      {getSurahNama(item.surah_no)}
                      {item.ayat_start != null && item.ayat_end != null ? (
                        <span className="font-normal">
                          {' '}
                          : {item.ayat_start}
                          {item.ayat_end !== item.ayat_start
                            ? `–${item.ayat_end}`
                            : ''}
                        </span>
                      ) : null}
                    </div>

                    {item.catatan ? (
                      <div className="mt-2 max-w-2xl rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
                        {item.catatan}
                      </div>
                    ) : null}
                  </div>

                  {/* Kanan: nilai, guru, waktu, aksi */}
                  <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingSubmission(item)}
                        title="Edit Setoran"
                        aria-label="Edit setoran"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(item)}
                        title="Hapus Setoran"
                        aria-label="Hapus setoran"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 font-bold text-primary"
                      >
                        {item.nilai}
                      </Badge>
                    </div>
                    {item.guru_nama ? (
                      <div className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                        <User className="size-3" />
                        {item.guru_nama}
                      </div>
                    ) : null}
                    <div className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {formatWaktu(item.waktu).tanggal} ·{' '}
                      {formatWaktu(item.waktu).jam}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Sebelumnya
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safePage) <= 1
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1]
                  const gap = prev && p - prev > 1
                  return (
                    <span key={p} className="flex items-center gap-1.5">
                      {gap ? (
                        <span className="px-1 text-xs text-muted-foreground">
                          …
                        </span>
                      ) : null}
                      <Button
                        variant={p === safePage ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={cn(
                          'min-w-8 px-2',
                          p !== safePage && 'text-muted-foreground'
                        )}
                      >
                        {p}
                      </Button>
                    </span>
                  )
                })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          ) : null}
        </>
      )}

      <EditSubmissionModal
        submission={editingSubmission}
        isOpen={!!editingSubmission}
        onClose={() => setEditingSubmission(null)}
        onSuccess={refreshSubmissions}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus Setoran?"
        description={`Hapus setoran ${
          deleteTarget
            ? getSurahNama(deleteTarget.surah_no) +
              ' oleh ' +
              deleteTarget.santri_nama
            : ''
        }? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
