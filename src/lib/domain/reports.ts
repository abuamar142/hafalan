import { ALL_SURAHS } from '../constants'
import {
  getPct,
  getPctFromCount,
  getTotalHafal,
  getJuzSurahsFromHafalan,
  getJuzSelesaiFromHafalan,
  getSurahNama,
  getColor,
  initials,
  nowStr,
  formatWaktu,
} from '../helpers'
import type { SantriWithCount, SetoranItem } from '../types'

// ── Types ──

export interface ReportStats {
  totalStudents: number
  totalHafal: number
  averageHafal: number
  averagePct: number
}

interface ReportStudent {
  id: number
  nama: string
  kelas: string
  usia?: string
  color?: string
  hafal_count: number
}

interface Submission {
  id: number
  santri_id: number
  santri_nama: string
  surah_no: number
  nilai: string
  catatan: string
  waktu: string
  ayat_start: number | null
  ayat_end: number | null
}

// ── Statistics ──

/**
 * Compute report-level aggregate statistics.
 */
export function computeReportStats(
  studentsWithCount: SantriWithCount[],
): ReportStats {
  const totalStudents = studentsWithCount.length
  const totalHafal = studentsWithCount.reduce(
    (sum, s) => sum + getTotalHafal(s),
    0,
  )
  const averageHafal =
    totalStudents > 0 ? Math.round(totalHafal / totalStudents) : 0
  const averagePct =
    totalStudents > 0
      ? Math.round(
          studentsWithCount.reduce((sum, s) => sum + getPct(s), 0) /
            totalStudents,
        )
      : 0

  return { totalStudents, totalHafal, averageHafal, averagePct }
}

// ── Collective Report ──

export interface CollectiveReportInput {
  students: SantriWithCount[]
  submissions: SetoranItem[]
  guruName: string
  /** student_id → { surah_no → status } */
  fullMemorization: Record<number, Record<number, number>>
}

/**
 * Generate HTML for the collective (kolektif) report.
 */
export function generateCollectiveReport(
  input: CollectiveReportInput,
): string {
  const { students, submissions, guruName, fullMemorization } = input

  const stats = computeReportStats(students)

  // Build ranking rows
  const rows = students
    .map((s, i) => {
      const hf = fullMemorization[s.id] || {}
      const hafal = Object.values(hf).filter((v) => v === 1).length
      const juzSelesai = getJuzSelesaiFromHafalan(hf)
      const p = getPct(s)
      const subCount = submissions.filter((sub) => sub.santri_id === s.id).length

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center">${i + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-weight:500">${s.nama}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center;color:#666">${s.kelas || '-'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center">${hafal}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center">${juzSelesai}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;height:6px;background:#e5e5e5;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${p}%;background:#1D9E75;border-radius:3px"></div>
              </div>
              <span style="font-size:12px;font-weight:500;min-width:32px">${p}%</span>
            </div>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center">${subCount}</td>
        </tr>`
    })
    .join('')

  // Latest submissions
  const latestSubs = [...submissions]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10)
    .map(
      (sub) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.santri_nama}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${getSurahNama(sub.surah_no)}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `\u2013${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${sub.nilai}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan || '-'}</td>
        </tr>`,
    )
    .join('')

  return `
      <div style="font-family:system-ui,sans-serif;color:#2C2C2A;max-width:800px;margin:0 auto">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:18px;font-weight:700">SMA Islam Bunga Bangsa</div>
          <div style="font-size:14px;color:#5F5E5A;margin-top:4px">Laporan Kolektif \u00B7 ${guruName || '-'}</div>
          <div style="font-size:12px;color:#888780;margin-top:2px">${nowStr()}</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${stats.totalStudents}</div>
            <div style="font-size:11px;color:#5F5E5A">Total Santri</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${stats.averageHafal}</div>
            <div style="font-size:11px;color:#5F5E5A">Rata-rata Hafal</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#1D9E75">${stats.averagePct}%</div>
            <div style="font-size:11px;color:#5F5E5A">Rata-rata Progress</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${submissions.length}</div>
            <div style="font-size:11px;color:#5F5E5A">Total Setoran</div>
          </div>
        </div>

        <div style="margin-bottom:24px">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px">Ranking Santri</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#F1EFE8">
                <th style="padding:8px 12px;text-align:center;font-weight:600;border-radius:6px 0 0 0">#</th>
                <th style="padding:8px 12px;text-align:left;font-weight:600">Nama</th>
                <th style="padding:8px 12px;text-align:center;font-weight:600">Kelas</th>
                <th style="padding:8px 12px;text-align:center;font-weight:600">Surah</th>
                <th style="padding:8px 12px;text-align:center;font-weight:600">Juz</th>
                <th style="padding:8px 12px;text-align:left;font-weight:600">Progress</th>
                <th style="padding:8px 12px;text-align:center;font-weight:600;border-radius:0 6px 0 0">Setoran</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        ${latestSubs ? `
        <div>
          <div style="font-size:14px;font-weight:600;margin-bottom:8px">10 Setoran Terakhir</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#F1EFE8">
                <th style="padding:6px 10px;text-align:left;font-weight:600;border-radius:6px 0 0 0">Santri</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600">Surah</th>
                <th style="padding:6px 10px;text-align:center;font-weight:600">Nilai</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600">Tanggal</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600;border-radius:0 6px 0 0">Catatan</th>
              </tr>
            </thead>
            <tbody>${latestSubs}</tbody>
          </table>
        </div>` : ''}

        <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#5F5E5A">
          <div></div>
          <div style="text-align:center">
            <div>Dicetak pada ${nowStr()}</div>
            <div style="margin-top:4px">(${guruName || '-'})</div>
          </div>
        </div>
      </div>`
}

// ── Individual Report ──

export interface IndividualReportInput {
  student: ReportStudent
  /** surah_no → status */
  hafalan: Record<number, number>
  submissions: Submission[]
  guruName: string
}

/**
 * Generate HTML for the individual (individu) report.
 */
export function generateIndividualReport(
  input: IndividualReportInput,
): string {
  const { student, hafalan, submissions, guruName } = input

  const hafalCount = Object.values(hafalan).filter((v) => v === 1).length
  const p = getPctFromCount(hafalCount)
  const juzSelesai = getJuzSelesaiFromHafalan(hafalan)

  // Juz grid
  const juzCells = [...Array(30)]
    .map((_, i) => {
      const j = i + 1
      const jp = getJuzSurahsFromHafalan(hafalan, j)
      const bg = jp === 100 ? '#1D9E75' : jp > 0 ? '#BA7517' : '#e5e5e5'
      const fg = jp === 100 ? '#fff' : jp > 0 ? '#BA7517' : '#999'
      return `
        <div style="width:48px;height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:6px;background:${bg};color:${fg};font-size:13px;font-weight:600">
          ${j}
          ${jp > 0 ? `<div style="font-size:9px;font-weight:400">${jp}%</div>` : ''}
        </div>`
    })
    .join('')

  // Memorized and murajaah surahs
  const hafalSurahs = ALL_SURAHS.filter((s) => hafalan[s.no] === 1)
  const murajaahSurahs = ALL_SURAHS.filter((s) => hafalan[s.no] === 2)

  // Submissions table
  const subRows = submissions
    .slice(0, 20)
    .map(
      (sub) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${getSurahNama(sub.surah_no)}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `\u2013${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${sub.nilai}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).jam}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan || '-'}</td>
        </tr>`,
    )
    .join('')

  return `
      <div style="font-family:system-ui,sans-serif;color:#2C2C2A;max-width:800px;margin:0 auto">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:18px;font-weight:700">SMA Islam Bunga Bangsa</div>
          <div style="font-size:14px;color:#5F5E5A;margin-top:4px">Laporan Individu</div>
          <div style="font-size:12px;color:#888780;margin-top:2px">${nowStr()}</div>
        </div>

        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:12px;background:#F1EFE8;border-radius:10px">
          <div style="width:48px;height:48px;border-radius:50%;background:${getColor(student, 0)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:500">${initials(student.nama)}</div>
          <div>
            <div style="font-size:15px;font-weight:600">${student.nama}</div>
            <div style="font-size:12px;color:#5F5E5A">${student.kelas || 'Tanpa kelas'}${student.usia ? ` \u00B7 ${student.usia} th` : ''}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
          <div style="background:#F1EFE8;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:18px;font-weight:700">${hafalCount}</div>
            <div style="font-size:11px;color:#5F5E5A">Surah Hafal</div>
          </div>
          <div style="background:#F1EFE8;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:18px;font-weight:700">${juzSelesai}</div>
            <div style="font-size:11px;color:#5F5E5A">Juz Selesai</div>
          </div>
          <div style="background:#F1EFE8;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#1D9E75">${p}%</div>
            <div style="font-size:11px;color:#5F5E5A">Progress</div>
          </div>
        </div>

        <div style="margin-bottom:20px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Grid Juz</div>
          <div style="display:grid;grid-template-columns:repeat(6,48px);gap:6px">
            ${juzCells}
          </div>
        </div>

        ${
          hafalSurahs.length
            ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px">Hafalan (${hafalSurahs.length} surah)</div>
          <div style="font-size:12px;color:#5F5E5A;line-height:1.8">
            ${hafalSurahs.map((s) => s.nama).join(', ')}
          </div>
        </div>`
            : ''
        }

        ${
          murajaahSurahs.length
            ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;color:#BA7517">Murajaah (${murajaahSurahs.length} surah)</div>
          <div style="font-size:12px;color:#5F5E5A;line-height:1.8">
            ${murajaahSurahs.map((s) => s.nama).join(', ')}
          </div>
        </div>`
            : ''
        }

        ${
          submissions.length
            ? `
        <div style="margin-bottom:24px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Riwayat Setoran (${submissions.length})</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#F1EFE8">
                <th style="padding:6px 10px;text-align:left;font-weight:600;border-radius:6px 0 0 0">Surah</th>
                <th style="padding:6px 10px;text-align:center;font-weight:600">Nilai</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600">Tanggal</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600">Jam</th>
                <th style="padding:6px 10px;text-align:left;font-weight:600;border-radius:0 6px 0 0">Catatan</th>
              </tr>
            </thead>
            <tbody>${subRows}</tbody>
          </table>
        </div>`
            : ''
        }

        <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#5F5E5A">
          <div></div>
          <div style="text-align:right">
            <div>Dicetak pada ${nowStr()}</div>
            <div style="margin-top:2px">(${guruName || '-'})</div>
            <div style="margin-top:24px;border-top:1px solid #2C2C2A;width:160px;padding-top:4px">Tanda Tangan Guru</div>
          </div>
        </div>
      </div>`
}
