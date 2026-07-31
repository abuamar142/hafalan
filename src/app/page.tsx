import Image from 'next/image'
import Link from 'next/link'
import ParentSearchWizard from '@/components/public/ParentSearchWizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, LogIn, School, Users, FileBarChart, Sparkles } from 'lucide-react'
import { SCHOOL_NAME } from '@/lib/constants'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* Repeating Islamic Geometric Pattern */}
      <div className="absolute inset-0 text-primary/10 opacity-[0.04] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M40 12 L68 40 L40 68 L12 40 Z" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <path d="M40 24 L56 40 L40 56 L24 40 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="3" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/5 blur-3xl pointer-events-none animate-pulse duration-10000" />

      {/* Navigation Header */}
      <header className="relative w-full max-w-6xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between border-b border-border/20 z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={38}
            height={38}
            className="w-9 h-9 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
          />
          <div>
            <h1 className="text-sm font-bold leading-tight text-foreground">{SCHOOL_NAME}</h1>
            <p className="text-[10px] text-muted-foreground">E-Raport Tahfidz</p>
          </div>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer text-xs font-semibold hover:bg-card">
            <LogIn className="w-3.5 h-3.5" />
            Login Guru
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-20 max-w-5xl mx-auto w-full space-y-12 z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Portal Wali Murid</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Sistem Informasi <br/>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hafalan & Raport Santri</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Pantau progres hafalan Quran ananda secara berkala, transparan, dan lengkap langsung dari rumah.
          </p>
        </div>

        {/* Wizard Card Wrapper */}
        <div className="w-full max-w-4xl mx-auto">
          <ParentSearchWizard />
        </div>

        {/* Portal Guide (3-Step Visual Instruction) */}
        <div className="w-full max-w-4xl space-y-6 pt-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-bounce" />
              Petunjuk Pencarian
            </div>
            <h3 className="text-lg font-extrabold text-foreground">Panduan Cek Rapor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">1. Pilih Kelas</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pilih kelas aktif ananda dari daftar dropdown langkah pertama.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">2. Pilih Halaqah</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tentukan nama ustadz pembina atau kelompok halaqah ananda.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">3. Lihat Raport</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pilih nama ananda, lalu tekan tombol untuk menampilkan raport hafalan lengkap.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 border-t border-border/20 text-center z-10">
        <p className="text-[11px] font-medium text-muted-foreground">
          &copy; {new Date().getFullYear()} {SCHOOL_NAME}. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  )
}
