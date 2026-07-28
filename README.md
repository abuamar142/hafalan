# Quran Tracker

Web app untuk melacak hafalan & setoran santri. Auth & database via Supabase.

## Setup

```bash
cp .env.example .env   # isi SUPABASE_URL & SUPABASE_ANON_KEY
npm install
npm start              # → http://localhost:3000
```

## Tech Stack

- **Frontend:** Vanilla JS (no framework)
- **Server:** Express.js (static file only)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Supabase Auth (email/password)

## Database

Tabel utama:

| Table | Purpose |
|-------|---------|
| `students` | Data santri |
| `memorization` | Status hafalan per surah |
| `submissions` | Catatan setoran |
| `settings` | Pengaturan user (key-value) |

RLS aktif di semua tabel — setiap user hanya bisa akses data sendiri (`auth.uid() = user_id`).

### Migrations

```bash
./supabase/migrate.sh          # jalankan semua pending migration
```

Buat migration baru: tambah file di `supabase/migrations/YYYYMMDDHHMMSS_description.sql`, lalu jalankan `./supabase/migrate.sh`.

## Project Structure

```
public/
  index.html        # halaman utama
  css/style.css     # styling
  js/
    supabase.js     # Supabase client init
    data.js         # konstanta (surah, state, dll)
    api.js          # data helpers (CRUD via Supabase)
    app.js          # UI logic & navigation
server.js           # Express static server
supabase/
  migrations/       # SQL migrations
  migrate.sh        # migration runner
```
