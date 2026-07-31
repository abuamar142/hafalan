// ── Database types (Supabase tables) ──

export interface Student {
  id: number
  group_id: number
  nama: string
  color: string
  group_name?: string
  class_name?: string
  kelas: string
}

export interface Memorization {
  id: number
  student_id: number
  surah_no: number
  status: number // 0=belum, 1=hafal, 2=murajaah
}

export interface Submission {
  id: number
  student_id: number
  surah_no: number
  nilai: string
  catatan: string
  waktu: string
  guru_id: string | null
  ayat_start: number | null
  ayat_end: number | null
  guru_name: string | null
  updated_at?: string | null
  updated_by?: string | null
  updated_by_name?: string | null
}

// ── App-level types ──

export interface Surah {
  no: number
  nama: string
  arab: string
  ayat: number
  juz: number
}

export interface SantriWithCount extends Student {
  hafal_count: number
  juz_selesai: number
}

export interface SetoranItem {
  id: number
  santri_id: number
  santri_nama: string
  surah_no: number
  nilai: string
  catatan: string
  waktu: string
  ayat_start: number | null
  ayat_end: number | null
  guru_id: string | null
  guru_nama: string
  updated_at?: string | null
  updated_by?: string | null
  updated_by_name?: string | null
}

export interface Class {
  id: number
  name: string
  created_at: string
}

export interface Group {
  id: number
  name: string
  created_at: string
  class_id: number | null
  class_name?: string
}

export interface GroupTeacher {
  id: number
  group_id: number
  teacher_id: string
  teacher_name: string
}


