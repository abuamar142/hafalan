'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../layout'
import SantriCard from '@/components/SantriCard'
import Modal from '@/components/Modal'

export default function SantriPage() {
  const { state, addStudent } = useDashboard()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [usia, setUsia] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addStudent(nama.trim(), kelas.trim(), usia.trim())
      setNama('')
      setKelas('')
      setUsia('')
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
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] text-text-secondary">
          {state.students.length} santri terdaftar
        </div>
        <button
          onClick={() => {
            setError('')
            setAddOpen(true)
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 transition-opacity"
        >
          + Tambah Santri
        </button>
      </div>

      {/* Empty state */}
      {state.students.length === 0 && (
        <div className="py-7 text-center text-[13px] text-text-muted">
          Belum ada santri.
        </div>
      )}

      {/* Santri list */}
      {state.students.map((s, i) => (
        <SantriCard
          key={s.id}
          student={s}
          index={i}
          onClick={() => router.push(`/santri/${s.id}`)}
        />
      ))}

      {/* Add Santri Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Santri Baru"
      >
        {error && (
          <div className="mb-3 rounded-lg border-l-[3px] border-red bg-red-light px-3 py-2.5 text-xs text-red leading-relaxed">
            {error}
          </div>
        )}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Nama Lengkap *
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama santri..."
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Kelas / Halaqah
          </label>
          <input
            type="text"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            placeholder="Kelas A, Halaqah 1..."
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Usia (tahun)
          </label>
          <input
            type="number"
            min={5}
            max={99}
            value={usia}
            onChange={(e) => setUsia(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="mt-3.5 flex justify-end gap-2">
          <button
            onClick={() => setAddOpen(false)}
            className="rounded-lg bg-card px-4 py-2 text-[13px] font-medium text-text-secondary border border-border hover:bg-border/30 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </>
  )
}
