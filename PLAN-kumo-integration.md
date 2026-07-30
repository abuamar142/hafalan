# Plan: Integrasi Kumo UI ke Hafalan

## 1. Ringkasan

Migrasi UI components dari custom (`src/components/ui/*`) ke
[Kumo UI](https://kumo-ui.com) (`@cloudflare/kumo` v2.9.0) — design system
resmi Cloudflare, professional-grade, accessible out of the box.

---

## 2. Analisis Dampak

### Component Mapping

| Custom | Kumo | Efek |
|--------|------|------|
| `Button.tsx` | `<Button>` | Langsung ganti |
| `Input.tsx` | `<Input>` | Langsung ganti |
| `Combobox.tsx` | `<Combobox>` (compound) | Breaking — API beda |
| `Toast.tsx` + `ToastProvider` | `<Toasty>` + `useKumoToastManager()` | Breaking — API beda |
| `Card.tsx` | Tidak ada padanan | Pertahankan |
| `Modal.tsx` | `<Dialog>` | Breaking — API beda |
| — | `<Table>` **baru** | Replace manual tabel |
| — | `<Badge>` **baru** | Replace div badge manual |
| — | `<Pagination>` **baru** | Tambah ke halaman panjang |
| — | `<SkeletonLine>` **baru** | Ganti skeleton manual |

### Dependency Perubahan

| Keluar | Masuk |
|--------|-------|
| `lucide-react` | `@phosphor-icons/react` |
| — | `@cloudflare/kumo` |
| `class-variance-authority` | — (built-in Kumo) |

### Theme

Kumo pakai `light-dark()` CSS native + semantic tokens
(`bg-kumo-base`, `text-kumo-default`, dll). Kita override via
`data-theme="hafalan"` dengan color tokens Teal/Amber kita.

---

## 3. Tahapan Implementasi

### Phase 0: Foundation (1 session)

```bash
npm install @cloudflare/kumo @phosphor-icons/react
npm uninstall lucide-react class-variance-authority
```

1. **globals.css** — tambah `@source` Kumo, daftarkan theme `hafalan` yang
   override semantic tokens ke warna existing kita (teal/amber).
2. **next.config.ts** — ganti `optimizePackageImports` dari `lucide-react` ke
   `@phosphor-icons/react`.
3. **Hapus** `cva` dari `Button.tsx`, `cn` utility tetap dipakai untuk
   transisi.
4. **Test**: `tsc --noEmit` + `npm run build`.

### Phase 1: Core Shell Components

**Target**: Ganti komponen yang paling sering dipakai.

1. **Toast** — `Toasty` provider di `layout.tsx`, `useKumoToastManager()` di
   semua page. Ganti semua `useToast()` → `useKumoToastManager()`.
2. **Dialog** — `Dialog.Root`/`Dialog` ganti `Modal.tsx`.
3. **Button** — Kumo `<Button variant>` langsung pakai.

**Files affected**: ~8 pages + `layout.tsx`.

### Phase 2: Form Input Components

**Target**: Semua input elements.

1. **Input** — Kumo `<Input>` dengan built-in `label`/`description`/`error`.
2. **Combobox** — Kumo compound API. Refactor semua usage di pages.
3. **Select** — Kumo `<Select>` ganti native `<select>` yang tersisa.

**Files affected**: ~6 pages.

### Phase 3: Data Display Components

**Target**: Tabel, badge, pagination, skeleton.

1. **Table** — `<Table>` untuk halaman Santri, Riwayat.
2. **Badge** — `<Badge>` untuk nilai/status.
3. **Pagination** — `<Pagination>` untuk daftar panjang.
4. **SkeletonLine** — `<SkeletonLine>` ganti skeleton manual di loading.tsx.

### Phase 4: Icon Replacement

1. `lucide-react` → `@phosphor-icons/react` di seluruh codebase.
2. Update import statements.
3. Hapus `lucide-react` dari dependencies.

### Phase 5: Cleanup

1. Hapus `src/components/ui/` files yang sudah diganti.
2. Hapus `cva`, `clsx`, `tailwind-merge` jika tidak dipakai lagi.
3. QA pass: `tsc --noEmit` + `npm run build`.

---

## 4. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| `light-dark()` CSS belum support semua browser | Kumo fallback handle. Cek target browser. |
| Kumo v2.x API changes | Lock version `@cloudflare/kumo@2.9.0` |
| Perubahan visual tidak presisi | QA visual per page setelah migrasi |
| Bundle size membesar | Run `next build` bundle analyzer |

---

## 5. Prioritas Eksekusi

1. **Phase 0** — Setup, verify build ✅ (prasyarat)
2. **Phase 1** — Shell (Toast, Dialog, Button) ⭐ impact besar, effort kecil
3. **Phase 2** — Forms (Input, Combobox, Select) ⭐ impact besar
4. **Phase 3** — Data display (Table, Badge, Pagination) 🟡 medium
5. **Phase 4** — Icons migration 🟡 medium
6. **Phase 5** — Cleanup 🟢 low risk

Setiap phase independent — bisa di-commit dan di-deploy sendiri-sendiri.

---

## 6. File Reference

### New (Kumo CLI)
- `npx @cloudflare/kumo init` — setup Tailwind source

### Modified (Phase 0)
- `src/app/globals.css` — tambah `@source` + theme override
- `next.config.ts` — update optimizePackageImports
- `package.json` — tambah `@cloudflare/kumo`, `@phosphor-icons/react`
- `src/app/(dashboard)/layout.tsx` — tambah `Toasty` provider

### Deleted (Phase 5)
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Combobox.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/Modal.tsx`
- `src/components/EditSubmissionModal.tsx` (migrate ke Dialog compound)

### No Change
- `src/components/ui/Card.tsx` — tetap custom
- `src/app/globals.css` theme tokens — tetap dipertahankan via Kumo theme override
- Semua logic, hooks, server actions — tidak tersentuh
