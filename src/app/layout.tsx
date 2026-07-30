import { Inter, Geist } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { cn } from "@/lib/utils";
import { TooltipProvider } from '@/components/ui/tooltip'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Hafalan — SMA Islam Bunga Bangsa',
  description: 'Catat hafalan & setoran santri',
  openGraph: {
    title: 'Hafalan — SMA Islam Bunga Bangsa',
    description: 'Catat hafalan & setoran santri',
    url: 'https://hafalan.abuamar.online',
    siteName: 'Hafalan',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hafalan — SMA Islam Bunga Bangsa',
    description: 'Catat hafalan & setoran santri',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} text-text antialiased selection:bg-primary/20 selection:text-primary`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
