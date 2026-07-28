import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hafalan — SMA Islam Bunga Bangsa',
  description: 'Catat hafalan & setoran santri',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
