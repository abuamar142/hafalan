'use client'
import Image from "next/image";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Semua field wajib diisi.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/santri')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-[var(--radius-lg)] border border-border/50 p-10 shadow-xl bento-shadow relative z-10">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <Image
            src="/images/logo.jpg"
            alt="Logo Hafalan"
            width={80}
            height={80}
            className="w-20 h-20 rounded-lg object-cover mx-auto mb-4 shadow-sm ring-1 ring-border"
          />
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
            Daftar Akun
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Hafalan SMA Islam Bunga Bangsa
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md border-l-[3px] border-red bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
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
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-base shadow-sm mt-4"
          >
            {loading ? 'Mendaftar...' : 'Daftar Akun'}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
