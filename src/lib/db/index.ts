import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL belum diset')
    // max: 10 koneksi — cukup untuk 1 instance Next.js, hindari habis slot
    // di Postgres yang RAM-nya terbatas.
    _db = drizzle(postgres(connectionString, { max: 10 }), { schema })
  }
  return _db
}

/**
 * Proxy supaya modul ini aman di-import saat build (env belum ada),
 * tapi koneksi baru dibuka ketika query pertama dijalankan.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export { schema }
