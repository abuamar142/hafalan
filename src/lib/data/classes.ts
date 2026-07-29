import { createClient } from '@/lib/supabase/client'
import type { Class } from '@/lib/types'

export async function getClasses(): Promise<Class[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Class[]
}
