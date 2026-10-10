import { handler, ok } from '@/lib/api-utils'
import { getSession } from '@/lib/auth/session'

export const GET = handler(async () => {
  const session = await getSession()
  return ok({ user: session })
})
