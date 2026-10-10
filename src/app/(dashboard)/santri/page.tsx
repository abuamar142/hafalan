'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import {
  addStudentAction,
  deleteStudentAction,
  updateStudentAction,
} from '@/lib/actions/students'
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
import { getPageNumbers } from '@/lib/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/toast-wrapper'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { ProgressBar } from '@/components/app/progress-bar'
import { Alert } from '@/components/app/alert'
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
  SearchX,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SantriPage() {
  const { state, refreshStudents, getStudentMemorization } = useDashboard()
  const { toast } = useToast()

  const groupOptions = useMemo(() => {
    return state.groups.map((g) => {
      const cName =
        state.classes.find((c) => c.id === g.class_id)?.name || 'Tanpa Kelas'
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
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    name: string
  } | null>(null)

  const [selectedStudent, setSelectedStudent] = useState<
    (typeof state.students)[number] | null
  >(null)
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)

  const [nama, setNama] = useState('')
  const [groupId, setGroupId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')

  // Perhitungan sisi klien untuk santri terpilih
  const { hafalan, studentSubmissions, juzPcts, juzSelesai, hafalCount, pct } =
    useMemo(() => {
      if (!selectedStudent) {
        return {
          hafalan: {} as Record<number, number>,
          studentSubmissions: [],
          juzPcts: [] as number[],
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

      const pcts = [...Array(30)].map((_, i) =>
        getJuzSurahsFromHafalan(map, i + 1)
      )
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

  function openEditModal(s: (typeof state.students)[number]) {
    setError('')
    setSelectedStudent(s)
    setNama(s.nama)
    setGroupId(String(s.group_id))
    setEditOpen(true)
  }

  function openDetailModal(s: (typeof state.students)[number]) {
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

  const juzSurahs = selectedJuz ? getJuzSurahs(selectedJuz) : []
  const juzHafalCount = selectedJuz
    ? juzSurahs.filter((s) => hafalan[s.no] === 1).length
    : 0

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Manajemen Siswa"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {state.students.length} siswa terdaftar
          </span>
        }
        icon={<Users />}
        actions={
          <Button onClick={openAddModal} disabled={saving} className="gap-2">
            <Plus className="size-4" />
            Tambah Siswa
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
          placeholder="Cari siswa..."
          className="h-10 pl-9"
          aria-label="Cari siswa"
        />
      </div>

      {/* Tabel utama */}
      {state.students.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Belum ada siswa"
          description="Tambahkan siswa pertama untuk mulai mencatat hafalan dan setoran."
          action={
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="size-4" />
              Tambah Siswa
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Tidak ada hasil"
          description={`Tidak ada siswa yang cocok dengan "${searchQuery}".`}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    No
                  </TableHead>
                  <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nama Siswa
                  </TableHead>
                  <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kelompok
                  </TableHead>
                  <TableHead className="hidden py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Kelas
                  </TableHead>
                  <TableHead className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Progress
                  </TableHead>
                  <TableHead className="w-40 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50 text-sm">
                {paginated.map((s, index) => {
                  const group = state.groups.find((g) => g.id === s.group_id)
                  const groupName = group?.name || 'Tanpa Kelompok'
                  const className = group
                    ? state.classes.find((c) => c.id === group.class_id)?.name ||
                      'Tanpa Kelas'
                    : 'Tanpa Kelas'
                  const p = getPct(s)

                  return (
                    <TableRow
                      key={s.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="py-3 text-center font-medium text-muted-foreground">
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-foreground">
                        {s.nama}
                      </TableCell>
                      <TableCell className="py-3">
                        {groupName !== 'Tanpa Kelompok' ? (
                          <Badge variant="secondary" className="gap-1.5">
                            <Layers className="size-3 shrink-0 text-primary" />
                            {groupName}
                          </Badge>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            {groupName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden py-3 md:table-cell">
                        {className !== 'Tanpa Kelas' ? (
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/10 font-semibold text-primary"
                          >
                            {className}
                          </Badge>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            {className}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="mx-auto flex max-w-[130px] items-center gap-2.5">
                          <ProgressBar value={p} size="sm" />
                          <span className="tabular w-9 shrink-0 text-right text-[11px] font-bold text-muted-foreground">
                            {p}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDetailModal(s)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Progres Hafalan"
                            aria-label={`Lihat progres ${s.nama}`}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(s)}
                            className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            title="Edit"
                            aria-label={`Edit ${s.nama}`}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(s.id, s.nama)}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus"
                            aria-label={`Hapus ${s.nama}`}
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

          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      if (page > 1) setPage(page - 1)
                    }}
                    className={
                      page === 1
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
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
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault()
                          setPage(p)
                        }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      if (page < totalPages) setPage(page + 1)
                    }}
                    className={
                      page === totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}

      {/* Dialog tambah */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Siswa Baru</DialogTitle>
          </DialogHeader>
          {error ? (
            <Alert variant="error" className="mb-2">
              {error}
            </Alert>
          ) : null}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
            <div className="space-y-1.5">
              <label
                htmlFor="add-group-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
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
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Siswa</DialogTitle>
          </DialogHeader>
          {error ? (
            <Alert variant="error" className="mb-2">
              {error}
            </Alert>
          ) : null}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
            <div className="space-y-1.5">
              <label
                htmlFor="edit-group-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
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
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detail &amp; Progres Siswa</DialogTitle>
          </DialogHeader>
          {selectedStudent ? (
            <div className="space-y-5">
              {/* Ringkasan */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-lg font-bold text-foreground">
                    {selectedStudent.nama}
                  </h4>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground sm:justify-start">
                    <span className="rounded-md border border-border/60 bg-card px-2 py-0.5">
                      {state.groups.find(
                        (g) => g.id === selectedStudent.group_id
                      )?.name || 'Tanpa Kelompok'}
                    </span>
                    <span>
                      {(() => {
                        const group = state.groups.find(
                          (g) => g.id === selectedStudent.group_id
                        )
                        return group
                          ? state.classes.find((c) => c.id === group.class_id)
                              ?.name || 'Tanpa Kelas'
                          : 'Tanpa Kelas'
                      })()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Surah', value: hafalCount, tone: 'text-foreground' },
                    {
                      label: 'Juz Selesai',
                      value: juzSelesai,
                      tone: 'text-foreground',
                    },
                    { label: 'Progress', value: `${pct}%`, tone: 'text-primary' },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center"
                    >
                      <div
                        className={cn(
                          'tabular text-lg font-bold',
                          m.tone
                        )}
                      >
                        {m.value}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid juz + riwayat */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                {/* Kolom juz */}
                <div className="space-y-3 lg:col-span-3">
                  {selectedJuz ? (
                    <div className="animate-fade-in space-y-3">
                      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSelectedJuz(null)}
                          aria-label="Kembali ke daftar juz"
                        >
                          <ArrowLeft className="size-4" />
                        </Button>
                        <div>
                          <h5 className="text-sm font-bold text-foreground">
                            Juz {selectedJuz}
                          </h5>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {juzHafalCount} dari {juzSurahs.length} surah dihafal
                          </p>
                        </div>
                      </div>

                      <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                        {juzSurahs.map((s) => {
                          const status = hafalan[s.no] || 0
                          return (
                            <button
                              key={s.no}
                              onClick={() => toggleSurah(s.no)}
                              disabled={toggling}
                              className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border/60 hover:bg-muted/40 disabled:opacity-60"
                            >
                              <span
                                className={cn(
                                  'flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                  status === 1
                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                    : status === 2
                                      ? 'border-accent/20 bg-accent/10 text-accent'
                                      : 'border-border bg-background text-muted-foreground group-hover:border-border'
                                )}
                              >
                                {status === 1 ? (
                                  <CheckCircle2 className="size-4" />
                                ) : status === 2 ? (
                                  <RotateCcw className="size-4" />
                                ) : (
                                  <Circle className="size-4 opacity-40" />
                                )}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold text-foreground">
                                  {s.no}. {s.nama}
                                </span>
                                <span className="block text-[10px] font-medium text-muted-foreground">
                                  {s.ayat} ayat
                                </span>
                              </span>

                              <span className="shrink-0 pr-1 font-arabic text-sm text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100">
                                {s.arab}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-foreground">
                          Pencapaian Juz
                        </h5>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Pilih juz untuk detail
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[...Array(30)].map((_, i) => {
                          const j = i + 1
                          const p = juzPcts[i] ?? 0
                          return (
                            <button
                              key={j}
                              onClick={() => setSelectedJuz(j)}
                              className={cn(
                                'group relative flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all hover:-translate-y-0.5',
                                p === 100
                                  ? 'bg-primary text-primary-foreground shadow-soft'
                                  : p > 0
                                    ? 'border border-accent/25 bg-accent/10 text-accent'
                                    : 'border border-border bg-card text-muted-foreground'
                              )}
                            >
                              <span className="text-[13px] font-bold">{j}</span>
                              {p > 0 && p < 100 ? (
                                <span className="tabular mt-0.5 rounded bg-accent/20 px-1 text-[8px] font-bold text-accent">
                                  {p}%
                                </span>
                              ) : null}
                              {p === 100 ? (
                                <CheckCircle2 className="absolute right-0.5 top-0.5 size-2.5 text-primary-foreground/70" />
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kolom riwayat */}
                <div className="space-y-3 lg:col-span-2">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <FileText className="size-4 shrink-0 text-primary" />
                    <h5 className="text-sm font-bold text-foreground">
                      Riwayat Setoran
                    </h5>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {studentSubmissions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 py-8 text-center text-xs italic text-muted-foreground">
                        Belum ada setoran dicatat
                      </div>
                    ) : (
                      studentSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex overflow-hidden rounded-xl border border-border/60 bg-card p-3 text-[13px]"
                        >
                          <span className="mr-2.5 w-1 shrink-0 rounded-full bg-primary/25" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="truncate font-bold text-foreground">
                                {getSurahNama(sub.surah_no)}
                                {sub.ayat_start && sub.ayat_end ? (
                                  <span className="ml-1 font-semibold text-muted-foreground">
                                    :{sub.ayat_start}
                                    {sub.ayat_end !== sub.ayat_start
                                      ? `–${sub.ayat_end}`
                                      : ''}
                                  </span>
                                ) : null}
                              </span>
                              <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                {sub.nilai}
                              </span>
                            </div>

                            <div className="text-[10px] font-medium text-muted-foreground">
                              {formatWaktu(sub.waktu).tanggal} ·{' '}
                              {formatWaktu(sub.waktu).jam}
                            </div>

                            {sub.catatan ? (
                              <div className="mt-1 truncate rounded border border-border/50 bg-muted/40 p-1.5 text-xs text-muted-foreground">
                                {sub.catatan}
                              </div>
                            ) : null}
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
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus Siswa?"
        description={`Hapus siswa "${deleteTarget?.name}"? Semua riwayat setoran & hafalan akan dihapus permanen.`}
        confirmText="Hapus"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
