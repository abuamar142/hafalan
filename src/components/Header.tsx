'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  guru: string
  onOpenSettings: () => void
}

export default function Header({ guru, onOpenSettings }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    if (!confirm('Yakin ingin keluar?')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-primary px-4 py-3.5 text-white">
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-medium leading-tight">SMA Islam Bunga Bangsa</h1>
        {guru && (
          <div className="text-[11px] opacity-80 leading-tight">{guru}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSettings}
          className="rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
        >
          Pengaturan
        </button>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red/60 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red/85 transition-colors"
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
