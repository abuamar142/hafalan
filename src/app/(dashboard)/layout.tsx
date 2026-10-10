'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppState, QK } from '@/hooks/useAppState'
import { createClient } from '@/lib/supabase/client'
import type { SantriWithCount, Memorization } from '@/lib/types'
import { ToastProvider } from '@/components/ui/toast-wrapper'
import { Loader2 } from 'lucide-react'

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

// Komponen dalam — harus di bawah QueryClientProvider agar useQueryClient bekerja.
function DashboardContent({ children }: { children: React.ReactNode }) {
  const app = useAppState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guruInput, setGuruInput] = useState('')
  const [userName, setUserName] = useState('')
  const [savingName, setSavingName] = useState(false)

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
    setSavingName(true)
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { name: guruInput.trim() } })
      setUserName(guruInput.trim())
      setSettingsOpen(false)
    } finally {
      setSavingName(false)
    }
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
      <SidebarProvider>
        <AppSidebar userName={userName} onOpenSettings={openSettings} />
        <SidebarInset className="bg-background">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="h-5 w-px bg-border" />
            <span className="text-[13px] font-semibold text-muted-foreground">
              Sistem Informasi Hafalan
            </span>
          </header>

          <div className="flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col">
            {app.loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Memuat data...
                </p>
              </div>
            ) : (
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
                {children}
              </main>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Dialog pengaturan */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan</DialogTitle>
            <DialogDescription>
              Nama ini muncul pada laporan dan raport yang Anda cetak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label
              htmlFor="guru-name"
              className="block text-[13px] font-semibold text-foreground"
            >
              Nama Ustadz / Guru
            </label>
            <Input
              id="guru-name"
              type="text"
              value={guruInput}
              onChange={(e) => setGuruInput(e.target.value)}
              placeholder="Ustadz Ahmad..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              disabled={savingName}
            >
              Batal
            </Button>
            <Button onClick={handleSaveGuru} disabled={savingName}>
              {savingName ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
