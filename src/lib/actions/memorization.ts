'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { memorization } from '@/lib/db/schema'

export async function toggleMemorizationAction(
  studentId: number,
  surahNo: number,
  status: number
) {
  await requireSession()

  await db
    .insert(memorization)
    .values({ studentId, surahNo, status })
    .onConflictDoUpdate({
      target: [memorization.studentId, memorization.surahNo],
      set: { status },
    })

  revalidatePath(`/santri/${studentId}`)
}
