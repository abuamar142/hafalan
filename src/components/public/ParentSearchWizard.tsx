'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api-client'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/app/alert'
import { Loader2, Search, School, Users, GraduationCap } from 'lucide-react'

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

const STEPS = [
  { n: 1, label: 'Kelas', icon: School },
  { n: 2, label: 'Halaqah', icon: Users },
  { n: 3, label: 'Santri', icon: GraduationCap },
] as const

export default function ParentSearchWizard() {
  const router = useRouter()

  // Pilihan
  const [classId, setClassId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [studentId, setStudentId] = useState('')

  // Opsi yang dimuat
  const [classes, setClasses] = useState<ClassData[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])

  // Status
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      setError('')
      try {
        const data = await apiGet<ClassData[]>('/api/public/classes')
        setClasses(data || [])
      } catch {
        setError('Gagal memuat data kelas.')
      }
    }
    loadClasses()
  }, [])

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        id: c.id,
        label: c.nama,
        searchText: c.nama.toLowerCase(),
      })),
    [classes]
  )

  const groupOptions = useMemo(
    () =>
      groups.map((g) => ({
        id: g.id,
        label: g.nama,
        searchText: g.nama.toLowerCase(),
      })),
    [groups]
  )

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        label: s.nama,
        searchText: s.nama.toLowerCase(),
      })),
    [students]
  )

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
        const data = await apiGet<GroupData[]>(
          `/api/public/groups?classId=${Number(classId)}`
        )
        setGroups(data || [])
        setGroupId('')
      } catch {
        setError('Gagal memuat data kelompok.')
      } finally {
        setLoadingGroups(false)
      }
    }

    loadGroups()
  }, [classId])

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
        const data = await apiGet<StudentData[]>(
          `/api/public/students?groupId=${Number(groupId)}`
        )
        setStudents(data || [])
        setStudentId('')
      } catch {
        setError('Gagal memuat data santri.')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [groupId])

  function handleGoToReport() {
    if (studentId) router.push(`/raport/${studentId}`)
  }

  // Langkah aktif untuk indikator progres
  const activeStep = studentId ? 4 : groupId ? 3 : classId ? 2 : 1

  return (
    <div className="w-full space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-card backdrop-blur-xl sm:p-7">
        {/* Indikator langkah */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((step, i) => {
            const done = activeStep > step.n
            const current = activeStep === step.n
            return (
              <div key={step.n} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-7 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                      done
                        ? 'bg-primary text-primary-foreground'
                        : current
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <step.icon className="size-3.5" /> : step.n}
                  </span>
                  <span
                    className={`hidden text-xs font-semibold sm:block ${
                      current || done
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 ? (
                  <span
                    className={`h-px flex-1 rounded-full transition-colors ${
                      done ? 'bg-primary/40' : 'bg-border'
                    }`}
                  />
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Form pencarian */}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          {/* Langkah 1 — Kelas */}
          <div className="space-y-2 md:col-span-3">
            <label
              htmlFor="class-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              1. Pilih Kelas
            </label>
            <Combobox
              id="class-select"
              options={classOptions}
              value={classId}
              onChange={(val) => {
                setClassId(val)
                setGroupId('')
                setStudentId('')
              }}
              placeholder="Pilih kelas..."
              searchPlaceholder="Ketik nama kelas..."
              emptyText="Kelas tidak ditemukan"
            />
          </div>

          {/* Langkah 2 — Halaqah */}
          <div className="space-y-2 md:col-span-3">
            <label
              htmlFor="group-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              2. Pilih Halaqah
            </label>
            {loadingGroups ? (
              <div className="flex h-10 w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin text-primary" />
                Memuat halaqah...
              </div>
            ) : (
              <Combobox
                id="group-select"
                options={groupOptions}
                value={groupId}
                onChange={(val) => {
                  setGroupId(val)
                  setStudentId('')
                }}
                placeholder={classId ? 'Pilih kelompok...' : 'Pilih kelas dahulu'}
                searchPlaceholder="Ketik nama kelompok..."
                emptyText="Kelompok tidak ditemukan"
                className={!classId ? 'pointer-events-none opacity-60' : ''}
              />
            )}
          </div>

          {/* Langkah 3 — Santri */}
          <div className="space-y-2 md:col-span-4">
            <label
              htmlFor="student-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              3. Pilih Santri
            </label>
            {loadingStudents ? (
              <div className="flex h-10 w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin text-primary" />
                Memuat santri...
              </div>
            ) : (
              <Combobox
                id="student-select"
                options={studentOptions}
                value={studentId}
                onChange={setStudentId}
                placeholder={
                  groupId ? 'Pilih nama santri...' : 'Pilih halaqah dahulu'
                }
                searchPlaceholder="Ketik nama santri..."
                emptyText="Santri tidak ditemukan"
                className={!groupId ? 'pointer-events-none opacity-60' : ''}
              />
            )}
          </div>

          {/* Aksi */}
          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={handleGoToReport}
              disabled={!studentId}
              className="h-10 w-full gap-2 font-bold"
            >
              <Search className="size-4" />
              Cari Rapor
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
