'use client'

import { useState, useEffect } from 'react'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { SCHOOL_NAME } from '@/lib/constants'
import {
  LayoutDashboard,
  CheckSquare,
  FileBarChart,
  Settings,
  LogOut,
  FolderOpen,
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
import { ThemeToggle } from '@/components/app/theme-toggle'
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
    icon: <LayoutDashboard />,
  },
  {
    label: 'Manajemen',
    href: '/management',
    icon: <FolderOpen />,
    children: [
      { label: 'Kelas', href: '/kelas' },
      { label: 'Kelompok', href: '/kelompok' },
      { label: 'Siswa', href: '/santri' },
    ],
  },
  {
    label: 'Setoran',
    href: '/setoran',
    icon: <CheckSquare />,
    children: [
      { label: 'Tambah Setoran', href: '/setoran/tambah' },
      { label: 'Riwayat Setoran', href: '/setoran/riwayat' },
    ],
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: <FileBarChart />,
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

  // Buka otomatis saat salah satu anaknya menjadi aktif.
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
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={item.label}
              isActive={isParentActive}
              className="font-medium"
            />
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </CollapsibleTrigger>
        <SidebarMenuAction
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-90'
          )}
        >
          <ChevronRight />
        </SidebarMenuAction>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={pathname.startsWith(child.href)}
                  onClick={() => onNavigate(child.href)}
                  className="cursor-pointer"
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

export default function AppSidebar({
  userName,
  onOpenSettings,
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  async function handleLogoutConfirm() {
    await apiPost('/api/auth/logout', {})
    router.push('/login')
  }

  function navigateTo(href: string) {
    router.push(href)
    setOpenMobile(false)
  }

  const initials =
    (userName || 'Guru')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'G'

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={SCHOOL_NAME}
              className="cursor-default hover:bg-transparent data-active:bg-transparent"
            >
              <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl ring-1 ring-sidebar-border">
                <Image
                  src="/images/logo.jpg"
                  alt="Logo"
                  width={36}
                  height={36}
                  className="size-9 object-cover"
                />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-bold">
                  {SCHOOL_NAME}
                </span>
                <span className="truncate text-[11px] font-medium text-sidebar-foreground/60">
                  E-Raport Tahfidz
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isParentActive =
                  item.children?.some((c) => pathname.startsWith(c.href)) ??
                  false
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
                        className="cursor-pointer font-medium"
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

      <SidebarFooter className="border-t border-sidebar-border/60">
        {/* Identitas pengguna */}
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15 text-xs font-bold text-sidebar-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {userName || 'Guru'}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              Ustadz / Ustadzah
            </p>
          </div>
          <ThemeToggle />
        </div>

        <SidebarSeparator className="mx-0" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Pengaturan"
              onClick={() => {
                onOpenSettings()
                setOpenMobile(false)
              }}
              className="cursor-pointer"
            >
              <Settings />
              <span>Pengaturan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => setLogoutConfirmOpen(true)}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
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
