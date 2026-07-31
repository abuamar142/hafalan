'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
} from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/client'
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
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/toast-wrapper'
import { Plus, Eye, Edit, Trash2, User, Search } from 'lucide-react'
import { getPageNumbers } from '@/lib/pagination'

export default function KelompokPage() {
  const { state, refreshClasses } = useDashboard()
  const { toast } = useToast()

  const classOptions = useMemo(() => {
    return [
      { id: '', label: 'Tanpa Kelas (Unassigned)', searchText: 'tanpa kelas' },
      ...state.classes.map((c) => ({
        id: c.id,
        label: c.name,
        searchText: c.name,
      })),
    ]
  }, [state.classes])

  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let items = state.groups
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((group) => group.name?.toLowerCase().includes(q))
    }
    return items
  }, [state.groups, searchQuery])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  useEffect(() => setPage(1), [searchQuery])
  
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const [selectedGroup, setSelectedGroup] = useState<typeof state.groups[number] | null>(null)
  
  const [groupName, setGroupName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [allTeachers, setAllTeachers] = useState<Record<string, string>>({})

  // Load all teachers/gurus
  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('get_all_teachers').then(({ data }) => {
      const map: Record<string, string> = {}
      for (const t of (data as Array<{user_id: string, name: string}> | null) ?? []) {
        map[t.user_id] = t.name
      }
      setAllTeachers(map)
    })
  }, [])

  function openAddModal() {
    setError('')
    setGroupName('')
    setAddOpen(true)
  }

  function openEditModal(g: typeof state.groups[number]) {
    setError('')
    setSelectedGroup(g)
    setGroupName(g.name)
    setSelectedClassId(g.class_id)
    
    // Fetch currently assigned teacher IDs
    const currentTeacherIds = state.groupTeachers
      .filter((gt) => gt.group_id === g.id)
      .map((gt) => gt.teacher_id)
    setSelectedTeacherIds(currentTeacherIds)
    
    setEditOpen(true)
  }

  function openDetailModal(g: typeof state.groups[number]) {
    setSelectedGroup(g)
    setDetailOpen(true)
  }

  async function handleAddGroup() {
    if (!groupName.trim()) {
      setError('Nama kelompok wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('name', groupName.trim())
      await createGroupAction(formData)
      setGroupName('')
      setAddOpen(false)
      await refreshClasses()
      toast('Kelompok berhasil ditambahkan!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal membuat kelompok: ' + msg)
      toast('Gagal membuat kelompok: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditGroup() {
    if (!selectedGroup) return
    if (!groupName.trim()) {
      setError('Nama kelompok wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateGroupAction(selectedGroup.id, groupName.trim(), selectedClassId, selectedTeacherIds)
      setEditOpen(false)
      await refreshClasses()
      toast('Kelompok berhasil diperbarui!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui kelompok: ' + msg)
      toast('Gagal memperbarui kelompok: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteGroup(id: number, name: string) {
    setDeleteTarget({ id, name })
  }

  async function handleDeleteGroupConfirmed() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteGroupAction(deleteTarget.id)
      setDeleteTarget(null)
      await refreshClasses()
      toast('Kelompok berhasil dihapus!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus kelompok: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleTeacherSelection(teacherId: string) {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  return (
    <div className="max-w-6xl pb-10">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Kelompok</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kelompok halaqah, asosiasi kelas, dan penugasan ustadz pengampu.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="gap-2 shadow-sm"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          Tambah Kelompok
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kelompok..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Main Table */}
      {state.groups.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border-dashed">
          Belum ada kelompok yang didaftarkan.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border-dashed">
          Tidak ada kelompok yang sesuai dengan pencarian.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-card/50 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                <TableHead className="py-3.5 px-4 w-16 text-center">No</TableHead>
                <TableHead className="py-3.5 px-4">Nama Kelompok</TableHead>
                <TableHead className="py-3.5 px-4">Kelas</TableHead>
                <TableHead className="py-3.5 px-4">Ustadz Pengampu</TableHead>
                <TableHead className="py-3.5 px-4 w-44 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30 text-sm">
              {paginated.map((group, index) => {
                const assignedTeachers = state.groupTeachers.filter(
                  (gt) => gt.group_id === group.id
                )
                const className = group.class_name || state.classes.find(c => c.id === group.class_id)?.name || 'Tanpa Kelas'

                return (
                  <TableRow key={group.id} className="hover:bg-card/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-center font-medium text-muted-foreground">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground font-medium">
                      {className !== 'Tanpa Kelas' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {className}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{className}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {assignedTeachers.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Belum ditugaskan</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedTeachers.map((gt) => {
                            const name = allTeachers[gt.teacher_id] || 'Ustadz'
                            return (
                              <span
                                key={gt.id}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-background border border-border/50 text-xs font-medium text-muted-foreground"
                              >
                                {name}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailModal(group)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(group)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

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
            <DialogTitle>Buat Kelompok Baru</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-destructive bg-destructive/10 px-3 py-2.5 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Kelompok / Halaqah <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Misal: Halaqah Abu Bakar, Kelompok A"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleAddGroup} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kelompok'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelompok</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-destructive bg-destructive/10 px-3 py-2.5 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          {selectedGroup && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nama Kelompok <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Misal: Halaqah Abu Bakar"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="edit-class-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kelas
                </label>
                <Combobox
                  id="edit-class-select"
                  options={classOptions}
                  value={selectedClassId === null ? '' : selectedClassId}
                  onChange={(val) => setSelectedClassId(val === '' ? null : Number(val))}
                  placeholder="Pilih Kelas..."
                  searchPlaceholder="Cari kelas..."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pilih Ustadz Pengampu
                </label>
                {Object.keys(allTeachers).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-border">
                    Tidak ada guru terdaftar.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                    {Object.entries(allTeachers).map(([tid, name]) => (
                      <label
                        key={tid}
                        className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeacherIds.includes(tid)}
                          onChange={() => toggleTeacherSelection(tid)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleEditGroup} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Kelompok'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Kelompok</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Kelompok</label>
                  <div className="text-base font-bold text-foreground mt-0.5">{selectedGroup.name}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kelas</label>
                  <div className="text-sm font-semibold text-primary mt-0.5">
                    {selectedGroup.class_name || state.classes.find(c => c.id === selectedGroup.class_id)?.name || (
                      <span className="text-muted-foreground font-normal italic">Tanpa Kelas</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal Dibuat</label>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">
                    {new Date(selectedGroup.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Ustadz Pengampu
                </label>
                {state.groupTeachers.filter((gt) => gt.group_id === selectedGroup.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-border">
                    Belum ada ustadz ditugaskan ke kelompok ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {state.groupTeachers
                      .filter((gt) => gt.group_id === selectedGroup.id)
                      .map((gt) => {
                        const name = allTeachers[gt.teacher_id] || 'Ustadz'
                        return (
                          <div
                            key={gt.id}
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-muted-foreground"
                          >
                            <User className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{name}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus Kelompok?"
        description={`Hapus kelompok "${deleteTarget?.name}"? Semua siswa di dalamnya akan kehilangan kelompok.`}
        confirmText="Hapus"
        onConfirm={handleDeleteGroupConfirmed}
      />
    </div>
  )
}