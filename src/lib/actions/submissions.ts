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
    student_id: studentId,
    surah_no: surahNo,
    nilai,
    catatan,
    waktu: wDate.toISOString(),
    guru_id: user.id,
    ayat_start: ayatStart,
    ayat_end: ayatEnd,
  })

  if (error) throw error

  revalidatePath('/setoran')
}
