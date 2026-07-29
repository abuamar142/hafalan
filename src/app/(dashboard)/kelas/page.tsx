'use client'

import { useState } from 'react'
import { useDashboard } from '../layout'
import {
  createClassAction,
  deleteClassAction,
  updateClassAction,
} from '@/lib/actions/classes'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Modal from '@/components/Modal'
import { Plus, Eye, Edit, Trash2, Layers } from 'lucide-react'

export default function KelasPage() {
  const { state, refreshAll } = useDashboard()
  
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  
  const [selectedClass, setSelectedClass] = useState<typeof state.classes[number] | null>(null)
  
  const [className, setClassName] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal membuat kelas: ' + msg)
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
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal memperbarui kelas: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteClass(id: number, name: string) {
    if (!confirm(`Hapus kelas "${name}"? Kelompok di dalamnya akan kembali menjadi "Tanpa Kelas".`)) return
    setSaving(true)
    try {
      await deleteClassAction(id)
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Gagal menghapus kelas: ' + msg)
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
      {/* Top Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Manajemen Kelas</h2>
          <p className="text-sm text-text-muted mt-1">
            Kelola jenjang kelas dan kelompok halaqah yang tergabung di dalamnya.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="gap-2 shadow-sm"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </Button>
      </div>

      {/* Main Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-surface">
        <CardContent className="p-0">
          {state.classes.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted border-dashed">
              Belum ada kelas yang didaftarkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-card/50 text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Kelas</th>
                    <th className="py-3.5 px-4">Kelompok di Dalamnya</th>
                    <th className="py-3.5 px-4 w-40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {state.classes.map((c, index) => {
                    const groups = state.groups.filter((g) => g.class_id === c.id)
                    return (
                      <tr key={c.id} className="hover:bg-card/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-text-muted">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-text">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4">
                          {groups.length === 0 ? (
                            <span className="text-xs text-text-muted italic">Tidak ada kelompok</span>
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
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDetailModal(c)}
                              className="h-8.5 w-8.5 text-text-muted hover:text-text hover:bg-card rounded-lg"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(c)}
                              className="h-8.5 w-8.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClass(c.id, c.name)}
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
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Kelas Baru">
        {error && (
          <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Nama Kelas <span className="text-red">*</span>
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Pilih Kelompok Halaqah
            </label>
            {visibleGroupsForAdd.length === 0 ? (
              <p className="text-xs text-text-muted italic bg-background p-3 rounded-lg border border-border">
                Semua kelompok sudah terdistribusi ke kelas lain. Buat kelompok baru terlebih dahulu jika diperlukan.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                {visibleGroupsForAdd.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text cursor-pointer"
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

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleAddClass} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Kelas'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Kelas">
        {error && (
          <div className="mb-4 rounded-md border-l-[3px] border-red bg-red/10 px-3 py-2.5 text-sm text-red font-medium">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Nama Kelas <span className="text-red">*</span>
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Pilih Kelompok Halaqah
            </label>
            {visibleGroupsForEdit.length === 0 ? (
              <p className="text-xs text-text-muted italic bg-background p-3 rounded-lg border border-border">
                Tidak ada kelompok yang tersedia.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                {visibleGroupsForEdit.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text cursor-pointer"
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

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleEditClass} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Perbarui Kelas'}
          </Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Kelas">
        {selectedClass && (
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-4 border border-border space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Nama Kelas</label>
                <div className="text-base font-bold text-text mt-0.5">{selectedClass.name}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Tanggal Dibuat</label>
                <div className="text-sm font-medium text-text-secondary mt-0.5">
                  {new Date(selectedClass.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Daftar Kelompok Halaqah
              </label>
              {state.groups.filter((g) => g.class_id === selectedClass.id).length === 0 ? (
                <p className="text-xs text-text-muted italic bg-background p-3 rounded-lg border border-border">
                  Tidak ada kelompok di dalam kelas ini.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {state.groups
                    .filter((g) => g.class_id === selectedClass.id)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-text-secondary"
                      >
                        <Layers className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{g.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}