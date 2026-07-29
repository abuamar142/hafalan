'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../layout'
import {
  createGroupAction,
  deleteGroupAction,
  addTeacherAction,
  removeTeacherAction,
} from '@/lib/actions/groups'
import { getGuruNames } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Modal from '@/components/Modal'
import { Plus, Trash2, UserPlus, X, FolderKanban, ShieldCheck, Shield } from 'lucide-react'

export default function KelompokPage() {
  const { state, refreshAll } = useDashboard()
  const [addOpen, setAddOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [allTeachers, setAllTeachers] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Load all teachers/gurus
  useEffect(() => {
    getGuruNames().then(setAllTeachers)
  }, [])

  // Load current logged-in user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

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
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal membuat kelompok: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteGroup(id: number, name: string) {
    if (!confirm(`Hapus kelompok "${name}"? Semua santri di dalamnya akan kehilangan asosiasi kelompok.`)) return
    setSaving(true)
    try {
      await deleteGroupAction(id)
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Gagal menghapus kelompok: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignTeacher(groupId: number, teacherId: string) {
    if (!teacherId) return
    setSaving(true)
    try {
      await addTeacherAction(groupId, teacherId)
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Gagal menambahkan ustadz: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleUnassignTeacher(groupId: number, teacherId: string) {
    setSaving(true)
    try {
      await removeTeacherAction(groupId, teacherId)
      await refreshAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Gagal menghapus ustadz: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl pb-10">
      {/* Top Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Kelompok Halaqah</h2>
          <p className="text-sm text-text-muted mt-1">
            Kelola pembagian kelompok halaqah dan ustadz pengampu.
          </p>
        </div>
        <Button
          onClick={() => {
            setError('')
            setAddOpen(true)
          }}
          className="gap-2 shadow-sm"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          Tambah Kelompok
        </Button>
      </div>

      {/* Empty State */}
      {state.groups.length === 0 && (
        <div className="py-16 text-center text-sm text-text-muted border border-border/50 rounded-xl bg-surface border-dashed">
          Belum ada kelompok halaqah yang didaftarkan.
        </div>
      )}

      {/* Groups Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.groups.map((group) => {
          const isOwner = group.user_id === currentUserId
          
          // Get teachers assigned to this group
          const assignedTeachers = state.groupTeachers.filter(
            (gt) => gt.group_id === group.id
          )
          
          const assignedTeacherIds = assignedTeachers.map((gt) => gt.teacher_id)

          // Teachers available to assign (registered teachers not in this group)
          const availableTeachers = Object.entries(allTeachers).filter(
            ([teacherId]) => !assignedTeacherIds.includes(teacherId)
          )

          return (
            <Card
              key={group.id}
              className="border-border/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow bg-surface"
            >
              <div>
                <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-start justify-between space-y-0 gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-bold text-text truncate">
                      {group.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" /> Pemilik
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card text-text-muted border border-border/50 uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Anggota
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="h-8 w-8 text-text-muted hover:text-red hover:bg-red/10 rounded-lg shrink-0"
                      disabled={saving}
                      aria-label="Hapus kelompok"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Ustadz/Teachers List */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Ustadz Pengampu
                    </label>
                    {assignedTeachers.length === 0 ? (
                      <p className="text-xs text-text-muted italic">Belum ada ustadz pengampu</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedTeachers.map((gt) => {
                          const teacherName = allTeachers[gt.teacher_id] || 'Ustadz'
                          return (
                            <span
                              key={gt.id}
                              className="inline-flex items-center gap-1.5 bg-background text-text-secondary pl-2.5 pr-1.5 py-1 rounded-lg border border-border text-xs font-medium"
                            >
                              {teacherName}
                              {isOwner && (
                                <button
                                  onClick={() => handleUnassignTeacher(group.id, gt.teacher_id)}
                                  className="text-text-muted hover:text-red p-0.5 rounded hover:bg-card transition-colors"
                                  disabled={saving}
                                  aria-label={`Hapus ${teacherName}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t border-border/30 bg-card/30 rounded-b-[var(--radius-lg)]">
                {/* Assign Teacher Dropdown (Only for Owners) */}
                {isOwner ? (
                  availableTeachers.length > 0 ? (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Tambah Ustadz
                      </label>
                      <select
                        onChange={(e) => {
                          handleAssignTeacher(group.id, e.target.value)
                          e.target.value = '' // Reset selection
                        }}
                        defaultValue=""
                        disabled={saving}
                        className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors text-text"
                      >
                        <option value="" disabled>-- Pilih Ustadz --</option>
                        {availableTeachers.map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted italic text-center py-1">
                      Semua ustadz sudah ditugaskan ke kelompok ini
                    </p>
                  )
                ) : (
                  <p className="text-[11px] text-text-muted italic text-center py-1">
                    Hanya pemilik yang dapat mengelola ustadz
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Group Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Buat Kelompok Baru"
      >
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
          <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleAddGroup} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Kelompok'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
