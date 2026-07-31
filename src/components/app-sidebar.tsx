'use client'

import { useState, useEffect, useMemo } from 'react'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SCHOOL_NAME } from '@/lib/constants'
import {
  LayoutDashboard,
  CheckSquare,
  FileBarChart,
  Settings,
  LogOut,
  FolderOpen,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ConfirmDialog from '@/components/ConfirmDialog'

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

interface AppSidebarProps {
  userName: string
  onOpenSettings: () => void
}

function CollapsibleWithState({
  item,
  isParentActive,
  pathname,
  onNavigate,
}: {
  item: NavItem
  isParentActive: boolean
  pathname: string
  onNavigate: (href: string) => void
}) {
  const [open, setOpen] = useState(isParentActive)

  // Sync open state when parent becomes active (e.g. direct navigation)
  useEffect(() => {
    if (isParentActive) setOpen(true)
  }, [isParentActive])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.label} />}>
          {item.icon}
          <span>{item.label}</span>
        </CollapsibleTrigger>
        <SidebarMenuAction
          className={cn("transition-transform duration-200", open && "rotate-90")}
        >
          <ChevronRight className="h-4 w-4" />
        </SidebarMenuAction>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={pathname.startsWith(child.href)}
                  onClick={() => onNavigate(child.href)}
                >
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export default function AppSidebar({ userName, onOpenSettings }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { setOpenMobile } = useSidebar()
  const [dark, setDark] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark =
      stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function handleLogout() {
    setLogoutConfirmOpen(true)
  }

  async function handleLogoutConfirm() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function navigateTo(href: string) {
    router.push(href)
    setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={SCHOOL_NAME}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src="/images/logo.jpg"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-cover"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {SCHOOL_NAME}
                </span>
                {userName && (
                  <span className="truncate text-xs text-sidebar-muted-foreground">
                    {userName}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isParentActive =
                  item.children?.some((c) => pathname.startsWith(c.href)) ?? false
                const hasChildren = item.children && item.children.length > 0

                if (!hasChildren) {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        onClick={() => navigateTo(item.href)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <CollapsibleWithState
                    key={item.href}
                    item={item}
                    isParentActive={isParentActive}
                    pathname={pathname}
                    onNavigate={navigateTo}
                  />
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Pengaturan"
              onClick={() => {
                onOpenSettings()
                setOpenMobile(false)
              }}
            >
              <Settings className="w-5 h-5" />
              <span>Pengaturan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={dark ? 'Mode Terang' : 'Mode Gelap'}
              onClick={toggleTheme}
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{dark ? 'Mode Terang' : 'Mode Gelap'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Keluar?"
        description="Yakin ingin keluar dari akun Anda?"
        confirmText="Keluar"
        onConfirm={handleLogoutConfirm}
      />
    </Sidebar>
  )
}
