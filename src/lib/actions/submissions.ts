'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubmissionAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const studentId = Number(formData.get('student_id'))
  const surahNo = Number(formData.get('surah_no'))
  const nilai = (formData.get('nilai') as string) ?? ''
  const catatan = (formData.get('catatan') as string)?.trim() ?? ''
  const waktu = (formData.get('waktu') as string) ?? ''
  const ayatStart = Number(formData.get('ayat_start')) || 1
  const ayatEnd = Number(formData.get('ayat_end')) || ayatStart

  if (!studentId || !surahNo) {
    throw new Error('Santri dan Surah harus dipilih')
  }

  const wDate = new Date(waktu)

  const { error } = await supabase.from('submissions').insert({
    id: Date.now(),
    student_id: studentId,
    surah_no: surahNo,
    nilai,
    catatan,
    waktu: wDate.toISOString(),
    guru_id: user.id,
    guru_name: (user.user_metadata?.name as string) || '',
    ayat_start: ayatStart,
    ayat_end: ayatEnd,
  })

  if (error) throw error

  revalidatePath('/setoran')
}

export async function updateSubmissionAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const submissionId = Number(formData.get('id'))
  const surahNo = Number(formData.get('surah_no'))
  const nilai = (formData.get('nilai') as string) ?? ''
  const catatan = (formData.get('catatan') as string)?.trim() ?? ''
  const waktu = (formData.get('waktu') as string) ?? ''
  const ayatStart = Number(formData.get('ayat_start')) || 1
  const ayatEnd = Number(formData.get('ayat_end')) || ayatStart

  if (!submissionId || !surahNo) {
    throw new Error('ID Setoran dan Surah harus valid')
  }

  const wDate = new Date(waktu)

  const { error } = await supabase
    .from('submissions')
    .update({
      surah_no: surahNo,
      nilai,
      catatan,
      waktu: wDate.toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
      updated_by_name: (user.user_metadata?.name as string) || '',
      ayat_start: ayatStart,
      ayat_end: ayatEnd,
    })
    .eq('id', submissionId)

  if (error) throw error

  revalidatePath('/setoran')
}
