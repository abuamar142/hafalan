import { createClient } from '@/lib/supabase/client'
import type { Settings } from '@/lib/types'

export async function getSettings(): Promise<Settings[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('settings')
    .select('key, value, user_id')
    .eq('user_id', user.id)

  return (data ?? []) as Settings[]
}

export async function getGuruNames(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase
    .from('settings')
    .select('value, user_id')
    .eq('key', 'guru')

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.user_id] = row.value
  }
  return map
}

export async function upsertSetting(
  key: string,
  value: string,
  userId: string
): Promise<void> {
  const supabase = createClient()
  await supabase.from('settings').upsert({
    key,
    value,
    user_id: userId,
  })
}
