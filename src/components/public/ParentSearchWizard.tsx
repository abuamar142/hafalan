'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Combobox, Button } from '@cloudflare/kumo'
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
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null)

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

  // Combobox items (raw data passed directly)
  const classItems = classes
  const groupItems = groups
  const studentItems = students

  // Fetch groups when selectedClass changes
  useEffect(() => {
    if (!selectedClass) {
      setGroups([])
      setSelectedGroup(null)
      return
    }

    async function loadGroups() {
      setLoadingGroups(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, nama:name')
          .eq('class_id', selectedClass!.id)
          .order('name', { ascending: true })

        if (error) throw error
        setGroups(data || [])
        setSelectedGroup(null)
      } catch (e: unknown) {
        setError('Gagal memuat data kelompok.')
      } finally {
        setLoadingGroups(false)
      }
    }

    loadGroups()
  }, [selectedClass])

  // Fetch students when selectedGroup changes
  useEffect(() => {
    if (!selectedGroup) {
      setStudents([])
      setSelectedStudent(null)
      return
    }

    async function loadStudents() {
      setLoadingStudents(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, nama, color')
          .eq('group_id', selectedGroup!.id)
          .order('nama', { ascending: true })

        if (error) throw error
        setStudents(data || [])
        setSelectedStudent(null)
      } catch (e: unknown) {
        setError('Gagal memuat data santri.')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [selectedGroup])

  function handleGoToReport() {
    if (selectedStudent) {
      router.push(`/raport/${selectedStudent.id}`)
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="max-w-4xl mx-auto rounded-lg border-l-[3px] border-red bg-red/10 px-4 py-2.5 text-xs text-red font-semibold animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Spacious, integrated horizontal search panel */}
      <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-md p-6 shadow-xl relative group hover:border-primary/20 transition-all duration-500">
        
        {/* Glow Blobs within Panel */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/8 transition-all duration-500" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/8 transition-all duration-500" />

        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          {/* Step 1: Kelas */}
          <div className="md:col-span-3 space-y-2">
            <label htmlFor="class-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              1. Pilih Kelas
            </label>
            <Combobox
              items={classItems}
              value={selectedClass}
              onValueChange={setSelectedClass}
              itemToStringLabel={(item: ClassData) => item.nama}
            >
              <Combobox.TriggerInput id="class-select" placeholder="Pilih kelas..." />
              <Combobox.Content>
                <Combobox.List>
                  {(item: ClassData) => <Combobox.Item value={item}>{item.nama}</Combobox.Item>}
                </Combobox.List>
                <Combobox.Empty>Kelas tidak ditemukan</Combobox.Empty>
              </Combobox.Content>
            </Combobox>
          </div>

          {/* Step 2: Kelompok */}
          <div className="md:col-span-3 space-y-2">
            <label htmlFor="group-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              2. Pilih Halaqah
            </label>
            {loadingGroups ? (
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/40 text-xs text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                Memuat halaqah...
              </div>
            ) : (
              <div className={!selectedClass ? "opacity-60 pointer-events-none" : ""}>
                <Combobox
                  items={groupItems}
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                  itemToStringLabel={(item: GroupData) => item.nama}
                >
                  <Combobox.TriggerInput id="group-select" placeholder={selectedClass ? "Pilih kelompok..." : "Pilih kelas dahulu"} />
                  <Combobox.Content>
                    <Combobox.List>
                      {(item: GroupData) => <Combobox.Item value={item}>{item.nama}</Combobox.Item>}
                    </Combobox.List>
                    <Combobox.Empty>Kelompok tidak ditemukan</Combobox.Empty>
                  </Combobox.Content>
                </Combobox>
              </div>
            )}
          </div>

          {/* Step 3: Santri */}
          <div className="md:col-span-4 space-y-2">
            <label htmlFor="student-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              3. Pilih Santri
            </label>
            {loadingStudents ? (
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card/40 text-xs text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                Memuat santri...
              </div>
            ) : (
              <div className={!selectedGroup ? "opacity-60 pointer-events-none" : ""}>
                <Combobox
                  items={studentItems}
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  itemToStringLabel={(item: StudentData) => item.nama}
                >
                  <Combobox.TriggerInput id="student-select" placeholder={selectedGroup ? "Pilih nama santri..." : "Pilih halaqah dahulu"} />
                  <Combobox.Content>
                    <Combobox.List>
                      {(item: StudentData) => <Combobox.Item value={item}>{item.nama}</Combobox.Item>}
                    </Combobox.List>
                    <Combobox.Empty>Santri tidak ditemukan</Combobox.Empty>
                  </Combobox.Content>
                </Combobox>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={handleGoToReport}
              disabled={!selectedStudent}
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
