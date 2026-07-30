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
import { Card, CardContent } from '@/components/ui/Card'
import { Button, Dialog as KumoDialog, useKumoToastManager, Input, Combobox } from '@cloudflare/kumo'
import Pagination from '@/components/Pagination'
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
  const toastManager = useKumoToastManager()

  const groupItems = useMemo(() => {
    return state.groups.map((g) => {
      const cName = state.classes.find(c => c.id === g.class_id)?.name || 'Tanpa Kelas'
      return { ...g, _label: `${g.name} (${cName})` }
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

  const [selectedStudent, setSelectedStudent] = useState<typeof state.students[number] | null>(null)
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)

  const [nama, setNama] = useState('')
  const [groupItem, setGroupItem] = useState<typeof groupItems[number] | null>(null)
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
    setGroupItem(null)
    setAddOpen(true)
  }

  function openEditModal(s: typeof state.students[number]) {
    setError('')
    setSelectedStudent(s)
    setNama(s.nama)
    const matchedGroup = groupItems.find((g) => g.id === s.group_id)
    setGroupItem(matchedGroup || null)
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
    if (!groupItem) {
      setError('Kelompok wajib dipilih')
      return
    }
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('nama', nama.trim())
      formData.append('groupId', String(groupItem.id))
      await addStudentAction(formData)
      setNama('')
      setGroupItem(null)
      setAddOpen(false)
      await refreshStudents()
      toastManager.add({ title: 'Siswa berhasil ditambahkan!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal menyimpan: ' + msg)
      toastManager.add({ title: 'Gagal menambahkan siswa: ' + msg, variant: 'error' })
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
    if (!groupItem) {
      setError('Kelompok wajib dipilih')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateStudentAction(selectedStudent.id, nama.trim(), groupItem.id)
      setEditOpen(false)
      await refreshStudents()
      toastManager.add({ title: 'Siswa berhasil diperbarui!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui: ' + msg)
      toastManager.add({ title: 'Gagal memperbarui siswa: ' + msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus siswa "${name}"? Semua riwayat setoran & hafalan akan dihapus permanen.`)) return
    setSaving(true)
    try {
      await deleteStudentAction(id)
      await refreshStudents()
      toastManager.add({ title: 'Siswa berhasil dihapus!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toastManager.add({ title: 'Gagal menghapus siswa: ' + msg, variant: 'error' })
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
      toastManager.add({ title: 'Status hafalan berhasil diperbarui!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toastManager.add({ title: 'Gagal memperbarui status hafalan: ' + msg, variant: 'error' })
    } finally {
      setToggling(false)
    }
  }

  // Details components
  const juzSurahs = selectedJuz ? getJuzSurahs(selectedJuz) : []
  const juzHafalCount = selectedJuz
    ? juzSurahs.filter((s) => hafalan[s.no] === 1).length
    : 0

  return (
    <div className="max-w-6xl pb-10">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Manajemen Siswa</h2>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
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
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari siswa..."
          className="pl-9"
        />
      </div>

      {/* Main Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-surface">
        <CardContent className="p-0">
          {state.students.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border-dashed">
              Belum ada siswa yang didaftarkan.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border-dashed">
              Tidak ada siswa yang sesuai dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-card/50 text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Kelompok</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Progress</th>
                    <th className="py-3.5 px-4 w-44 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {paginated.map((s, index) => {
                    const group = state.groups.find((g) => g.id === s.group_id)
                    const groupName = group?.name || 'Tanpa Kelompok'
                    const className = group ? (state.classes.find(c => c.id === group.class_id)?.name || 'Tanpa Kelas') : 'Tanpa Kelas'
                    const p = getPct(s)

                    return (
                      <tr key={s.id} className="hover:bg-card/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-text-muted">
                          {(page - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-text">
                          {s.nama}
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary font-medium">
                          {groupName !== 'Tanpa Kelompok' ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                              {groupName}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted italic">{groupName}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary font-medium">
                          {className !== 'Tanpa Kelas' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                              {className}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted italic">{className}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-3 max-w-[120px] mx-auto">
                            <span className="text-xs font-bold text-text-secondary w-9 text-right">{p}%</span>
                            <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${p}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              shape="square"
                              onClick={() => openDetailModal(s)}
                              className="h-8.5 w-8.5 text-text-muted hover:text-text hover:bg-card rounded-lg"
                              title="Progres Hafalan"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              shape="square"
                              onClick={() => openEditModal(s)}
                              className="h-8.5 w-8.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              shape="square"
                              onClick={() => handleDelete(s.id, s.nama)}
                              className="h-8.5 w-8.5 text-text-muted hover:text-red hover:bg-red/10 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Add Modal */}
      <KumoDialog.Root open={addOpen} onOpenChange={(open) => { if (!open) setAddOpen(false) }}>
        <KumoDialog.Title>Tambah Siswa Baru</KumoDialog.Title>
        <KumoDialog>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Nama Lengkap <span className="text-red">*</span>
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
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Kelompok Halaqah <span className="text-red">*</span>
              </label>
              <Combobox
                items={groupItems}
                value={groupItem}
                onValueChange={setGroupItem}
                itemToStringLabel={(item: typeof groupItems[number]) => item._label}
              >
                <Combobox.TriggerInput placeholder="Pilih Kelompok..." />
                <Combobox.Content>
                  <Combobox.List>
                    {(item: typeof groupItems[number]) => <Combobox.Item value={item}>{item._label}</Combobox.Item>}
                  </Combobox.List>
                  <Combobox.Empty>Kelompok tidak ditemukan</Combobox.Empty>
                </Combobox.Content>
              </Combobox>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Batal</Button>} />
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Siswa'}
            </Button>
          </div>
        </KumoDialog>
      </KumoDialog.Root>

      {/* Edit Modal */}
      <KumoDialog.Root open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false) }}>
        <KumoDialog.Title>Edit Siswa</KumoDialog.Title>
        <KumoDialog>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Nama Lengkap <span className="text-red">*</span>
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
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Kelompok Halaqah <span className="text-red">*</span>
              </label>
              <Combobox
                items={groupItems}
                value={groupItem}
                onValueChange={setGroupItem}
                itemToStringLabel={(item: typeof groupItems[number]) => item._label}
              >
                <Combobox.TriggerInput placeholder="Pilih Kelompok..." />
                <Combobox.Content>
                  <Combobox.List>
                    {(item: typeof groupItems[number]) => <Combobox.Item value={item}>{item._label}</Combobox.Item>}
                  </Combobox.List>
                  <Combobox.Empty>Kelompok tidak ditemukan</Combobox.Empty>
                </Combobox.Content>
              </Combobox>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Batal</Button>} />
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Siswa'}
            </Button>
          </div>
        </KumoDialog>
      </KumoDialog.Root>

      {/* Interactive Detail Modal (with Juz Grid and Setoran History) */}
      <KumoDialog.Root open={detailOpen} onOpenChange={(open) => { if (!open) setDetailOpen(false) }}>
        <KumoDialog.Title>Detail &amp; Progres Siswa</KumoDialog.Title>
        <KumoDialog size="xl">
          {selectedStudent && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-lg border border-border/50">
              <div className="min-w-0 text-center sm:text-left">
                <h4 className="text-lg font-bold text-text">{selectedStudent.nama}</h4>
                <div className="text-xs text-text-muted mt-1 font-medium flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
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

              <div className="flex items-center gap-6 shrink-0 bg-surface px-4 py-2.5 rounded-lg border border-border/40 shadow-sm">
                <div className="text-center">
                  <div className="text-sm font-bold text-text">{hafalCount}</div>
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Surah</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-text">{juzSelesai}</div>
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Juz Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-primary">{pct}%</div>
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Progress</div>
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
                        <h5 className="font-bold text-text text-sm">Juz {selectedJuz}</h5>
                        <p className="text-[11px] font-semibold text-text-muted mt-0.5">
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
                              'bg-background text-text-muted border border-border group-hover:border-border-hover'
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
                              <div className="text-xs font-bold text-text truncate">{s.no}. {s.nama}</div>
                              <div className="text-[10px] font-semibold text-text-muted mt-0.5">{s.ayat} ayat</div>
                            </div>
                            
                            <div className="shrink-0 text-sm text-text-muted font-arabic pr-1 opacity-50 group-hover:opacity-100 transition-opacity">
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
                      <h5 className="font-bold text-text text-sm">Pencapaian Juz</h5>
                      <span className="text-[10px] font-semibold text-text-muted">Pilih Juz untuk detail</span>
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
                                  : 'bg-surface border border-border text-text-muted'
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
                  <h5 className="font-bold text-text text-sm">Riwayat Setoran</h5>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {studentSubmissions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-muted italic border border-dashed border-border/50 bg-background rounded-lg">
                      Belum ada setoran dicatat
                    </div>
                  ) : (
                    studentSubmissions.map((sub) => (
                      <div key={sub.id} className="bg-card rounded-lg p-3 border border-border/50 text-[13px] relative overflow-hidden flex">
                        <div className="w-1 bg-primary/20 mr-2.5 shrink-0 rounded-full"></div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-text truncate">
                              {getSurahNama(sub.surah_no)}
                              {sub.ayat_start && sub.ayat_end ? (
                                <span className="text-text-muted font-semibold ml-1">
                                  :{sub.ayat_start}{sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              {sub.nilai}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-text-muted font-medium">
                            {formatWaktu(sub.waktu).tanggal} · {formatWaktu(sub.waktu).jam}
                          </div>

                          {sub.catatan && (
                            <div className="text-xs text-text-secondary bg-background rounded p-1.5 border border-border/40 mt-1 truncate">
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

            <div className="mt-4 border-t border-border pt-4 flex justify-end">
              <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Tutup</Button>} />
            </div>
          </div>
        )}
        </KumoDialog>
      </KumoDialog.Root>
    </div>
  )
}