import { Geist, Plus_Jakarta_Sans, Amiri } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
})

const amiri = Amiri({
  subsets: ['arabic'],
  variable: '--font-amiri',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Hafalan — SMA Islam Bunga Bangsa',
    template: '%s · Hafalan',
  },
  description:
    'Portal wali murid dan guru untuk memantau hafalan serta raport santri SMA Islam Bunga Bangsa.',
  applicationName: 'Hafalan',
  openGraph: {
    title: 'Hafalan — SMA Islam Bunga Bangsa',
    description: 'Pantau progres hafalan & raport santri secara transparan.',
    url: 'https://hafalan.abuamar.online',
    siteName: 'Hafalan',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hafalan — SMA Islam Bunga Bangsa',
    description: 'Pantau progres hafalan & raport santri secara transparan.',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1120' },
  ],
}

/**
 * Terapkan tema sebelum paint pertama supaya tidak ada kedipan (FOUC)
 * saat pengguna memilih mode gelap.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(geist.variable, jakarta.variable, amiri.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
