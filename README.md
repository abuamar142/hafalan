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
- **Node:** v22.x

## Deployment

| Branch | Environment | URL | Trigger |
|--------|------------|-----|---------|
| `master` | Production | `hafalan.abuamar.online` | Push/merge |
| `staging` | Preview | `hafalan.staging.abuamar.online` | Push/merge |
| Other | — | Tidak deploy | — |

- **Vercel project:** `hafalan` (framework: Next.js)
- **DNS:** Cloudflare (`abuamar.online`)
- Preview deployments disabled globally — hanya branch `staging` yang deploy

```bash
# Deploy ke production
git checkout master && git push

# Deploy ke staging
git checkout staging && git merge master && git push
```

## Architecture

Layered architecture — separasi concerns antara data, domain logic, dan presentasi.

```
src/
├── app/
│   ├── (auth)/               # login, register
│   │   └── auth/callback/    # OAuth callback
│   └── (dashboard)/          # all authenticated pages
│       ├── page.tsx          # dashboard (home)
│       ├── santri/           # student list + detail
│       ├── setoran/          # tambah + riwayat
│       └── laporan/          # reports (collective + individual)
├── components/
│   ├── Modal.tsx
│   ├── SantriCard.tsx
│   └── Sidebar.tsx
├── hooks/
│   └── useAppState.ts        # central read-only data hook (context provider)
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── constants.ts          # ALL_SURAHS, NILAI_OPTIONS, AVATAR_COLORS
│   ├── helpers.ts            # pure utility functions
│   ├── supabase/
│   │   ├── client.ts         # browser client (createBrowserClient)
│   │   └── server.ts         # server client (createServerClient, cookie-based)
│   ├── data/                 # data access layer (Supabase queries)
│   │   ├── students.ts
│   │   ├── memorization.ts
│   │   ├── submissions.ts
│   │   └── settings.ts
│   ├── domain/               # pure business logic (no side effects)
│   │   ├── hafalan.ts        # computeHafalCounts, toggleSurahCycle
│   │   ├── statistics.ts     # computeDashboardStats, computeRanking
│   │   └── reports.ts        # generateCollectiveReport, generateIndividualReport
│   └── actions/              # server actions (mutations)
│       ├── students.ts
│       ├── memorization.ts
│       ├── submissions.ts
│       └── settings.ts
├── middleware.ts              # auth session refresh + redirect
└── globals.css
supabase/
    migrations/               # SQL migrations
```

### Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Data** | `src/lib/data/` | Centralized Supabase queries — one function per operation |
| **Domain** | `src/lib/domain/` | Pure business logic — no supabase/next/react imports |
| **Actions** | `src/lib/actions/` | Server actions — auth check + mutation + revalidatePath |
| **Presentation** | `src/app/` + `src/components/` | UI rendering — consumes data via `useDashboard()` context |

### Data Flow

```
page.tsx (reads via useDashboard context)
  └── useAppState.ts (fetches data via lib/data/)
       └── lib/data/*.ts (Supabase queries)

page.tsx (mutations via server actions)
  └── lib/actions/*.ts (auth + Supabase mutation + revalidatePath)
```

## Database

Tabel utama:

| Table | Purpose |
|-------|---------|
| `students` | Data santri |
| `memorization` | Status hafalan per surah |
| `submissions` | Catatan setoran (dengan guru_id, waktu timestamptz) |
| `settings` | Pengaturan user (key-value) |

RLS aktif di semua tabel — setiap user hanya bisa akses data sendiri (`auth.uid() = user_id`).

### Migrations

```bash
./supabase/migrate.sh
```

Buat migration baru: tambah file di `supabase/migrations/YYYYMMDDHHMMSS_description.sql`, lalu jalankan `./supabase/migrate.sh`.
