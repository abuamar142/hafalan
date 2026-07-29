'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAppState, QK } from '@/hooks/useAppState'
import { createClient } from '@/lib/supabase/client'
import type { SantriWithCount, Memorization } from '@/lib/types'
import { ToastProvider } from '@/components/ui/Toast'

type App = ReturnType<typeof useAppState>

interface DashboardContextValue {
  state: App['state']
  loading: boolean
  refreshAll: () => Promise<void>
  refreshStudents: () => Promise<void>
  refreshSubmissions: () => Promise<void>
  refreshMemorization: () => Promise<void>
  refreshClasses: () => Promise<void>
  getStudent: (id: number) => SantriWithCount | undefined
  getStudentMemorization: (id: number) => Memorization[]
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export { QK }

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardLayout')
  return ctx
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
})

// Inner component — must be nested under QueryClientProvider so useQueryClient works
function DashboardContent({ children }: { children: React.ReactNode }) {
  const app = useAppState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guruInput, setGuruInput] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserName((data.user?.user_metadata?.name as string) || '')
    })
  }, [])

  function openSettings() {
    setGuruInput(userName)
    setSettingsOpen(true)
  }

  async function handleSaveGuru() {
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { name: guruInput.trim() } })
    setUserName(guruInput.trim())
    setSettingsOpen(false)
  }

  return (
    <DashboardContext.Provider
      value={{
        state: app.state,
        loading: app.loading,
        refreshAll: app.refreshAll,
        refreshStudents: app.refreshStudents,
        refreshSubmissions: app.refreshSubmissions,
        refreshMemorization: app.refreshMemorization,
        refreshClasses: app.refreshClasses,
        getStudent: app.getStudent,
        getStudentMemorization: app.getStudentMemorization,
      }}
    >
      <div className="flex min-h-screen bg-background text-text">
        {/* Sidebar */}
        <Sidebar userName={userName} onOpenSettings={openSettings} />

        {/* Main content area */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Spacer for mobile hamburger — content starts below it on small screens */}
          <div className="h-14 md:hidden" />

          {/* Loading */}
          {app.loading && (
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="text-sm text-text-muted">Memuat data...</div>
            </div>
          )}

          {/* Content */}
          {!app.loading && (
            <main className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto">{children}</main>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <DashboardContent>{children}</DashboardContent>
      </ToastProvider>
    </QueryClientProvider>
  )
}
