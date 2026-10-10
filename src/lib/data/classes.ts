import { apiGet } from '@/lib/api-client'
import type { Class } from '@/lib/types'

export async function getClasses(): Promise<Class[]> {
  return apiGet<Class[]>('/api/classes')
}
