import { ALL_SURAHS } from '../constants'
import {
  getPct,
  getPctFromCount,
  getJuzSurahsFromHafalan,
  getJuzSelesaiFromHafalan,
  getSurahNama,
  getColor,
  initials,
  nowStr,
  formatWaktu,
  escapeHtml,
} from '../helpers'
import type { SantriWithCount, SetoranItem } from '../types'
import { computeReportStats } from './statistics'

// ── Types ──

interface ReportStudent {
  id: number
  nama: string
  kelas: string
  usia?: string
  color?: string
  hafal_count: number
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
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-weight:500">${escapeHtml(s.nama)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center;color:#666">${s.kelas ? escapeHtml(s.kelas) : '-'}</td>
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
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${escapeHtml(sub.santri_nama)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${escapeHtml(getSurahNama(sub.surah_no))}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `\u2013${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${escapeHtml(sub.nilai)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan ? escapeHtml(sub.catatan) : '-'}</td>
        </tr>`,
    )
    .join('')

  return `
      <div style="font-family:system-ui,sans-serif;color:#2C2C2A;max-width:800px;margin:0 auto">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:18px;font-weight:700">SMA Islam Bunga Bangsa</div>
          <div style="font-size:14px;color:#5F5E5A;margin-top:4px">Laporan Kolektif \u00B7 ${escapeHtml(guruName || '-')}</div>
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
            <div style="margin-top:4px">(${escapeHtml(guruName || '-')})</div>
          </div>
        </div>
      </div>`
}

// ── Individual Report ──

export interface IndividualReportInput {
  student: ReportStudent
  /** surah_no → status */
  hafalan: Record<number, number>
  submissions: SetoranItem[]
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
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${escapeHtml(getSurahNama(sub.surah_no))}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `\u2013${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${escapeHtml(sub.nilai)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).jam}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan ? escapeHtml(sub.catatan) : '-'}</td>
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
            <div style="font-size:15px;font-weight:600">${escapeHtml(student.nama)}</div>
            <div style="font-size:12px;color:#5F5E5A">${student.kelas ? escapeHtml(student.kelas) : 'Tanpa kelas'}${student.usia ? ` \u00B7 ${escapeHtml(student.usia)} th` : ''}</div>
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
            ${hafalSurahs.map((s) => escapeHtml(s.nama)).join(', ')}
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
            ${murajaahSurahs.map((s) => escapeHtml(s.nama)).join(', ')}
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
            <div style="margin-top:2px">(${escapeHtml(guruName || '-')})</div>
            <div style="margin-top:24px;border-top:1px solid #2C2C2A;width:160px;padding-top:4px">Tanda Tangan Guru</div>
          </div>
        </div>
      </div>`
}

// ── Development Report ──

export interface DevelopmentReportInput {
  students: SantriWithCount[]
  fullMemorization: Record<number, Record<number, number>>
}

/**
 * Generate HTML for the development (perkembangan) report —
 * a pivot table showing how many students per class have completed each Juz.
 */
export function generateDevelopmentReport(
  input: DevelopmentReportInput,
): string {
  const { students, fullMemorization } = input

  // 1. Group students by kelas
  const classMap = new Map<string, SantriWithCount[]>()
  for (const s of students) {
    const kelas = s.kelas || 'Tanpa Kelas'
    if (!classMap.has(kelas)) classMap.set(kelas, [])
    classMap.get(kelas)!.push(s)
  }

  // 2. For each student, determine which Juz are 100 % complete
  //    studentJuzSet: student id → Set of juz numbers at 100 %
  const studentJuzSet = new Map<number, Set<number>>()
  for (const s of students) {
    const hf = fullMemorization[s.id] || {}
    const juzSet = new Set<number>()
    for (let j = 1; j <= 30; j++) {
      if (getJuzSurahsFromHafalan(hf, j) === 100) juzSet.add(j)
    }
    studentJuzSet.set(s.id, juzSet)
  }

  // 3. Find Juz columns that have ≥ 1 student anywhere
  const allUsedJuz = new Set<number>()
  for (const juzSet of Array.from(studentJuzSet.values())) {
    for (const j of Array.from(juzSet)) allUsedJuz.add(j)
  }
  const juzColumns = Array.from(allUsedJuz).sort((a, b) => a - b)

  // 4. Sort class rows alphabetically
  const sortedClasses = Array.from(classMap.keys()).sort((a, b) => a.localeCompare(b, 'id'))

  // 5. Build pivot data: class → juz → count
  const pivotData = new Map<string, Map<number, number>>()
  for (const kelas of sortedClasses) {
    const juzCounts = new Map<number, number>()
    for (const j of juzColumns) juzCounts.set(j, 0)
      for (const s of classMap.get(kelas)!) {
      const juzSet = studentJuzSet.get(s.id)!
      for (const j of Array.from(juzSet)) {
        if (juzCounts.has(j)) juzCounts.set(j, juzCounts.get(j)! + 1)
      }
    }
    pivotData.set(kelas, juzCounts)
  }

  // 6. Compute totals
  const juzTotals = new Map<number, number>()
  for (const j of juzColumns) juzTotals.set(j, 0)
  let grandTotal = 0
  for (const kelas of sortedClasses) {
    const juzCounts = pivotData.get(kelas)!
    for (const j of juzColumns) {
      const c = juzCounts.get(j)!
      juzTotals.set(j, juzTotals.get(j)! + c)
      grandTotal += c
    }
  }

  // 7. Header / metadata
  const now = new Date()
  const bulan = now.toLocaleDateString('id-ID', { month: 'long' })
  const year = now.getFullYear()
  const monthIdx = now.getMonth() + 1 // 1-12
  const tahunAjaran =
    monthIdx >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`
  const totalCols = 1 + juzColumns.length + 1 // Kelas + juz + Jml. Siswa

  // 8. Build HTML
  const monthHeaderRow = `
      <tr style="background:#F1EFE8">
        <th colspan="${totalCols}" style="padding:8px;font-weight:600">${escapeHtml(bulan)}</th>
      </tr>`

  const subHeaderCells = [
    `<th style="padding:8px;font-weight:600;text-align:left;border-right:1px solid #e5e5e5">Kelas</th>`,
    ...juzColumns.map(
      (j) =>
        `<th style="padding:8px;font-weight:600;border-right:1px solid #e5e5e5">${j}</th>`,
    ),
    `<th style="padding:8px;font-weight:600;border-left:1px solid #e5e5e5">Jml. Siswa</th>`,
  ].join('\n        ')
  const subHeaderRow = `
      <tr style="background:#F1EFE8">
        ${subHeaderCells}
      </tr>`

  const dataRows = sortedClasses
    .map((kelas) => {
      const juzCounts = pivotData.get(kelas)!
      const kelasTotal = juzColumns.reduce(
        (sum, j) => sum + (juzCounts.get(j) || 0),
        0,
      )
      const cells = juzColumns
        .map((j) => {
          const c = juzCounts.get(j)!
          return `<td style="padding:8px;border-bottom:1px solid #e5e5e5;border-right:1px solid #e5e5e5">${c === 0 ? '' : c}</td>`
        })
        .join('\n          ')
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:left;font-weight:500;border-right:1px solid #e5e5e5">${escapeHtml(kelas)}</td>
          ${cells}
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;font-weight:500;border-left:1px solid #e5e5e5">${kelasTotal}</td>
        </tr>`
    })
    .join('')

  const footerCells = juzColumns
    .map(
      (j) =>
        `<td style="padding:8px;border-right:1px solid #e5e5e5">${juzTotals.get(j) || 0}</td>`,
    )
    .join('\n        ')
  const footerRow = `
      <tr style="background:#F1EFE8;font-weight:600">
        <td style="padding:8px 12px;border-right:1px solid #e5e5e5">Jml</td>
        ${footerCells}
        <td style="padding:8px;border-left:1px solid #e5e5e5">${grandTotal}</td>
      </tr>`

  return `
<div style="font-family:system-ui,sans-serif;color:#2C2C2A;max-width:900px;margin:0 auto">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:18px;font-weight:700">SMA Islam Bunga Bangsa</div>
    <div style="font-size:14px;color:#5F5E5A;margin-top:4px">Rekap Hasil Perkembangan Tahfidz</div>
    <div style="font-size:13px;color:#5F5E5A;margin-top:2px">Siswa dan Siswi SMA Islam Bunga Bangsa</div>
    <div style="font-size:12px;color:#888780;margin-top:2px">${escapeHtml(tahunAjaran)}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:center">
    <thead>
      ${monthHeaderRow}
      ${subHeaderRow}
    </thead>
    <tbody>
      ${dataRows}
      ${footerRow}
    </tbody>
  </table>
</div>`
}
