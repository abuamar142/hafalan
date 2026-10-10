import { handler, ok } from '@/lib/api-utils'
import { clearSessionCookie } from '@/lib/auth/session'

export const POST = handler(async () => {
  await clearSessionCookie()
  return ok({ ok: true })
})
