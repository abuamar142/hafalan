'use client'

import Image from "next/image";

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileBarChart,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  FolderOpen
} from 'lucide-react'

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
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Kelompok',
    href: '/kelompok',
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    label: 'Santri',
    href: '/santri',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Setoran',
    href: '/setoran',
    icon: <CheckSquare className="w-5 h-5" />,
    children: [
      { label: 'Tambah Setoran', href: '/setoran/tambah' },
      { label: 'Riwayat Setoran', href: '/setoran/riwayat' },
    ],
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: <FileBarChart className="w-5 h-5" />,
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
        <div className="px-5 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/images/logo.jpg"
              alt="Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover shadow-sm"
            />
            <h1 className="text-base font-semibold leading-tight text-text">
              SMA Islam Bunga Bangsa
            </h1>
          </div>
          {guru && (
            <div className="mt-1 text-xs text-text-muted font-medium pl-[52px] leading-tight">{guru}</div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isParentActive = item.children?.some((child) => pathname.startsWith(child.href)) ?? false
            const isExpanded = !manualCollapse.has(item.label) && (expandedMenu === item.label || isParentActive)
            const hasChildren = item.children && item.children.length > 0
            const isActive = hasChildren ? isParentActive : (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
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
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-card hover:text-text'
                  }`}
                >
                  <span className={`${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-primary' : 'text-text-muted'}`}
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
                    />
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="ml-[42px] mt-1 space-y-1 border-l border-border/50 pl-2">
                    {item.children!.map((child) => {
                      const isChildActive = pathname.startsWith(child.href)
                      return (
                        <button
                          key={child.href}
                          onClick={() => navigateTo(child.href)}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-all ${
                            isChildActive
                              ? 'bg-primary/5 text-primary'
                              : 'text-text-secondary hover:bg-card hover:text-text'
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
        <div className="px-3 pb-6 mt-auto space-y-1">
          <div className="mx-3 mb-4 h-px bg-border/50" />
          <button
            onClick={() => {
              onOpenSettings()
              setMobileOpen(false)
            }}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-card hover:text-text"
          >
            <Settings className="w-5 h-5 text-text-muted group-hover:text-text" />
            Pengaturan
          </button>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-red/10 hover:text-red"
          >
            <LogOut className="w-5 h-5 text-text-muted group-hover:text-red" />
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
        className="fixed top-0 left-0 z-50 flex h-14 w-14 items-center justify-center bg-surface text-text md:hidden border-b border-r border-border"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface border-r border-border transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-shrink-0 md:flex-col bg-surface border-r border-border">
        <div className="flex h-screen flex-col overflow-y-auto sticky top-0">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
