'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { submissions } from '@/lib/db/schema'

export async function addSubmissionAction(formData: FormData) {
  const session = await requireSession()

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

  await db.insert(submissions).values({
    studentId,
    surahNo,
    nilai,
    catatan,
    waktu: waktu ? new Date(waktu) : new Date(),
    guruId: session.sub,
    guruName: session.name || '',
    ayatStart,
    ayatEnd,
  })

  revalidatePath('/setoran')
}

export async function updateSubmissionAction(formData: FormData) {
  const session = await requireSession()

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

  await db
    .update(submissions)
    .set({
      surahNo,
      nilai,
      catatan,
      waktu: waktu ? new Date(waktu) : new Date(),
      updatedAt: new Date(),
      updatedBy: session.sub,
      updatedByName: session.name || '',
      ayatStart,
      ayatEnd,
    })
    .where(eq(submissions.id, submissionId))

  revalidatePath('/setoran')
}

export async function deleteSubmissionAction(submissionId: number) {
  await requireSession()
  if (!submissionId) throw new Error('ID Setoran harus valid')

  await db.delete(submissions).where(eq(submissions.id, submissionId))
  revalidatePath('/setoran')
}
