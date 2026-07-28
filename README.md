# Quran Tracker

## Database

### Supabase

- **URL:** https://ieergpfivgiawagccslu.supabase.co
- **Region:** ap-southeast-1
- **Anon Key:** `SUPABASE_ANON_KEY` di `.env`

### Tables

| Table | Purpose |
|-------|---------|
| `students` | Santri (nama, kelas, usia, color) |
| `memorization` | Hafalan per surah per santri |
| `submissions` | Setoran records |
| `settings` | User settings (key-value) |
| `schema_migrations` | Migration tracking |

### Row Level Security

RLS aktif di semua tables. Setiap user hanya bisa akses data mereka sendiri via `auth.uid() = user_id`.

### Connection (psql)

```bash
# From .env
DATABASE_URL=postgresql://postgres.ieergpfivgiawagccslu:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Usage
psql "$DATABASE_URL" -c "SELECT * FROM students;"
```

### Migrations

```bash
# Run all pending migrations
./supabase/migrate.sh

# Create new migration
# 1. Create file: supabase/migrations/YYYYMMDDHHMMSS_description.sql
# 2. Run: ./supabase/migrate.sh
```

Migration tracking di tabel `schema_migrations`.

## Development

```bash
npm install
npm start  # → http://localhost:3000
```

## Tech Stack

- **Frontend:** Vanilla JS (no framework)
- **Backend:** Express.js (static file server only)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Supabase Auth (email/password)
