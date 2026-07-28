// ── Database types (Supabase tables) ──

export interface Student {
  id: number
  user_id: string
  nama: string
  kelas: string
  usia: string
  color: string
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
  tanggal: string
  jam: string
  guru_id: string | null
  ayat_start: number | null
  ayat_end: number | null
}

export interface Settings {
  key: string
  value: string
  user_id: string
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
}

export interface SetoranItem {
  id: number
  santri_id: number
  santri_nama: string
  surah_no: number
  nilai: string
  catatan: string
  tanggal: string
  jam: string
  ayat_start: number | null
  ayat_end: number | null
}

export interface ProfileSantri extends Student {
  hafalan: Record<number, number>
  setoran: {
    id: number
    surah_no: number
    nilai: string
    catatan: string
    tanggal: string
    jam: string
    ayat_start: number | null
    ayat_end: number | null
  }[]
}

export interface AppState {
  lembaga: string
  guru: string
  santri: SantriWithCount[]
  setoran: SetoranItem[]
}

export interface DemoSantri {
  id: number
  nama: string
  kelas: string
  usia: string
  color: string
  hafalan: Record<number, number>
}

export interface DemoSetoran {
  id: number
  santri_id: number
  surah_no: number
  nilai: string
  catatan: string
  tanggal: string
  jam: string
  ayat_start: number
  ayat_end: number
}

export interface DemoState {
  lembaga: string
  guru: string
  santri: DemoSantri[]
  setoran: DemoSetoran[]
}
