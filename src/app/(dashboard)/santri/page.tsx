'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import { addStudentAction, deleteStudentAction, updateStudentAction } from '@/lib/actions/students'
import { toggleMemorizationAction } from '@/lib/actions/memorization'
import {
  getPct,
  getJuzSurahs,
  getJuzSurahsFromHafalan,
  getJuzSelesaiFromHafalan,
  getSurahNama,
  formatWaktu,
} from '@/lib/helpers'
import { toggleSurahCycle } from '@/lib/domain/hafalan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/Toast'
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Layers,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Circle,
  FileText,
  Search,
} from 'lucide-react'

export default function SantriPage() {
  const { state, refreshStudents, getStudentMemorization } = useDashboard()
  const { toast } = useToast()

  const groupOptions = useMemo(() => {
    return state.groups.map((g) => {
      const cName = state.classes.find(c => c.id === g.class_id)?.name || 'Tanpa Kelas'
      return {
        id: g.id,
        label: `${g.name} (${cName})`,
        searchText: `${g.name} ${cName}`,
      }
    })
  }, [state.groups, state.classes])

  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let items = state.students
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((s) => s.nama?.toLowerCase().includes(q))
    }
    return items
  }, [state.students, searchQuery])

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

  const [selectedStudent, setSelectedStudent] = useState<typeof state.students[number] | null>(null)
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)

  const [nama, setNama] = useState('')
  const [groupId, setGroupId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')

  // Selected student's client-side computations
  const { hafalan, studentSubmissions, juzPcts, juzSelesai, hafalCount, pct } = useMemo(() => {
    if (!selectedStudent) {
      return {
        hafalan: {} as Record<number, number>,
        studentSubmissions: [],
        juzPcts: [],
        juzSelesai: 0,
        hafalCount: 0,
        pct: 0,
      }
    }
    const memos = getStudentMemorization(selectedStudent.id)
    const map: Record<number, number> = {}
    memos.forEach((m) => {
      map[m.surah_no] = m.status
    })

    const subs = state.submissions
      .filter((s) => s.santri_id === selectedStudent.id)
      .sort((a, b) => b.id - a.id)

    const pcts = [...Array(30)].map((_, i) => getJuzSurahsFromHafalan(map, i + 1))
    const selesai = getJuzSelesaiFromHafalan(map)
    const count = Object.values(map).filter((v) => v === 1).length
    const p = getPct(selectedStudent)

    return {
      hafalan: map,
      studentSubmissions: subs,
      juzPcts: pcts,
      juzSelesai: selesai,
      hafalCount: count,
      pct: p,
    }
  }, [selectedStudent, state.submissions, getStudentMemorization])

  function openAddModal() {
    setError('')
    setNama('')
    setGroupId('')
    setAddOpen(true)
  }

  function openEditModal(s: typeof state.students[number]) {
    setError('')
    setSelectedStudent(s)
    setNama(s.nama)
    setGroupId(String(s.group_id))
    setEditOpen(true)
  }

  function openDetailModal(s: typeof state.students[number]) {
    setSelectedStudent(s)
    setSelectedJuz(null)
    setDetailOpen(true)
  }

  async function handleAdd() {
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    if (!groupId) {
      setError('Kelompok wajib dipilih')
      return
    }
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('nama', nama.trim())
      formData.append('groupId', groupId)
      await addStudentAction(formData)
      setNama('')
      setGroupId('')
      setAddOpen(false)
      await refreshStudents()
      toast('Siswa berhasil ditambahkan!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal menyimpan: ' + msg)
      toast('Gagal menambahkan siswa: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!selectedStudent) return
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    if (!groupId) {
      setError('Kelompok wajib dipilih')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateStudentAction(selectedStudent.id, nama.trim(), Number(groupId))
      setEditOpen(false)
      await refreshStudents()
      toast('Siswa berhasil diperbarui!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui: ' + msg)
      toast('Gagal memperbarui siswa: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: number, name: string) {
    setDeleteTarget({ id, name })
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteStudentAction(deleteTarget.id)
      setDeleteTarget(null)
      await refreshStudents()
      toast('Siswa berhasil dihapus!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal menghapus siswa: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleSurah(surahNo: number) {
    if (toggling || !selectedStudent) return
    setToggling(true)
    try {
      const current = hafalan[surahNo] || 0
      const next = toggleSurahCycle(current)
      await toggleMemorizationAction(selectedStudent.id, surahNo, next)
      await refreshStudents()
      toast('Status hafalan berhasil diperbarui!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast('Gagal memperbarui status hafalan: ' + msg, 'error')
    } finally {
      setToggling(false)
    }
  }

  // Details components
  const juzSurahs = selectedJuz ? getJuzSurahs(selectedJuz) : []
  const juzHafalCount = selectedJuz
    ? juzSurahs.filter((s) => hafalan[s.no] === 1).length
    : 0

  function getPageNumbers(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)

    if (page > 3) pages.push('ellipsis')

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) pages.push('ellipsis')

    pages.push(totalPages)

    return pages
  }

  return (
    <div className="max-w-6xl pb-10">
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Siswa</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {state.students.length} siswa terdaftar
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="gap-2 shadow-sm"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari siswa..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Main Table */}
      {state.students.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border-dashed">
          Belum ada siswa yang didaftarkan.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border-dashed">
          Tidak ada siswa yang sesuai dengan pencarian.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-card/50 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                <TableHead className="py-3.5 px-4 w-16 text-center">No</TableHead>
                <TableHead className="py-3.5 px-4">Nama Siswa</TableHead>
                <TableHead className="py-3.5 px-4">Kelompok</TableHead>
                <TableHead className="py-3.5 px-4">Kelas</TableHead>
                <TableHead className="py-3.5 px-4 text-center">Progress</TableHead>
                <TableHead className="py-3.5 px-4 w-44 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30 text-sm">
              {paginated.map((s, index) => {
                const group = state.groups.find((g) => g.id === s.group_id)
                const groupName = group?.name || 'Tanpa Kelompok'
                const className = group ? (state.classes.find(c => c.id === group.class_id)?.name || 'Tanpa Kelas') : 'Tanpa Kelas'
                const p = getPct(s)

                return (
                  <TableRow key={s.id} className="hover:bg-card/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-center font-medium text-muted-foreground">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{s.nama}</span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground font-medium">
                      {groupName !== 'Tanpa Kelompok' ? (
                        <Badge variant="secondary" className="gap-1.5 font-medium">
                          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                          {groupName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{groupName}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground font-medium">
                      {className !== 'Tanpa Kelas' ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                          {className}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{className}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-3 max-w-[120px] mx-auto">
                        <span className="text-xs font-bold text-muted-foreground w-9 text-right">{p}%</span>
                        <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailModal(s)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg"
                          title="Progres Hafalan"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(s)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id, s.nama)}
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
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) setPage(page - 1) }}
                    className={page === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>
                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); setPage(p) }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) setPage(page + 1) }}
                    className={page === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Siswa Baru</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-destructive bg-destructive/10 px-3 py-2.5 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="add-group-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kelompok Halaqah <span className="text-destructive">*</span>
              </label>
              <Combobox
                id="add-group-select"
                options={groupOptions}
                value={groupId}
                onChange={setGroupId}
                placeholder="Pilih Kelompok..."
                searchPlaceholder="Cari kelompok..."
                emptyText="Kelompok tidak ditemukan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Siswa</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-destructive bg-destructive/10 px-3 py-2.5 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="edit-group-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kelompok Halaqah <span className="text-destructive">*</span>
              </label>
              <Combobox
                id="edit-group-select"
                options={groupOptions}
                value={groupId}
                onChange={setGroupId}
                placeholder="Pilih Kelompok..."
                searchPlaceholder="Cari kelompok..."
                emptyText="Kelompok tidak ditemukan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Detail Modal (with Juz Grid and Setoran History) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail & Progres Siswa</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Header info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-lg border border-border/50">
                <div className="min-w-0 text-center sm:text-left">
                  <h4 className="text-lg font-bold text-foreground">{selectedStudent.nama}</h4>
                  <div className="text-xs text-muted-foreground mt-1 font-medium flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
                    <span className="bg-card px-2 py-0.5 rounded border border-border/50">
                      {state.groups.find(g => g.id === selectedStudent.group_id)?.name || 'Tanpa Kelompok'}
                    </span>
                    <span>•</span>
                    <span>
                      {(() => {
                        const group = state.groups.find(g => g.id === selectedStudent.group_id)
                        return group ? (state.classes.find(c => c.id === group.class_id)?.name || 'Tanpa Kelas') : 'Tanpa Kelas'
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 bg-card px-4 py-2.5 rounded-lg border border-border/40 shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-bold text-foreground">{hafalCount}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Surah</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-foreground">{juzSelesai}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Juz Selesai</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-primary">{pct}%</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progress</div>
                  </div>
                </div>
              </div>

              {/* Layout with Juz on Left and History on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Juz Grid Column */}
                <div className="lg:col-span-3 space-y-4">
                  {selectedJuz ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center gap-3 border-b border-border/30 pb-3">
                        <Button variant="outline" size="sm" onClick={() => setSelectedJuz(null)} className="h-8 px-2">
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                          <h5 className="font-bold text-foreground text-sm">Juz {selectedJuz}</h5>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            {juzHafalCount} dari {juzSurahs.length} surah dihafal
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {juzSurahs.map((s) => {
                          const status = hafalan[s.no] || 0
                          return (
                            <button
                              key={s.no}
                              onClick={() => toggleSurah(s.no)}
                              disabled={toggling}
                              className="group flex w-full items-center gap-3 rounded-lg p-2 text-left border border-transparent hover:bg-card hover:border-border/40 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                status === 1 ? 'bg-primary/10 text-primary border border-primary/20' : 
                                status === 2 ? 'bg-accent/10 text-accent border border-accent/20' : 
                                'bg-background text-muted-foreground border border-border group-hover:border-border-hover'
                              }`}>
                                {status === 1 ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : status === 2 ? (
                                  <RotateCcw className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4 opacity-40" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-foreground truncate">{s.no}. {s.nama}</div>
                                <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{s.ayat} ayat</div>
                              </div>
                              
                              <div className="shrink-0 text-sm text-muted-foreground font-arabic pr-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                {s.arab}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-foreground text-sm">Pencapaian Juz</h5>
                        <span className="text-[10px] font-semibold text-muted-foreground">Pilih Juz untuk detail</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[...Array(30)].map((_, i) => {
                          const j = i + 1
                           const p = juzPcts[i] ?? 0
                          return (
                            <button
                              key={j}
                              onClick={() => setSelectedJuz(j)}
                              className={`group relative flex flex-col items-center justify-center rounded-lg p-2 text-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                p === 100
                                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                  : p > 0
                                    ? 'bg-accent/10 text-accent border border-accent/20'
                                    : 'bg-card border border-border text-muted-foreground'
                              }`}
                            >
                              <div className="text-[13px] font-bold">{j}</div>
                              {p > 0 && p < 100 && (
                                <div className="text-[8px] font-bold mt-0.5 bg-accent/20 px-1 py-0.2 rounded text-accent-dark">{p}%</div>
                              )}
                              {p === 100 && (
                                <div className="absolute top-0.5 right-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-white/70" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* History Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <h5 className="font-bold text-foreground text-sm">Riwayat Setoran</h5>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {studentSubmissions.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground italic border border-dashed border-border/50 bg-background rounded-lg">
                        Belum ada setoran dicatat
                      </div>
                    ) : (
                      studentSubmissions.map((sub) => (
                        <div key={sub.id} className="bg-card rounded-lg p-3 border border-border/50 text-[13px] relative overflow-hidden flex">
                          <div className="w-1 bg-primary/20 mr-2.5 shrink-0 rounded-full"></div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-foreground truncate">
                                {getSurahNama(sub.surah_no)}
                                {sub.ayat_start && sub.ayat_end ? (
                                  <span className="text-muted-foreground font-semibold ml-1">
                                    :{sub.ayat_start}{sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}
                                  </span>
                                ) : null}
                              </span>
                              <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                {sub.nilai}
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-muted-foreground font-medium">
                              {formatWaktu(sub.waktu).tanggal} · {formatWaktu(sub.waktu).jam}
                            </div>

                            {sub.catatan && (
                              <div className="text-xs text-muted-foreground bg-background rounded p-1.5 border border-border/40 mt-1 truncate">
                                {sub.catatan}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus Siswa?"
        description={`Hapus siswa "${deleteTarget?.name}"? Semua riwayat setoran & hafalan akan dihapus permanen.`}
        confirmText="Hapus"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}