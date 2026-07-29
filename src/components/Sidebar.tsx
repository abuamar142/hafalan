'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Santri',
    href: '/santri',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Setoran',
    href: '/setoran',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" />
        <path d="M8 11h8" />
      </svg>
    ),
    children: [
      { label: 'Tambah Setoran', href: '/setoran/tambah' },
      { label: 'Riwayat Setoran', href: '/setoran/riwayat' },
    ],
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    ),
  },
]

interface SidebarProps {
  guru: string
  onOpenSettings: () => void
}

export default function Sidebar({ guru, onOpenSettings }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    for (const item of NAV_ITEMS) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        return item.label
      }
    }
    return null
  })
  // Tracks menus user explicitly collapsed — overrides isParentActive auto-expand
  const [manualCollapse, setManualCollapse] = useState<Set<string>>(new Set())

  async function handleLogout() {
    if (!confirm('Yakin ingin keluar?')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  function navigateTo(href: string) {
    router.push(href)
    setMobileOpen(false)
  }

  function SidebarContent() {
    return (
      <>
        {/* Branding */}
        <div className="px-5 pt-6 pb-6">
          <h1 className="text-base font-semibold leading-tight text-white">
            SMA Islam Bunga Bangsa
          </h1>
          {guru && (
            <div className="mt-1 text-xs text-white/60 leading-tight">{guru}</div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isParentActive = item.children?.some((child) => pathname.startsWith(child.href)) ?? false
            const isExpanded = !manualCollapse.has(item.label) && (expandedMenu === item.label || isParentActive)
            const hasChildren = item.children && item.children.length > 0
            const isActive = hasChildren ? isParentActive : pathname.startsWith(item.href)
            return (
              <div key={item.href}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      if (isExpanded) {
                        setManualCollapse((prev) => new Set(prev).add(item.label))
                      } else {
                        setManualCollapse((prev) => {
                          const next = new Set(prev)
                          next.delete(item.label)
                          return next
                        })
                        navigateTo(item.children![0].href)
                      }
                      setExpandedMenu(isExpanded ? null : item.label)
                    } else {
                      navigateTo(item.href)
                    }
                  }}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isExpanded) {
                          setManualCollapse((prev) => new Set(prev).add(item.label))
                        } else {
                          setManualCollapse((prev) => {
                            const next = new Set(prev)
                            next.delete(item.label)
                            return next
                          })
                        }
                        setExpandedMenu(isExpanded ? null : item.label)
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="ml-5 mb-1">
                    {item.children!.map((child) => {
                      const isChildActive = pathname.startsWith(child.href)
                      return (
                        <button
                          key={child.href}
                          onClick={() => navigateTo(child.href)}
                          className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                            isChildActive
                              ? 'bg-white/15 text-white'
                              : 'text-white/60 hover:bg-white/8 hover:text-white'
                          }`}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-5 mt-auto">
          <button
            onClick={() => {
              onOpenSettings()
              setMobileOpen(false)
            }}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Pengaturan
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-red-light/20 hover:text-red-light"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-0 left-0 z-50 flex h-12 w-12 items-center justify-center bg-sidebar text-white md:hidden shadow-lg"
        aria-label="Buka menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[240px] md:flex-shrink-0 md:flex-col bg-sidebar">
        <div className="flex h-screen flex-col overflow-y-auto sticky top-0">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
