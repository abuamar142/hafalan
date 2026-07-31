'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Combobox } from '@/components/ui/Combobox'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'

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

export default function ParentSearchWizard() {
  const router = useRouter()
  const supabase = createClient()

  // Selections
  const [classId, setClassId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [studentId, setStudentId] = useState('')

  // Loaded Options
  const [classes, setClasses] = useState<ClassData[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])

  // States
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState('')

  // Fetch classes on mount
  useEffect(() => {
    async function loadClasses() {
      setError('')
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, nama:name')
          .order('name', { ascending: true })

        if (error) throw error
        setClasses(data || [])
      } catch (e: unknown) {
        setError('Gagal memuat data kelas.')
      }
    }
    loadClasses()
  }, [])

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
        const { data, error } = await supabase
          .from('groups')
          .select('id, nama:name')
          .eq('class_id', Number(classId))
          .order('name', { ascending: true })

        if (error) throw error
        setGroups(data || [])
        setGroupId('')
      } catch (e: unknown) {
        setError('Gagal memuat data kelompok.')
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
        const { data, error } = await supabase
          .from('students')
          .select('id, nama, color')
          .eq('group_id', Number(groupId))
          .order('nama', { ascending: true })

        if (error) throw error
        setStudents(data || [])
        setStudentId('')
      } catch (e: unknown) {
        setError('Gagal memuat data santri.')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [groupId])

  function handleGoToReport() {
    if (studentId) {
      router.push(`/raport/${studentId}`)
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="max-w-4xl mx-auto rounded-lg border-l-[3px] border-destructive bg-destructive/10 px-4 py-2.5 text-xs text-destructive font-semibold animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Spacious, integrated horizontal search panel */}
      <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card/80 backdrop-blur-md p-6 shadow-xl relative group hover:border-primary/20 transition-all duration-500">
        
        {/* Glow Blobs within Panel */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/8 transition-all duration-500" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/8 transition-all duration-500" />

        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          {/* Step 1: Kelas */}
          <div className="md:col-span-3 space-y-2">
            <label htmlFor="class-select" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
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

          {/* Step 2: Kelompok */}
          <div className="md:col-span-3 space-y-2">
            <label htmlFor="group-select" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              2. Pilih Halaqah
            </label>
            {loadingGroups ? (
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/40 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
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
                placeholder={classId ? "Pilih kelompok..." : "Pilih kelas dahulu"}
                searchPlaceholder="Ketik nama kelompok..."
                emptyText="Kelompok tidak ditemukan"
                className={!classId ? "opacity-60 pointer-events-none" : ""}
              />
            )}
          </div>

          {/* Step 3: Santri */}
          <div className="md:col-span-4 space-y-2">
            <label htmlFor="student-select" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              3. Pilih Santri
            </label>
            {loadingStudents ? (
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/40 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                Memuat santri...
              </div>
            ) : (
              <Combobox
                id="student-select"
                options={studentOptions}
                value={studentId}
                onChange={setStudentId}
                placeholder={groupId ? "Pilih nama santri..." : "Pilih halaqah dahulu"}
                searchPlaceholder="Ketik nama santri..."
                emptyText="Santri tidak ditemukan"
                className={!groupId ? "opacity-60 pointer-events-none" : ""}
              />
            )}
          </div>

          {/* Action Button */}
          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={handleGoToReport}
              disabled={!studentId}
              className="w-full gap-2 bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10 cursor-pointer h-10 font-bold transition-all text-xs"
            >
              <Search className="w-4 h-4" />
              Cari Rapor
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
