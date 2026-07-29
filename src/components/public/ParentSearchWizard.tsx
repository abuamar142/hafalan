'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPublicGroupsAction, getPublicStudentsAction } from '@/lib/actions/public'
import { Combobox } from '@/components/ui/Combobox'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Check, ArrowRight, School, Users, User, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface ClassData {
  id: number
  nama: string
}

interface GroupData {
  id: number
  nama: string
}

interface StudentData {
  id: number
  nama: string
  color: string
}

export default function ParentSearchWizard({ classes }: { classes: ClassData[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Selections
  const [classId, setClassId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [studentId, setStudentId] = useState('')

  // Loaded Options
  const [groups, setGroups] = useState<GroupData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])

  // States
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState('')

  // Map Classes to Combobox Options
  const classOptions = useMemo(() => {
    return classes.map((c) => ({
      id: c.id,
      label: c.nama,
      searchText: c.nama.toLowerCase(),
    }))
  }, [classes])

  // Map Groups to Combobox Options
  const groupOptions = useMemo(() => {
    return groups.map((g) => ({
      id: g.id,
      label: g.nama,
      searchText: g.nama.toLowerCase(),
    }))
  }, [groups])

  // Map Students to Combobox Options
  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      id: s.id,
      label: s.nama,
      searchText: s.nama.toLowerCase(),
    }))
  }, [students])

  // Fetch groups when classId changes
  useEffect(() => {
    if (!classId) {
      setGroups([])
      setGroupId('')
      return
    }

    async function loadGroups() {
      setLoadingGroups(true)
      setError('')
      try {
        const res = await getPublicGroupsAction(Number(classId))
        setGroups(res)
        setGroupId('')
      } catch (e: unknown) {
        setError('Gagal memuat data kelompok. Silakan coba lagi.')
      } finally {
        setLoadingGroups(false)
      }
    }

    loadGroups()
  }, [classId])

  // Fetch students when groupId changes
  useEffect(() => {
    if (!groupId) {
      setStudents([])
      setStudentId('')
      return
    }

    async function loadStudents() {
      setLoadingStudents(true)
      setError('')
      try {
        const res = await getPublicStudentsAction(Number(groupId))
        setStudents(res)
        setStudentId('')
      } catch (e: unknown) {
        setError('Gagal memuat data santri. Silakan coba lagi.')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [groupId])

  function handleNextStep() {
    if (step === 1 && classId) {
      setStep(2)
    } else if (step === 2 && groupId) {
      setStep(3)
    }
  }

  function handlePrevStep() {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  function handleGoToReport() {
    if (studentId) {
      router.push(`/raport/${studentId}`)
    }
  }

  // Step indicator icon renderer
  const renderStepIcon = (stepNum: number, IconComponent: React.ComponentType<any>) => {
    const isCompleted = step > stepNum
    const isActive = step === stepNum

    return (
      <div className="flex flex-col items-center flex-1 relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
            isCompleted
              ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105'
              : isActive
                ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/10 scale-105 font-bold'
                : 'bg-surface border-border text-text-muted'
          }`}
        >
          {isCompleted ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
        </div>
        <span
          className={`text-[11px] font-semibold tracking-wide uppercase mt-2.5 transition-colors duration-300 ${
            isActive ? 'text-primary' : isCompleted ? 'text-text-secondary' : 'text-text-muted'
          }`}
        >
          {stepNum === 1 ? 'Kelas' : stepNum === 2 ? 'Kelompok' : 'Santri'}
        </span>

        {stepNum < 3 && (
          <div
            className={`absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 -translate-y-1/2 transition-colors duration-500 rounded-full ${
              step > stepNum ? 'bg-primary' : 'bg-border/60'
            }`}
          />
        )}
      </div>
    )
  }

  return (
    <Card className="max-w-md w-full mx-auto border-border/40 shadow-2xl bg-surface/85 backdrop-blur-md overflow-hidden relative group hover:border-primary/30 hover:shadow-primary/5 transition-all duration-300">
      {/* Decorative Glow inside Card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-colors duration-500" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/15 transition-colors duration-500" />

      {/* Glassmorphism Header */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-transparent px-6 py-7 border-b border-border/30 text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wider uppercase mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Pencarian Rapor
        </div>
        <h3 className="text-lg font-bold text-text">Cari Rapor Santri</h3>
        <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
          Silakan lengkapi langkah di bawah untuk mengakses raport hafalan ananda.
        </p>
      </div>

      <CardContent className="p-6 relative space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 pt-2 pb-4">
          {renderStepIcon(1, School)}
          {renderStepIcon(2, Users)}
          {renderStepIcon(3, User)}
        </div>

        {error && (
          <div className="rounded-lg border-l-[3px] border-red bg-red/10 px-3.5 py-2.5 text-xs text-red font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </div>
        )}

        {/* Wizard Forms */}
        <div className="min-h-[90px] flex items-center" key={step}>
          {step === 1 && (
            <div className="w-full space-y-2 animate-in fade-in slide-in-from-right-3 duration-300">
              <label htmlFor="class-wizard-select" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Langkah 1: Pilih Kelas
              </label>
              <Combobox
                id="class-wizard-select"
                options={classOptions}
                value={classId}
                onChange={setClassId}
                placeholder="Pilih kelas ananda..."
                searchPlaceholder="Ketik nama kelas..."
                emptyText="Kelas tidak ditemukan"
              />
            </div>
          )}

          {step === 2 && (
            <div className="w-full space-y-2 animate-in fade-in slide-in-from-right-3 duration-300">
              <label htmlFor="group-wizard-select" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Langkah 2: Pilih Kelompok Halaqah
              </label>
              {loadingGroups ? (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/30 text-xs text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                  Memuat data halaqah...
                </div>
              ) : (
                <Combobox
                  id="group-wizard-select"
                  options={groupOptions}
                  value={groupId}
                  onChange={setGroupId}
                  placeholder="Pilih kelompok halaqah..."
                  searchPlaceholder="Ketik nama kelompok..."
                  emptyText="Kelompok tidak ditemukan"
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="w-full space-y-2 animate-in fade-in slide-in-from-right-3 duration-300">
              <label htmlFor="student-wizard-select" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Langkah 3: Pilih Nama Santri
              </label>
              {loadingStudents ? (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/30 text-xs text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                  Memuat data santri...
                </div>
              ) : (
                <Combobox
                  id="student-wizard-select"
                  options={studentOptions}
                  value={studentId}
                  onChange={setStudentId}
                  placeholder="Pilih nama santri..."
                  searchPlaceholder="Ketik nama santri..."
                  emptyText="Santri tidak ditemukan"
                />
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={(step === 1 && !classId) || (step === 2 && !groupId)}
              className="gap-2 cursor-pointer"
            >
              Lanjut
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGoToReport}
              disabled={!studentId}
              className="gap-2 bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-md shadow-primary/10"
            >
              Lihat Laporan Raport
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
