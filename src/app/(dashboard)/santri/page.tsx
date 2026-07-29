'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../layout'
import { addStudentAction } from '@/lib/actions/students'
import SantriCard from '@/components/SantriCard'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Users, UserPlus } from 'lucide-react'

export default function SantriPage() {
  const { state } = useDashboard()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [groupId, setGroupId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      formData.append('kelas', kelas.trim())
      formData.append('groupId', groupId)
      await addStudentAction(formData)
      setNama('')
      setKelas('')
      setGroupId('')
      setAddOpen(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError('Gagal menyimpan: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Daftar Santri</h2>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {state.students.length} santri terdaftar
          </p>
        </div>
        <Button
          onClick={() => {
            setError('')
            setAddOpen(true)
          }}
          className="gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Santri
        </Button>
      </div>

      {/* Empty state */}
      {state.students.length === 0 && (
        <div className="py-16 text-center text-sm text-text-muted border border-border/50 rounded-xl bg-surface border-dashed">
          Belum ada santri yang didaftarkan.
        </div>
      )}

      {/* Santri list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.students.map((s, i) => (
          <SantriCard
            key={s.id}
            student={s}
            index={i}
            onClick={() => router.push(`/santri/${s.id}`)}
          />
        ))}
      </div>

      {/* Add Santri Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Santri Baru"
      >
        {error && (
          <div className="mb-4 rounded-md border-l-[3px] border-red bg-red-light px-3 py-2.5 text-sm text-red">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Nama Lengkap <span className="text-red">*</span>
            </label>
            <Input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Kelas / Halaqah
              </label>
              <Input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Misal: A1"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Kelompok <span className="text-red">*</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors text-text"
              >
                <option value="">Pilih Kelompok</option>
                {state.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAddOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Santri'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
