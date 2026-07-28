'use client'

import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { label: 'Santri', href: '/santri' },
  { label: 'Rekap', href: '/rekap' },
  { label: 'Setoran', href: '/setoran' },
  { label: 'Laporan', href: '/laporan' },
]

export default function NavTabs() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="sticky top-[49px] z-10 flex border-b border-border bg-surface overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`whitespace-nowrap flex-shrink-0 px-3 py-[11px] text-[13px] font-medium transition-colors ${
              isActive
                ? 'border-b-[2.5px] border-b-primary text-primary'
                : 'border-b-[2.5px] border-b-transparent text-text-secondary hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
