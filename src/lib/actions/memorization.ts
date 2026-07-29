'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleMemorizationAction(
  studentId: number,
  surahNo: number,
  status: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('memorization').upsert(
    { student_id: studentId, surah_no: surahNo, status },
    { onConflict: 'student_id,surah_no' }
  )

  if (error) throw error

  revalidatePath(`/santri/${studentId}`)
}
