import Link from 'next/link'
import ParentSearchWizard from '@/components/public/ParentSearchWizard'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/app/brand-mark'
import { ThemeToggle } from '@/components/app/theme-toggle'
import {
  BookOpen,
  LogIn,
  School,
  Users,
  FileBarChart,
  ShieldCheck,
  Clock3,
  HeartHandshake,
} from 'lucide-react'
import { SCHOOL_NAME, SCHOOL_CITY } from '@/lib/constants'

const STEPS = [
  {
    icon: School,
    title: 'Pilih Kelas',
    desc: 'Tentukan kelas aktif ananda dari daftar yang tersedia.',
    tone: 'bg-primary/10 text-primary ring-primary/15',
  },
  {
    icon: Users,
    title: 'Pilih Halaqah',
    desc: 'Pilih kelompok halaqah atau ustadz pembina ananda.',
    tone: 'bg-accent/10 text-accent ring-accent/15',
  },
  {
    icon: FileBarChart,
    title: 'Lihat Raport',
    desc: 'Buka raport hafalan lengkap beserta riwayat setoran.',
    tone: 'bg-purple/10 text-purple ring-purple/15',
  },
] as const

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Transparan',
    desc: 'Progres hafalan tercatat rapi dan dapat dipantau kapan saja.',
  },
  {
    icon: Clock3,
    title: 'Terkini',
    desc: 'Setoran yang dicatat guru langsung tampil di raport ananda.',
  },
  {
    icon: HeartHandshake,
    title: 'Dari Rumah',
    desc: 'Tidak perlu menunggu pembagian raport untuk melihat capaian.',
  },
] as const

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* ── Latar dekoratif ─────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 size-[36rem] rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-32 size-[40rem] rounded-full bg-accent/10 blur-[130px]"
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandMark size={38} subtitle={`Tahfidz · ${SCHOOL_CITY}`} />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" className="gap-2">
                <LogIn className="size-3.5" />
                Login Guru
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Konten utama ────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <BookOpen className="size-3.5" />
            Portal Wali Murid
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-[3.4rem]">
            Sistem Informasi{' '}
            <span className="text-gradient">Hafalan &amp; Raport</span> Santri
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Pantau capaian hafalan Al-Qur&apos;an ananda secara berkala,
            transparan, dan lengkap — langsung dari rumah.
          </p>
        </section>

        {/* Wizard pencarian */}
        <section className="mx-auto mt-10 w-full max-w-4xl sm:mt-12">
          <ParentSearchWizard />
        </section>

        {/* Panduan 3 langkah */}
        <section className="mx-auto mt-16 w-full max-w-4xl sm:mt-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Panduan
            </p>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Cara Melihat Raport
            </h2>
          </div>

          <ol className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="group relative rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 [&_svg]:size-5 ${step.tone}`}
                  >
                    <step.icon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Langkah {i + 1}
                    </p>
                    <h3 className="mt-0.5 text-[15px] font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Nilai tambah */}
        <section className="mx-auto mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 border-t border-border/60 pt-10 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary [&_svg]:size-4">
                <item.icon />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <BrandMark size={32} />
          <p className="text-center text-xs font-medium text-muted-foreground sm:text-right">
            &copy; {new Date().getFullYear()} {SCHOOL_NAME} · Hak Cipta Dilindungi
            Undang-Undang
          </p>
        </div>
      </footer>
    </div>
  )
}
