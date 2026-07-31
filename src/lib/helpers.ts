import { ALL_SURAHS, AVATAR_COLORS, TARGET_JUZ } from './constants'
import type { SantriWithCount } from './types'

export function getJuzSurahs(juz: number) {
  return ALL_SURAHS.filter((s) => s.juz === juz)
}

export function getPct(s: SantriWithCount) {
  return Math.round(((s.juz_selesai || 0) / TARGET_JUZ) * 100)
}

export function getTotalHafal(s: SantriWithCount) {
  return s.hafal_count || 0
}

export function getJuzSurahsFromHafalan(
  hafalan: Record<number, number>,
  juz: number
) {
  const ss = getJuzSurahs(juz)
  return ss.length
    ? Math.round(
        (ss.filter((x) => (hafalan[x.no] || 0) === 1).length / ss.length) *
          100
      )
    : 0
}

export function getJuzSelesaiFromHafalan(hafalan: Record<number, number>) {
  return [...Array(30)].filter(
    (_, i) => getJuzSurahsFromHafalan(hafalan, i + 1) === 100
  ).length
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function getColor(s: { color?: string }, i: number) {
  return s.color || AVATAR_COLORS[i % AVATAR_COLORS.length]
}

export function nowStr() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getSurahNama(no: number) {
  const s = ALL_SURAHS.find((x) => x.no === no)
  return s ? s.nama : 'Surah ' + no
}

/**
 * Convert ISO timestamptz to local display format.
 * Uses user's browser timezone (auto-detected).
 */
export function formatWaktu(iso: string): { tanggal: string; jam: string } {
  const d = new Date(iso)
  return {
    tanggal: d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    jam: d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
