'use client'

import Image from "next/image";

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  LayoutDashboard,
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
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Management',
    href: '/management',
    icon: <FolderOpen className="w-5 h-5" />,
    children: [
      { label: 'Kelas', href: '/kelas' },
      { label: 'Kelompok', href: '/kelompok' },
      { label: 'Siswa', href: '/santri' },
    ],
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
  userName: string
  onOpenSettings: () => void
}

export default function Sidebar({ userName, onOpenSettings }: SidebarProps) {
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
        <div className="px-4 pt-5 pb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.jpg"
              alt="Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight text-foreground truncate">
                SMA Islam Bunga Bangsa
              </h1>
              {userName && (
                <p className="mt-0.5 text-xs text-muted-foreground font-medium leading-tight truncate">
                  {userName}
                </p>
              )}
            </div>
          </div>
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
                        const firstChild = item.children?.[0]
                        if (firstChild) navigateTo(firstChild.href)
                      }
                      setExpandedMenu(isExpanded ? null : item.label)
                    } else {
                      navigateTo(item.href)
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <span className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
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
                              : 'text-muted-foreground hover:bg-card hover:text-foreground'
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
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-card hover:text-foreground"
          >
            <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            Pengaturan
          </button>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
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
        className="fixed top-0 left-0 z-50 flex h-14 w-14 items-center justify-center bg-card text-foreground md:hidden border-b border-r border-border"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-card border-r border-border transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-shrink-0 md:flex-col bg-card border-r border-border">
        <div className="flex h-screen flex-col overflow-y-auto sticky top-0">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
