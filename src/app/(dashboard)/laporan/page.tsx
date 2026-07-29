'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '../layout'
import { createClient } from '@/lib/supabase/client'
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
} from '@/lib/helpers'
import { ALL_SURAHS } from '@/lib/constants'

export default function LaporanPage() {
  const { state } = useDashboard()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [printHtml, setPrintHtml] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...state.students].sort((a, b) => getPct(b) - getPct(a)),
    [state.students]
  )

  // ── Collect full memorization data for all students ──
  async function fetchAllMemorization(): Promise<
    Record<number, Record<number, number>>
  > {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return {}

    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)

    const studentIds = (students || []).map((s) => s.id)
    const fullSantri: Record<number, Record<number, number>> = {}

    if (studentIds.length) {
      const { data: memos } = await supabase
        .from('memorization')
        .select('student_id, surah_no, status')
        .in('student_id', studentIds)

      ;(memos || []).forEach((m) => {
        if (!fullSantri[m.student_id]) fullSantri[m.student_id] = {}
        fullSantri[m.student_id][m.surah_no] = m.status
      })
    }

    return fullSantri
  }

  // ── Collect individual student data ──
  async function fetchStudentData(studentId: number) {
    const supabase = createClient()
    const { data: memos } = await supabase
      .from('memorization')
      .select('surah_no, status')
      .eq('student_id', studentId)

    const hafalan: Record<number, number> = {}
    ;(memos || []).forEach((m) => {
      hafalan[m.surah_no] = m.status
    })

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('santri_id', studentId)
      .order('id', { ascending: false })

    return { hafalan, submissions: subs || [] }
  }

  // ── Collective Report ──
  async function cetakKolektif() {
    const fullSantri = await fetchAllMemorization()

    const totalHafal = sorted.reduce(
      (sum, s) => sum + getTotalHafal(s),
      0
    )
    const avgHafal = sorted.length
      ? Math.round(totalHafal / sorted.length)
      : 0
    const avgPct = sorted.length
      ? Math.round(sorted.reduce((sum, s) => sum + getPct(s), 0) / sorted.length)
      : 0

    // Build ranking rows
    const rows = sorted
      .map((s, i) => {
        const hf = fullSantri[s.id] || {}
        const hafal = Object.values(hf).filter((v) => v === 1).length
        const juzSelesai = getJuzSelesaiFromHafalan(hf)
        const p = getPct(s)
        const subCount = state.submissions.filter(
          (sub) => sub.santri_id === s.id
        ).length

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
    const latestSubs = [...state.submissions]
      .sort((a, b) => b.id - a.id)
      .slice(0, 10)
      .map(
        (sub) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.santri_nama}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${getSurahNama(sub.surah_no)}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${sub.nilai}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan || '-'}</td>
        </tr>`
      )
      .join('')

    const html = `
      <div style="font-family:system-ui,sans-serif;color:#2C2C2A;max-width:800px;margin:0 auto">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:18px;font-weight:700">SMA Islam Bunga Bangsa</div>
          <div style="font-size:14px;color:#5F5E5A;margin-top:4px">Laporan Kolektif · ${state.guru || '-'}</div>
          <div style="font-size:12px;color:#888780;margin-top:2px">${nowStr()}</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${sorted.length}</div>
            <div style="font-size:11px;color:#5F5E5A">Total Santri</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${avgHafal}</div>
            <div style="font-size:11px;color:#5F5E5A">Rata-rata Hafal</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#1D9E75">${avgPct}%</div>
            <div style="font-size:11px;color:#5F5E5A">Rata-rata Progress</div>
          </div>
          <div style="background:#F1EFE8;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700">${state.submissions.length}</div>
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
            <div style="margin-top:4px">(${state.guru || '-'})</div>
          </div>
        </div>
      </div>`

    setPrintHtml(html)
    setTimeout(() => window.print(), 400)
  }

  // ── Individual Report ──
  async function cetakIndividu() {
    if (!selectedStudent) return

    const sId = Number(selectedStudent)
    const student = sorted.find((s) => s.id === sId)
    if (!student) return

    const { hafalan, submissions } = await fetchStudentData(sId)
    const hafalCount = Object.values(hafalan).filter((v) => v === 1).length
    const p = getPctFromCount(hafalCount)
    const juzSelesai = getJuzSelesaiFromHafalan(hafalan)

    // Juz grid
    const juzCells = [...Array(30)]
      .map((_, i) => {
        const j = i + 1
        const jp = getJuzSurahsFromHafalan(hafalan, j)
        const bg =
          jp === 100 ? '#1D9E75' : jp > 0 ? '#BA7517' : '#e5e5e5'
        const fg = jp === 100 ? '#fff' : jp > 0 ? '#BA7517' : '#999'
        return `
        <div style="width:48px;height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:6px;background:${bg};color:${fg};font-size:13px;font-weight:600">
          ${j}
          ${jp > 0 ? `<div style="font-size:9px;font-weight:400">${jp}%</div>` : ''}
        </div>`
      })
      .join('')

    // Memorized surahs
    const hafalSurahs = ALL_SURAHS.filter((s) => hafalan[s.no] === 1)
    const murajaahSurahs = ALL_SURAHS.filter((s) => hafalan[s.no] === 2)

    // Submissions table
    const subRows = submissions
      .slice(0, 20)
      .map(
        (sub) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${getSurahNama(sub.surah_no)}${sub.ayat_start && sub.ayat_end ? `: ${sub.ayat_start}${sub.ayat_end !== sub.ayat_start ? `–${sub.ayat_end}` : ''}` : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;text-align:center">${sub.nilai}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).tanggal}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${formatWaktu(sub.waktu).jam}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5">${sub.catatan || '-'}</td>
        </tr>`
      )
      .join('')

    const html = `
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
            <div style="font-size:12px;color:#5F5E5A">${student.kelas || 'Tanpa kelas'}${student.usia ? ` · ${student.usia} th` : ''}</div>
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
            <div style="margin-top:2px">(${state.guru || '-'})</div>
            <div style="margin-top:24px;border-top:1px solid #2C2C2A;width:160px;padding-top:4px">Tanda Tangan Guru</div>
          </div>
        </div>
      </div>`

    setPrintHtml(html)
    setTimeout(() => window.print(), 400)
  }

  return (
    <>
      {/* Title */}
      <div className="mb-4 text-sm font-medium text-text">Laporan</div>

      {/* Report options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Collective */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-sm font-medium text-text mb-1">
            Laporan Kolektif
          </div>
          <div className="text-[12px] text-text-muted mb-3">
            Ranking seluruh santri dengan statistik ringkasan
          </div>
          <button
            onClick={cetakKolektif}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity"
          >
            Cetak
          </button>
        </div>

        {/* Individual */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-sm font-medium text-text mb-1">
            Laporan Individu
          </div>
          <div className="text-[12px] text-text-muted mb-3">
            Detail progres dan riwayat per santri
          </div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary mb-2"
          >
            <option value="">Pilih Santri</option>
            {state.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kelas || '-'})
              </option>
            ))}
          </select>
          <button
            onClick={cetakIndividu}
            disabled={!selectedStudent}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            Cetak
          </button>
        </div>
      </div>

      {/* Print area */}
      {printHtml && (
        <div id="print-area" dangerouslySetInnerHTML={{ __html: printHtml }} />
      )}
    </>
  )
}
