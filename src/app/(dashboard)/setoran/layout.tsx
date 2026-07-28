import { redirect } from 'next/navigation'

export default function SetoranLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
