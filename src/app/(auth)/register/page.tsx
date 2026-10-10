'use client'

import Image from 'next/image'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiPost } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/app/alert'
import { Eye, EyeOff } from 'lucide-react'
import { SCHOOL_NAME } from '@/lib/constants'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !username.trim() || !password) {
      setError('Semua field wajib diisi.')
      return
    }
    if (username.trim().length < 3) {
      setError('Username minimal 3 karakter.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)

    try {
      await apiPost('/api/auth/register', { name, username, password })
      router.push('/santri')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mendaftar')
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Latar dekoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[130px]"
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/70 bg-card/85 p-8 shadow-card backdrop-blur-xl sm:p-10">
        {/* Merek */}
        <div className="mb-8 text-center">
          <Image
            src="/images/logo.jpg"
            alt="Logo Hafalan"
            width={72}
            height={72}
            className="mx-auto mb-4 size-[72px] rounded-2xl object-cover ring-1 ring-border"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Akun
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {SCHOOL_NAME}
          </p>
        </div>

        {error ? (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-[13px] font-semibold text-foreground"
            >
              Nama Lengkap (Ustadz / Ustadzah)
            </label>
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-[13px] font-semibold text-foreground"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Minimal 3 karakter"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full text-[15px] font-semibold"
          >
            {loading ? 'Mendaftar...' : 'Daftar Akun'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  )
}
