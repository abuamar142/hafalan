'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/santri')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      
      <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl rounded-[var(--radius-lg)] border border-border/50 p-10 shadow-xl bento-shadow relative z-10">
        
        {/* Brand */}
        <div className="text-center mb-10">
          <img
            src="/images/logo.jpg"
            alt="Logo Hafalan"
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-sm ring-1 ring-border"
          />
          <h1 className="text-2xl font-bold text-text mb-1 tracking-tight">
            Quran Tracker
          </h1>
          <p className="text-sm font-medium text-text-secondary">
            SMA Islam Bunga Bangsa
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md border-l-[3px] border-red bg-red/10 px-4 py-3 text-sm text-red font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-text">
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
            <label htmlFor="password" className="block text-sm font-medium text-text">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-base shadow-sm mt-2"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        {/* Register link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
