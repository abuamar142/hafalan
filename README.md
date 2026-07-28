# Hafalan

Web app untuk melacak hafalan & setoran santri — SMA Islam Bunga Bangsa.

## Setup

```bash
cp .env.local.example .env.local   # isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev                         # → http://localhost:3000
```

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Supabase Auth (email/password)

## Database

Tabel utama:

| Table | Purpose |
|-------|---------|
| `students` | Data santri |
| `memorization` | Status hafalan per surah |
| `submissions` | Catatan setoran (dengan guru_id) |
| `settings` | Pengaturan user (key-value) |

RLS aktif di semua tabel — setiap user hanya bisa akses data sendiri (`auth.uid() = user_id`).

### Migrations

```bash
./supabase/migrate.sh
```

Buat migration baru: tambah file di `supabase/migrations/YYYYMMDDHHMMSS_description.sql`, lalu jalankan `./supabase/migrate.sh`.

## Project Structure

```
src/
  app/
    (auth)/           # login, register pages
    (dashboard)/      # santri, rekap, setoran, laporan pages
  components/         # Header, NavTabs, Modal, SantriCard
  hooks/              # useAppState
  lib/
    types.ts          # TypeScript types
    constants.ts      # surah data, demo state
    helpers.ts        # utility functions
    supabase/         # server + browser client
  middleware.ts       # auth session refresh
supabase/
  migrations/         # SQL migrations
```
