import { apiGet, apiPut } from '@/lib/api-client'
import type { Group, GroupTeacher } from '@/lib/types'

export async function getGroups(): Promise<Group[]> {
  return apiGet<Group[]>('/api/groups')
}

export async function getAllGroupTeachers(): Promise<GroupTeacher[]> {
  return apiPut<GroupTeacher[]>('/api/groups', {})
}
