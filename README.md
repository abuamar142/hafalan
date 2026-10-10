# Hafalan

Portal Wali Murid — sistem informasi hafalan & raport santri, SMA Islam Bunga Bangsa.

Aplikasi **fullstack mandiri**: Next.js 15 (App Router) + PostgreSQL lokal,
tanpa layanan pihak ketiga.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Base UI)
- **Database:** PostgreSQL 17 (Drizzle ORM)
- **Auth:** sendiri — bcrypt (`bcryptjs`) + JWT HS256 (`jose`) di cookie httpOnly
- **Package manager:** bun
- **Runtime:** Docker (Next.js standalone)

## Setup (lokal)

```bash
cp .env.example .env      # isi POSTGRES_*, DATABASE_URL, JWT_SECRET
bun install
bun run dev               # → http://localhost:3000
```

Untuk menjalankan sekaligus DB + app:

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Arsitektur

```
src/
├── app/
│   ├── api/                  # REST API (route handlers)
│   │   ├── auth/             # login, register, logout, me, profile
│   │   ├── classes/ groups/ teachers/ students/ submissions/ memorization/
│   │   └── public/           # tanpa login: classes, groups, students, report
│   ├── (auth)/               # login, register
│   ├── (dashboard)/          # halaman ber-login: dashboard, santri, setoran, laporan, kelas, kelompok
│   └── raport/[id]/          # raport publik (untuk wali murid)
├── components/
│   ├── app/                  # design system (PageHeader, StatCard, SectionCard, …)
│   ├── public/               # ParentSearchWizard, ReportDetailClient
│   └── ui/                   # primitif shadcn/Base UI
├── hooks/
│   └── useAppState.ts        # data hook terpusat (React Query)
├── lib/
│   ├── auth/                 # password (bcrypt), jwt, session (cookie)
│   ├── db/                   # schema.ts (Drizzle) + index.ts (koneksi)
│   ├── data/                 # data access — fetch ke /api/*
│   ├── actions/              # server actions — Drizzle langsung + revalidatePath
│   ├── domain/               # logika bisnis murni (hafalan, statistics, reports)
│   ├── api-client.ts         # helper fetch untuk client component
│   └── api-utils.ts          # helper respons API
└── middleware.ts             # verifikasi sesi JWT (edge)
```

### Alur Data

```
Client component  →  lib/data/*  →  fetch /api/*  →  Drizzle  →  PostgreSQL
Server action     →  lib/actions/*  →  Drizzle  →  PostgreSQL
```

- **Halaman ber-login** memakai `useAppState()` (React Query) yang memanggil
  `lib/data/*`; mutasi lewat **server action** di `lib/actions/*`.
- **Halaman publik** (landing & raport) memakai endpoint `/api/public/*`
  yang tidak memerlukan sesi.

### Autentikasi

- Login dengan **username + password** (bukan email).
- Password di-hash bcrypt; sesi berupa JWT HS256 di cookie
  `hafalan_session` (httpOnly, `sameSite=lax`, 7 hari).
- `middleware.ts` memverifikasi JWT di edge:
  - halaman tanpa sesi → redirect `/login`
  - request `/api/*` tanpa sesi → **401 JSON**

## Database

| Tabel | Isi |
|-------|-----|
| `users` | Akun ustadz (username, password_hash, nama) |
| `classes` | Jenjang kelas (X, XI, XII) |
| `groups` | Kelompok halaqah (terkait kelas) |
| `group_teachers` | Pengampu tiap kelompok |
| `students` | Data santri |
| `memorization` | Status hafalan per surah per santri |
| `submissions` | Catatan setoran (nilai, ayat, waktu, guru) |

### Migrasi

Skema dikelola Drizzle di `src/lib/db/schema.ts`:

```bash
# Setelah mengubah schema.ts, generate file SQL migrasi:
bunx drizzle-kit generate

# Terapkan ke DB (host-side):
docker exec -i hafalan-db psql -U hafalan -d hafalan-db < drizzle/0000_*.sql
```

Seed data awal (3 kelas, 12 kelompok, 4 ustadz, 165 santri) ada di `seed.sql`.
Seed hanya dijalankan **sekali** saat inisialisasi DB.

## Deployment

Produksi berjalan di VPS sebagai container Docker:

| Layanan | Container | Host port | Domain |
|---------|-----------|-----------|--------|
| App | `hafalan-app` | 127.0.0.1:3013 | `hafalan.abuamar.online` |
| DB | `hafalan-db` | 127.0.0.1:5440 | — |

- Repo di VPS: `/opt/hafalan` (branch `master`)
- Deploy: `/opt/ops/bin/deploy-hafalan.sh master`
- Reverse proxy & TLS: nginx + Let's Encrypt (Cloudflare proxied, mode Full)
- Backup harian: `~/backups/<tanggal>/hafalan-prod.sql.gz`
