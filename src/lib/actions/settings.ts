'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGuruAction(nama: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('settings').upsert(
    {
      key: 'guru',
      value: nama,
      user_id: user.id,
    },
    { onConflict: 'key,user_id' }
  )

  if (error) throw error

  revalidatePath('/')
}
