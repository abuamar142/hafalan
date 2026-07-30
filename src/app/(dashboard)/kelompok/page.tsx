'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
} from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button, Dialog as KumoDialog, useKumoToastManager, Input, Combobox, Table, Pagination } from '@cloudflare/kumo'
import { Plus, Eye, PencilSimple, Trash, User, MagnifyingGlass } from '@phosphor-icons/react'

export default function KelompokPage() {
  const { state, refreshClasses } = useDashboard()
  const toastManager = useKumoToastManager()

  const classItems = useMemo(() => {
    return [
      { id: '', label: 'Tanpa Kelas (Unassigned)' },
      ...state.classes.map((c) => ({
        id: c.id,
        label: c.name,
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

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  useEffect(() => setPage(1), [searchQuery])
  
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<typeof state.groups[number] | null>(null)
  
  const [groupName, setGroupName] = useState('')
  const [selectedClassItem, setSelectedClassItem] = useState<{ id: number | string; label: string }>({ id: '', label: 'Tanpa Kelas (Unassigned)' })
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  
  const [saving, setSaving] = useState(false)
  function handleClassChange(item: { id: number | string; label: string } | null) {
    if (item) setSelectedClassItem(item)
  }
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
    const matchedClass = classItems.find((c) => c.id === g.class_id) ?? classItems[0]
    setSelectedClassItem(matchedClass as { id: number | string; label: string })
    
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
      toastManager.add({ title: 'Kelompok berhasil ditambahkan!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal membuat kelompok: ' + msg)
      toastManager.add({ title: 'Gagal membuat kelompok: ' + msg, variant: 'error' })
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
      await updateGroupAction(selectedGroup.id, groupName.trim(), selectedClassItem.id === '' ? null : Number(selectedClassItem.id), selectedTeacherIds)
      setEditOpen(false)
      await refreshClasses()
      toastManager.add({ title: 'Kelompok berhasil diperbarui!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui kelompok: ' + msg)
      toastManager.add({ title: 'Gagal memperbarui kelompok: ' + msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteGroup(id: number, name: string) {
    if (!confirm(`Hapus kelompok "${name}"? Semua siswa di dalamnya akan kehilangan kelompok.`)) return
    setSaving(true)
    try {
      await deleteGroupAction(id)
      await refreshClasses()
      toastManager.add({ title: 'Kelompok berhasil dihapus!', variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toastManager.add({ title: 'Gagal menghapus kelompok: ' + msg, variant: 'error' })
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Manajemen Kelompok</h2>
          <p className="text-sm text-text-muted mt-1">
            Kelola kelompok halaqah, asosiasi kelas, dan penugasan ustadz pengampu.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="gap-2 shadow-sm"
          disabled={saving}
        >
          <Plus size={16} />
          Tambah Kelompok
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kelompok..."
          className="pl-9"
        />
      </div>

      {/* Main Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-surface">
        <CardContent className="p-0">
          {state.groups.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border-dashed">
              Belum ada kelompok yang didaftarkan.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border-dashed">
              Tidak ada kelompok yang sesuai dengan pencarian.
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head className="w-16 text-center">No</Table.Head>
                  <Table.Head>Nama Kelompok</Table.Head>
                  <Table.Head>Kelas</Table.Head>
                  <Table.Head>Ustadz Pengampu</Table.Head>
                  <Table.Head className="w-44 text-center">Aksi</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginated.map((group, index) => {
                  const assignedTeachers = state.groupTeachers.filter(
                    (gt) => gt.group_id === group.id
                  )
                  const className = group.class_name || state.classes.find(c => c.id === group.class_id)?.name || 'Tanpa Kelas'

                  return (
                    <Table.Row key={group.id}>
                      <Table.Cell className="text-center font-medium text-text-muted">
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-semibold text-text">{group.name}</span>
                      </Table.Cell>
                      <Table.Cell className="text-text-secondary font-medium">
                        {className !== 'Tanpa Kelas' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {className}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted italic">{className}</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {assignedTeachers.length === 0 ? (
                          <span className="text-xs text-text-muted italic">Belum ditugaskan</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedTeachers.map((gt) => {
                              const name = allTeachers[gt.teacher_id] || 'Ustadz'
                              return (
                                <span
                                  key={gt.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded bg-background border border-border/50 text-xs font-medium text-text-secondary"
                                >
                                  {name}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            shape="square"
                            onClick={() => openDetailModal(group)}
                            className="h-8.5 w-8.5 text-text-muted hover:text-text hover:bg-card rounded-lg"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            shape="square"
                            onClick={() => openEditModal(group)}
                            className="h-8.5 w-8.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Edit"
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            shape="square"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="h-8.5 w-8.5 text-text-muted hover:text-red hover:bg-red/10 rounded-lg"
                            title="Hapus"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          )}
          <Pagination page={page} setPage={setPage} totalCount={filtered.length} perPage={ITEMS_PER_PAGE}>
            <Pagination.Controls />
          </Pagination>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <KumoDialog.Root open={addOpen} onOpenChange={(open) => { if (!open) setAddOpen(false) }}>
        <KumoDialog.Title>Buat Kelompok Baru</KumoDialog.Title>
        <KumoDialog>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Nama Kelompok / Halaqah <span className="text-red">*</span>
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

          <div className="mt-6 flex justify-end gap-2">
            <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Batal</Button>} />
            <Button onClick={handleAddGroup} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kelompok'}
            </Button>
          </div>
        </KumoDialog>
      </KumoDialog.Root>

      {/* Edit Modal */}
      <KumoDialog.Root open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false) }}>
        <KumoDialog.Title>Edit Kelompok</KumoDialog.Title>
        <KumoDialog>
          {error && (
            <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
              {error}
            </div>
          )}
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Nama Kelompok <span className="text-red">*</span>
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
                <label htmlFor="edit-class-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Kelas
                </label>
                <Combobox
                  items={classItems}
                  value={selectedClassItem}
                  onValueChange={handleClassChange}
                  itemToStringLabel={(item: { id: number | string; label: string }) => item.label}
                >
                  <Combobox.TriggerInput placeholder="Pilih Kelas..." />
                  <Combobox.Content>
                    <Combobox.List>
                      {(item: { id: number | string; label: string }) => <Combobox.Item value={item}>{item.label}</Combobox.Item>}
                    </Combobox.List>
                  </Combobox.Content>
                </Combobox>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Pilih Ustadz Pengampu
                </label>
                {Object.keys(allTeachers).length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-background p-3 rounded-lg border border-border">
                    Tidak ada guru terdaftar.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                    {Object.entries(allTeachers).map(([tid, name]) => (
                      <label
                        key={tid}
                        className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text cursor-pointer"
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

          <div className="mt-6 flex justify-end gap-2">
            <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Batal</Button>} />
            <Button onClick={handleEditGroup} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Perbarui Kelompok'}
            </Button>
          </div>
        </KumoDialog>
      </KumoDialog.Root>

      {/* Detail Modal */}
      <KumoDialog.Root open={detailOpen} onOpenChange={(open) => { if (!open) setDetailOpen(false) }}>
        <KumoDialog.Title>Detail Kelompok</KumoDialog.Title>
        <KumoDialog>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Nama Kelompok</label>
                  <div className="text-base font-bold text-text mt-0.5">{selectedGroup.name}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Kelas</label>
                  <div className="text-sm font-semibold text-primary mt-0.5">
                    {selectedGroup.class_name || state.classes.find(c => c.id === selectedGroup.class_id)?.name || (
                      <span className="text-text-muted font-normal italic">Tanpa Kelas</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Tanggal Dibuat</label>
                  <div className="text-xs font-medium text-text-muted mt-0.5">
                    {new Date(selectedGroup.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Ustadz Pengampu
                </label>
                {state.groupTeachers.filter((gt) => gt.group_id === selectedGroup.id).length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-background p-3 rounded-lg border border-border">
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
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-text-secondary"
                          >
                            <User size={16} className="text-primary shrink-0" />
                            <span className="truncate">{name}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <KumoDialog.Close render={(props) => <Button variant="secondary" {...props}>Tutup</Button>} />
              </div>
            </div>
          )}
        </KumoDialog>
      </KumoDialog.Root>
    </div>
  )
}