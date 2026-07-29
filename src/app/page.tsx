import Image from 'next/image'
import Link from 'next/link'
import ParentSearchWizard from '@/components/public/ParentSearchWizard'
import { getPublicClassesAction } from '@/lib/actions/public'
import { Button } from '@/components/ui/Button'
import { BookOpen, LogIn } from 'lucide-react'

export default async function LandingPage() {
  const classes = await getPublicClassesAction()

  return (
    <div className="relative min-h-screen bg-background text-text flex flex-col justify-between overflow-hidden">
      {/* Glow blobs background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/5 blur-3xl pointer-events-none animate-pulse duration-10000" />

      {/* Navigation Header */}
      <header className="relative w-full max-w-6xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={38}
            height={38}
            className="w-9 h-9 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
          />
          <div>
            <h1 className="text-sm font-bold leading-tight text-text">SMA Islam Bunga Bangsa</h1>
            <p className="text-[10px] text-text-muted">E-Raport Tahfidz</p>
          </div>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer text-xs font-semibold">
            <LogIn className="w-3.5 h-3.5" />
            Login Guru
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-20 max-w-4xl mx-auto w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Portal Wali Murid</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text leading-[1.15]">
            Sistem Informasi <br/>
            <span className="bg-gradient-to-r from-primary to-primary-medium bg-clip-text text-transparent">Hafalan & Raport Santri</span>
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto leading-relaxed">
            Selamat datang di portal e-raport SMA Islam Bunga Bangsa. Pantau progres hafalan Quran ananda secara real-time, transparan, dan lengkap.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="w-full">
          <ParentSearchWizard classes={classes} />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 border-t border-border/20 text-center">
        <p className="text-[11px] font-medium text-text-muted">
          &copy; {new Date().getFullYear()} SMA Islam Bunga Bangsa. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  )
}
