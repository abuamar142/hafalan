'use client'

import { createContext, useContext, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAppState } from '@/hooks/useAppState'
import type { SantriWithCount, Memorization } from '@/lib/types'

interface DashboardContextValue {
  state: ReturnType<typeof useAppState>['state']
  loading: boolean
  refreshAll: () => Promise<void>
  getStudent: (id: number) => SantriWithCount | undefined
  getStudentMemorization: (id: number) => Memorization[]
  addStudent: (nama: string, kelas: string, usia: string) => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardLayout')
  return ctx
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const app = useAppState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guruInput, setGuruInput] = useState('')

  function openSettings() {
    setGuruInput(app.state.guru)
    setSettingsOpen(true)
  }

  async function handleSaveGuru() {
    await app.updateGuru(guruInput.trim())
    setSettingsOpen(false)
  }

  return (
    <DashboardContext.Provider
      value={{
        state: app.state,
        loading: app.loading,
        refreshAll: app.refreshAll,
        getStudent: app.getStudent,
        getStudentMemorization: app.getStudentMemorization,
        addStudent: app.addStudent,
      }}
    >
      <div className="flex min-h-screen bg-surface text-text">
        {/* Sidebar */}
        <Sidebar guru={app.state.guru} onOpenSettings={openSettings} />

        {/* Main content area */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Spacer for mobile hamburger — content starts below it on small screens */}
          <div className="h-12 md:hidden" />

          {/* Loading */}
          {app.loading && (
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="text-sm text-text-muted">Memuat data...</div>
            </div>
          )}

          {/* Content */}
          {!app.loading && (
            <main className="flex-1 p-4 md:p-6">{children}</main>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Pengaturan"
      >
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-text-secondary">
            Nama Ustadz / Guru
          </label>
          <input
            type="text"
            value={guruInput}
            onChange={(e) => setGuruInput(e.target.value)}
            placeholder="Ustadz Ahmad..."
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="mt-3.5 flex justify-end">
          <button
            onClick={handleSaveGuru}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity"
          >
            Simpan
          </button>
        </div>
      </Modal>
    </DashboardContext.Provider>
  )
}
