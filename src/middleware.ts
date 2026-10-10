import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt'

export default async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  const { pathname } = request.nextUrl
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/raport') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/public')

  if (!session && !isPublic) {
    // API: balas JSON 401, jangan redirect (klien fetch tidak menangani redirect HTML).
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Sudah login tapi membuka halaman auth → arahkan ke dashboard.
  if (session && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/santri'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
