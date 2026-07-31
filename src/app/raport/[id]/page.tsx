'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReportDetailClient from '@/components/public/ReportDetailClient'
import { Loader2 } from 'lucide-react'

export default function RaportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const studentId = Number(resolvedParams.id)

  const [student, setStudent] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [memorizations, setMemorizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (isNaN(studentId)) {
      setError('ID Santri tidak valid')
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const [studentRes, submissionsRes, memorizationsRes] = await Promise.all([
          supabase
            .from('students')
            .select(`
              id,
              nama,
              color,
              group:groups (
                id,
                nama:name,
                class:classes (
                  id,
                  nama:name
                )
              )
            `)
            .eq('id', studentId)
            .single(),
          supabase
            .from('submissions')
            .select('*')
            .eq('student_id', studentId)
            .order('waktu', { ascending: false }),
          supabase
            .from('memorization')
            .select('surah_no, status')
            .eq('student_id', studentId)
        ])

        if (studentRes.error) throw studentRes.error
        if (submissionsRes.error) throw submissionsRes.error
        if (memorizationsRes.error) throw memorizationsRes.error

        if (!studentRes.data) {
          throw new Error('Data santri tidak ditemukan')
        }

        setStudent(studentRes.data)
        setSubmissions(submissionsRes.data || [])
        setMemorizations(memorizationsRes.data || [])
      } catch (err: any) {
        console.error('Error fetching raport data:', err)
        setError(err.message || 'Gagal memuat data raport.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat Rapor Santri...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-4 bg-card p-8 rounded-2xl border border-border shadow-lg">
          <h2 className="text-xl font-bold text-destructive">Rapor Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">
            {error || 'Data santri atau riwayat hafalan tidak dapat ditemukan.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
          >
            Kembali ke Pencarian
          </a>
        </div>
      </div>
    )
  }

  return (
    <ReportDetailClient
      student={student}
      submissions={submissions}
      memorizations={memorizations}
    />
  )
}
