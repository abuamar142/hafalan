'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import {
  createClassAction,
  deleteClassAction,
  updateClassAction,
} from '@/lib/actions/classes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { useToast } from '@/components/ui/toast-wrapper'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Alert } from '@/components/app/alert'
import { Plus, Eye, Edit, Trash2, Layers, Search, SearchX } from 'lucide-react'
import { getPageNumbers } from '@/lib/pagination'

export default function KelasPage() {
  const { state, refreshClasses } = useDashboard()
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let items = state.classes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((c) => c.name?.toLowerCase().includes(q))
    }
    return items
  }, [state.classes, searchQuery])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  useEffect(() => setPage(1), [searchQuery])
  
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  
  const [selectedClass, setSelectedClass] = useState<typeof state.classes[number] | null>(null)
  
  const [className, setClassName] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  // Groups that do not belong to any class yet (unassigned)
  const unassignedGroups = state.groups.filter((g) => !g.class_id)

  // Groups currently assigned to the selected class (used when editing)
  const currentClassGroups = selectedClass
    ? state.groups.filter((g) => g.class_id === selectedClass.id)
    : []

  // Combined list of groups visible in the modal checkboxes
  const visibleGroupsForAdd = unassignedGroups
  const visibleGroupsForEdit = [
    ...currentClassGroups,
    ...unassignedGroups,
  ]

  function openAddModal() {
    setError('')
    setClassName('')
    setSelectedGroupIds([])
    setAddOpen(true)
  }

  function openEditModal(c: typeof state.classes[number]) {
    setError('')
    setSelectedClass(c)
    setClassName(c.name)
    // Pre-select group IDs currently in this class
    const currentGroupIds = state.groups
      .filter((g) => g.class_id === c.id)
      .map((g) => g.id)
    setSelectedGroupIds(currentGroupIds)
    setEditOpen(true)
  }

  function openDetailModal(c: typeof state.classes[number]) {
    setSelectedClass(c)
    setDetailOpen(true)
  }

  async function handleAddClass() {
    if (!className.trim()) {
      setError('Nama kelas wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('name', className.trim())
      formData.append('groupIds', selectedGroupIds.join(','))
      await createClassAction(formData)
      setAddOpen(false)
      await refreshClasses()
      toast('Kelas berhasil ditambahkan!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal membuat kelas: ' + msg)
      toast('Gagal membuat kelas: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditClass() {
    if (!selectedClass) return
    if (!className.trim()) {
      setError('Nama kelas wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateClassAction(selectedClass.id, className.trim(), selectedGroupIds)
      setEditOpen(false)
      await refreshClasses()
      toast('Kelas berhasil diperbarui!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui kelas: ' + msg)
      toast('Gagal memperbarui kelas: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClass(id: number, name: string) {
    setDeleteTarget({ id, name })
  }

  async function handleDeleteClassConfirmed() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteClassAction(deleteTarget.id)
      setDeleteTarget(null)
      await refreshClasses()
      toast('Kelas berhasil dihapus!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus kelas: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleGroupSelection(groupId: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  return (
    <div className="max-w-6xl pb-10">
      <PageHeader
        title="Manajemen Kelas"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" />
            {state.classes.length} kelas terdaftar
          </span>
        }
        icon={<Layers />}
        actions={
          <Button onClick={openAddModal} disabled={saving} className="gap-2">
            <Plus className="size-4" />
            Tambah Kelas
          </Button>
        }
      />

      {/* Pencarian */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kelas..."
          aria-label="Cari kelas"
          className="h-10 pl-9"
        />
      </div>

      {/* Main Table */}
      {state.classes.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="Belum ada kelas"
          description="Tambahkan kelas pertama untuk mengelompokkan halaqah."
          action={
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="size-4" />
              Tambah Kelas
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Tidak ada hasil"
          description={`Tidak ada kelas yang cocok dengan "${searchQuery}".`}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">No</TableHead>
                <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nama Kelas</TableHead>
                <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kelompok di Dalamnya</TableHead>
                <TableHead className="w-40 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30 text-sm">
              {paginated.map((c, index) => {
                const groups = state.groups.filter((g) => g.class_id === c.id)
                return (
                  <TableRow key={c.id} className="hover:bg-card/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-center font-medium text-muted-foreground">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-semibold text-foreground">
                      {c.name}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {groups.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Tidak ada kelompok</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {groups.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDetailModal(c)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Detail"
                          aria-label="Lihat detail kelas"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(c)}
                          className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          title="Edit"
                          aria-label="Edit kelas"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Hapus"
                          aria-label="Hapus kelas"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1) }}
                    className={page === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === 'ellipsis' ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); setPage(p) }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1) }}
                    className={page === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kelas Baru</DialogTitle>
          </DialogHeader>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Kelas <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Misal: Kelas VII A, Kelas VIII B"
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pilih Kelompok Halaqah
              </label>
              {visibleGroupsForAdd.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-border">
                  Semua kelompok sudah terdistribusi ke kelas lain. Buat kelompok baru terlebih dahulu jika diperlukan.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                  {visibleGroupsForAdd.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => toggleGroupSelection(g.id)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleAddClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kelas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
          </DialogHeader>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Kelas <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Misal: Kelas VII A"
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pilih Kelompok Halaqah
              </label>
              {visibleGroupsForEdit.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-border">
                  Tidak ada kelompok yang tersedia.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                  {visibleGroupsForEdit.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => toggleGroupSelection(g.id)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleEditClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Kelas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Kelas</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Kelas</label>
                  <div className="text-base font-bold text-foreground mt-0.5">{selectedClass.name}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal Dibuat</label>
                  <div className="text-sm font-medium text-muted-foreground mt-0.5">
                    {new Date(selectedClass.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Daftar Kelompok Halaqah
                </label>
                {state.groups.filter((g) => g.class_id === selectedClass.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-border">
                    Tidak ada kelompok di dalam kelas ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {state.groups
                      .filter((g) => g.class_id === selectedClass.id)
                      .map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-muted-foreground"
                        >
                          <Layers className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{g.name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setDetailOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus Kelas?"
        description={`Hapus kelas "${deleteTarget?.name}"? Kelompok di dalamnya akan kembali menjadi "Tanpa Kelas".`}
        confirmText="Hapus"
        onConfirm={handleDeleteClassConfirmed}
      />
    </div>
  )
}