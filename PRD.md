# PRD — TACTICAL EDUCATION (As-Built + Clone Spec)

**Produk:** TACTICAL EDUCATION — PWA bimbel online (POLRI / TNI / Kedinasan / CPNS) dengan landing publik, dashboard member, dan panel admin.  
**Status:** Live / production-ready.  
**Dokumen ini:** spesifikasi **as-built** (perilaku produk yang sudah dipakai) agar kloning fitur bisa sempurna, plus arsitektur **target kloning** (Go Fiber + PostgreSQL).  
**Bahasa:** Indonesia.

| | AS-IS (sumber kebenaran) | TARGET KLONING |
|---|---|---|
| Makna | Implementasi yang berjalan di VPS saat ini | Rewrite dengan stack modern, **perilaku produk identik** |
| Backend | Node.js + Express 5 + Prisma + MySQL | Go 1.23+ + Fiber + PostgreSQL 16 + Redis |
| Frontend | React 19 + Vite 7 + Tailwind 3 + PWA | Sama (React 19 + Vite + PWA), rute & layar tidak berubah |
| Deploy | Ubuntu + Nginx + Certbot + PM2 | Docker Compose + Nginx + Certbot (atau systemd) |

Fitur di bab 3–8 berlaku untuk **kedua** stack. Perbedaan hanya implementasi (bab 1–2, 9–10).

---

## 0. Identitas produksi

| Item | Nilai |
|---|---|
| Nama aplikasi | TACTICAL EDUCATION |
| Frontend production | `https://app.tacticaleducation.id` |
| API production | Reverse proxy Nginx ke backend port `5000`; health `GET /api/v1/health` → `{ "status": "ok" }` |
| Repo | `https://github.com/ralphwaworuntu/tacticaleducation` |
| VPS path | `/var/www/tactical-education` |
| Proses PM2 | `tactical-backend` (API), `tactical-frontend` (`serve -s frontend/dist -l 4173`) |
| Database AS-IS | MySQL `tactical_education` @ `localhost:3306` |
| File statis | `backend/uploads/` diserve di `/uploads` |

**Aturan Mixed Content (wajib):** halaman HTTPS **tidak boleh** memanggil `http://host:5000`. Production memakai `VITE_API_URL` (HTTPS) atau same-origin `/api/v1`.

---

## 1. Tech stack AS-IS (sumber kebenaran)

### 1.1 Backend

| Layer | Pilihan | Versi / catatan |
|---|---|---|
| Runtime | Node.js 20+ | TypeScript ~5.9 |
| Framework | Express | ^5.2 |
| ORM | Prisma + `@prisma/client` | ^5.18 → **MySQL 8** |
| Auth | `jsonwebtoken` + `bcryptjs` | Access JWT + refresh token di-hash di DB |
| Validasi | Zod | ^4 |
| Upload | multer + sharp | Resize gambar max 1024px |
| CSV / dokumen | csv-parse, chardet, iconv-lite, mammoth, word-extractor | Word → CSV |
| Email | nodemailer | Verifikasi email |
| Hardening | helmet, cors, compression, express-rate-limit, cookie-parser | Rate limit auth: 30 req / 15 menit |
| Proses | PM2 | Nama proses: `tactical-backend`, port `5000` |

Skrip penting: `npm run build` (`rimraf dist && tsc`), `npx prisma migrate deploy`, `npx prisma generate` **sebelum** build TypeScript.

### 1.2 Frontend (PWA)

| Layer | Pilihan | Versi / catatan |
|---|---|---|
| UI | React + React DOM | ^19.2 |
| Build | Vite | ^7 |
| Routing | react-router-dom | ^7 |
| Styling | Tailwind CSS 3 | Palet `brand-*` (#1e3a8a), font Plus Jakarta Sans |
| Komponen | Radix + CVA + clsx (pola shadcn, subset) | Button, Input, Card, Dialog, dll. |
| State | Zustand (auth persist) + TanStack Query | Key persist: `tactical-education-auth` |
| HTTP | Axios | Bearer + auto-refresh pada 401 |
| Form | react-hook-form + Zod | |
| Toast | Sonner | |
| PWA | vite-plugin-pwa (`registerType: autoUpdate`) | `display: standalone`, theme `#1e3a8a` |
| Serve prod | `serve -s dist -l 4173` via PM2 | Bukan folder `frontend_dist` |

### 1.3 Infrastruktur AS-IS

- OS: Ubuntu 24.04 LTS (VPS).
- Reverse proxy: Nginx + Let’s Encrypt (Certbot).
- Storage: disk lokal `backend/uploads/` (`payments/`, `hero/`, `content/`, `avatars/`, `exams/`).
- Pembayaran: transfer bank manual (bukan payment gateway).
- Tidak ada Redis, tidak ada Docker di deploy live.

### 1.4 Environment

**Backend** (divalidasi di `backend/src/config/env.ts`):

| Variabel | Wajib | Default |
|---|---|---|
| `DATABASE_URL` | Ya | MySQL connection string |
| `JWT_ACCESS_SECRET` | Ya, ≥32 karakter | — |
| `JWT_REFRESH_SECRET` | Ya, ≥32 karakter | — |
| `PORT` | Tidak | `5000` |
| `NODE_ENV` | Tidak | `development` |
| `ACCESS_TOKEN_TTL_MINUTES` | Tidak | `60` |
| `REFRESH_TOKEN_TTL_DAYS` | Tidak | `30` |
| `FRONTEND_URL` | Tidak | `http://localhost:4173` (CORS, boleh comma-separated; link referral) |
| `APP_URL` | Tidak | kosong |
| `SMTP_*` | Tidak | host/user/pass/from; port 587 |

**Frontend:**

| Variabel | Fungsi |
|---|---|
| `VITE_API_URL` | Base API production, contoh `https://app.tacticaleducation.id/api/v1` atau subdomain API |
| `VITE_APP_NAME` | Nama PWA (default TACTICAL EDUCATION) |
| `VITE_WHATSAPP_LINK` | Fallback tombol WA mengambang |

Dev: Vite proxy `/api` dan `/uploads` → `127.0.0.1:5000`. API base di DEV = `/api/v1`.

---

## 2. Tech stack TARGET KLONING

Clone **wajib** menyalin perilaku produk. Stack di bawah mengganti Node/MySQL, bukan mengubah UX.

### 2.1 Pilihan stack

| Layer | Pilihan | Alasan |
|---|---|---|
| API | **Go 1.23+ + Fiber** | Performa, satu binary, cocok REST `/api/v1` |
| Validasi | go-playground/validator | Setara Zod di request DTO |
| Query | **sqlc** (disarankan) atau GORM | sqlc = SQL eksplisit, aman untuk migrasi dari Prisma |
| Migrasi | golang-migrate atau goose | Setara `prisma migrate` |
| DB | **PostgreSQL 16** | jsonb, enum native, transaksional |
| Cache / rate limit | **Redis 7** | Rate limit auth, denylist refresh opsional |
| Password | argon2id (disarankan) atau bcrypt | Kompatibel konsep hash AS-IS |
| JWT | golang-jwt | Access + refresh, payload sama |
| File | Disk lokal **atau MinIO** | Path publik tetap `/uploads/...` |
| Image | `disintegration/imaging` atau libvips binding | Setara sharp (max 1024px) |
| Email | SMTP (gomail / aws-sdk sesuai env) | Alur verifikasi identik |
| Frontend | **React 19 + Vite 7 + Tailwind 3 + PWA** | Layar dan rute tidak diubah |
| Edge | Nginx + Certbot | TLS, reverse proxy, static PWA |
| Orkestrasi | Docker Compose | `api`, `postgres`, `redis`, `nginx`, MinIO opsional |

### 2.2 Pemetaan tipe Prisma/MySQL → PostgreSQL

| Prisma / MySQL | PostgreSQL clone |
|---|---|
| `String` / `VarChar` | `text` atau `varchar` |
| `LongText` | `text` |
| `Json` | `jsonb` |
| Enum Prisma | `CREATE TYPE ... AS ENUM` |
| `cuid()` | `text` PK (cuid) **atau** `uuid` (jika clone memilih UUID, semua relasi ikut) |
| `@updatedAt` | `timestamptz` + trigger / aplikasi |
| Boolean | `boolean` |
| DateTime | `timestamptz` |

Uniqueness yang wajib dipertahankan: `User.email`, `User.referralCode`, `User.emailVerificationToken`, `MemberArea.slug`, `Tryout.slug`, `@@unique([subCategoryId, sessionOrder])`, `Transaction.code`, `Referral.referredUserId`.

### 2.3 Kompatibilitas API

Clone **mempertahankan path `/api/v1/...`** dan kontrak JSON yang dipakai frontend sekarang. Jangan pecah PWA tanpa `/api/v2` yang disengaja.

### 2.4 Deploy TARGET

```text
Client PWA  →  Nginx (TLS)
                 ├─ static dist/
                 ├─ /api/v1 → Fiber :5000
                 └─ /uploads → disk atau MinIO
Fiber → PostgreSQL
Fiber → Redis
```

Docker Compose minimal: `api`, `postgres:16`, `redis:7`, `nginx`. Sertakan file `.env.example` untuk API dan frontend.

---

## 3. Peran, autentikasi, sesi

### 3.1 Role

Hanya dua: `ADMIN` | `MEMBER`.

Proteksi super-admin: akun `developer@tacticaleducation.id` **tidak** boleh di-reset password atau di-impersonate dari panel user.

### 3.2 Alur auth

| Fitur | Perilaku wajib |
|---|---|
| Register | 3 langkah: data diri → orang tua → tinggi/berat/kesehatan/password + kode referral opsional |
| Field wajib register | `name`, `email`, `password` (≥8), `phone`, `nationalId`, `address`, `heightCm`, `weightKg`, `parentName`, `parentPhone`, `parentOccupation`, `parentAddress`, `healthIssues` |
| Setelah register | Buat `referralCode` format `TACT` + 6 karakter; buat `MemberArea.slug`; kirim email verifikasi; **belum** masuk dashboard |
| Verifikasi email | `POST /auth/verify-email` → terbitkan sesi |
| Resend | `POST /auth/resend-verification` (rate limited) |
| Login | Email + password; ADMIN → `/admin`, MEMBER → `/app` (atau `from`) |
| Email belum verifikasi | Error `EMAIL_NOT_VERIFIED` → halaman `/auth/verify` |
| Akun nonaktif | Error `ACCOUNT_DISABLED` |
| Lupa password | **Tidak ada self-service.** Login menautkan WhatsApp admin |
| Ganti password | `POST /auth/password` (password lama + baru); hapus refresh token; naikkan `sessionVersion` |
| Admin reset | `POST /admin/users/:id/reset-password` → kembalikan `tempPassword` |
| Impersonate | `POST /admin/users/:id/impersonate` → token MEMBER aktif & terverifikasi; **tidak** menaikkan `sessionVersion`. Frontend tidak punya tombol “keluar impersonate” |
| Refresh | `POST /auth/refresh`; refresh token di-hash di tabel `RefreshToken`, dikonsumsi (dihapus) saat rotate |
| Logout | Invalidasi refresh |
| Profil | `GET/PATCH /auth/me`, `POST /auth/avatar` |

**Catatan as-built:** form register **tidak** auto-isi `referralCode` dari query `?ref=`. Link afiliasi memakai `?ref=KODE`, tetapi member mengetik kode secara manual di langkah 3.

### 3.3 JWT & perangkat

Payload access token: `sub`, `email`, `role`, `name`, `referralCode`, `isEmailVerified`, `sessionVersion`.

- Default TTL access 60 menit, refresh 30 hari.
- Login **non-premium** menaikkan `sessionVersion` → sesi lain invalid (satu perangkat).
- **Premium** = membership PAID dengan paket `accessAllPackages = true` → multi-device diizinkan (tidak memaksa mismatch session).

### 3.4 Rate limit

Endpoint register, login, resend: **30 request / 15 menit** per IP (AS-IS: `express-rate-limit`). Clone: Redis.

---

## 4. Arsitektur informasi & inventori layar

Tidak ada menu **Video Pembelajaran** atau **Ruang Kelas**.

### 4.1 Publik (navbar)

Home, Profil, Paket Bimbel, Orang Tua, Galeri, Testimoni, Hubungi Kami + tombol **DAFTAR** / **LOGIN**. Footer + tombol WhatsApp mengambang.

| Path | Halaman |
|---|---|
| `/` | Home CMS |
| `/profil` | Profil lembaga |
| `/paket-bimbel` | Paket membership publik |
| `/orang-tua` | Progress anak via kode member-area |
| `/galeri` | Alumni + kegiatan |
| `/testimoni` | Testimoni |
| `/hubungi-kami` | Kontak + form |
| `/auth/login` | Login |
| `/auth/register` | Register 3 langkah |
| `/auth/verify` | Verifikasi email |

### 4.2 Member (`/app`, role MEMBER)

Sidebar (urutan):

1. **Dashboard** — Ringkasan `/app`
2. **Informasi** — Pengumuman, FAQ, Berita, Kalkulator
3. **Latihan** — Tryout, Latihan Soal, Tes Kecermatan (disaring `allowTryout` / `allowPractice` / `allowCermat`)
4. Jika exam-control aktif: section **Ujian** — Tryout, Riwayat Tryout, Ujian Soal, Riwayat Ujian
5. **Riwayat** — Tryout, Latihan, Kecermatan
6. **Materi** — Modul & Materi
7. **Beli Paket** — Paket Membership, Konfirmasi Pembayaran, Riwayat Transaksi
8. **Member Get Member** — Afiliasi

Badge sidebar: Admin / **Premium** (`isPremium`) / Member.

| Path | Fungsi |
|---|---|
| `/app` | Overview |
| `/app/pengumuman` | Pengumuman |
| `/app/faq` | FAQ |
| `/app/berita` | Berita / Insight |
| `/app/kalkulator` | Kalkulator psikologi |
| `/app/latihan/tryout` … | Hierarki tryout latihan |
| `/app/latihan/tryout/mulai` | Kerjakan tryout |
| `/app/latihan/tryout/detail/:slug` | Detail / paket PSIKO |
| `/app/latihan/tryout/riwayat` | Riwayat |
| `/app/latihan/tryout/review/:resultId` | Pembahasan |
| `/app/latihan-soal` … | Hierarki 3 level + set |
| `/app/latihan-soal/mulai` | Kerjakan latihan |
| `/app/latihan-soal/riwayat` | Riwayat |
| `/app/latihan-soal/review/:resultId` | Pembahasan |
| `/app/ujian/tryout/*` | Mirror tryout mode ujian |
| `/app/ujian/soal/*` | Mirror latihan mode ujian |
| `/app/tes-kecermatan` | Tes kecermatan |
| `/app/tes-kecermatan/riwayat` | Riwayat |
| `/app/tes-kecermatan/riwayat/:attemptId` | Detail attempt |
| `/app/materi` | Materi |
| `/app/paket-membership` | Beli paket / addon |
| `/app/konfirmasi-pembayaran` | Upload bukti (`?code=`) |
| `/app/riwayat-transaksi` | Transaksi |
| `/app/afiliasi` | Referral |

### 4.3 Admin (`/admin`, role ADMIN)

| Sidebar | Path |
|---|---|
| Overview | `/admin` |
| Landing Content | `/admin/landing` |
| Pengumuman | `/admin/announcements` |
| Reporting | `/admin/reporting` |
| Ranking | `/admin/ranking` |
| Pesan Kontak | `/admin/contacts` |
| Kontrol Ujian | `/admin/exam-control` |
| Konversi Word → CSV | `/admin/word-converter` |
| Tryouts & Tes | `/admin/tryouts` |
| Latihan & Tugas | `/admin/practice` |
| Kecermatan | `/admin/kecermatan` |
| Materi Belajar | `/admin/materials` |
| Kalkulator | `/admin/calculators` |
| Paket & Transaksi | `/admin/commerce` |
| Aktivasi Membership | `/admin/activation` |
| Monitoring Member | `/admin/monitoring` |
| Manajemen User | `/admin/users` |

Rute hidup **tanpa** item sidebar: `/admin/system-monitoring` (CPU/memori).

Catch-all frontend: `*` → `/`.

---

## 5. Spesifikasi fitur (as-built)

### 5.1 Landing publik (CMS)

Konten dari API, diedit admin.

**Home** (`GET /landing/home`):

- Hero: judul, subjudul, CTA, `hero_image` (SiteSetting), slider `HeroSlide[]`.
- Statistik `LandingStat` (label + angka).
- Alasan pilih bimbel (sebagian copy masih hardcoded di frontend: eyebrow “No.1 NTT Bimbel Taktis”, bullet masalah casis).
- Kartu paket aktif (`MembershipPackage`).
- Testimoni + video YouTube.
- Kontak dari SiteSetting: `company_email`, `whatsapp_primary`, `whatsapp_consult`, `company_address`.

**Profil / Paket / Galeri / Testimoni / Hubungi kami:** endpoint landing terkait. Galeri `kind`: `ALUMNI`, `AKTIVITAS`. Form kontak `POST /contact` (nama, email, phone opsional, pesan) → `ContactMessage.status = NEW`.

**Orang Tua:** input kode (`MemberArea.slug`) → `GET /landing/parent/:slug` menampilkan progress member.

**Acceptance:** pengunjung tanpa login melihat semua halaman publik; CTA daftar/login; WA mengambang memakai config atau `VITE_WHATSAPP_LINK`.

### 5.2 Dashboard member (home)

- Welcome + nama; kode member-area (`user.memberArea.slug`).
- Slider `MemberOverviewSlide` (judul, subjudul, gambar, CTA).
- Ringkasan transaksi & pengumuman.
- Status exam-control (kuota ujian jika aktif).
- Welcome modal (gambar + link opsional) dari SiteSetting.
- Background area member (gambar CMS, cover/fixed) jika diaktifkan admin.

### 5.3 Pengumuman, FAQ, Berita, Kalkulator

| Modul | Perilaku |
|---|---|
| Pengumuman | List + detail; `targetAll` atau `targetPackageIds`; premium melihat semua; gambar opsional |
| FAQ | Accordion, field `order` |
| Berita | Tab `NEWS` / `INSIGHT`; slug unik; cover opsional |
| Kalkulator | Butuh membership aktif. Tree: kategori → section → template. Tipe `ANGKA_HILANG` \| `GENERAL`. Formula config JSON: `weighted` \| `grouped` \| `tni`. `POST /calculators/:slug/compute` simpan submission (skor + interpretasi). Legacy: `POST /dashboard/calculator/:slug` |

### 5.4 Tryout (latihan) — `/api/v1/exams`

Hierarki: **Kategori → Subkategori → Tryout**.

Field tryout penting: `durationMinutes`, `totalQuestions`, `isPublished`, `isFree`, `freeForNewMembers` (default true), `freePackageIds` (JSON array ID paket), `sessionOrder` (nullable), `openAt` / `closeAt`.

**Akses (`ensureTryoutAccess`):**

- Premium (`accessAllPackages`) → butuh membership aktif, akses penuh.
- Tanpa membership → hanya jika `isFree` dan `freeForNewMembers !== false`.
- Dengan membership → gratis jika `isFree` dan (`freeForNewMembers` ATAU packageId ada di `freePackageIds`); selain itu butuh `allowTryout` + kuota tryout.
- `tryoutQuota = 0` = unlimited. Selain itu `consumeTryoutQuota` saat **start**.
- Jadwal `openAt`/`closeAt` ditegakkan.

**Pengerjaan:**

- Soal & opsi di-shuffle.
- Timer sesuai `durationMinutes`.
- Fullscreen + exam-block jika config aktif.
- `multipleCorrect`: checkbox; jawaban `optionId` dan/atau `selectedOptionIds`.
- Start: reuse hasil belum selesai dalam ~2 menit.
- Submit: skor = kredit benar / total × 100. Simpan `TryoutResult` + `TryoutAnswer`.
- Review: pembahasan teks + `explanationImageUrl`.

**Riwayat:** tabel tanggal, judul, skor, aksi review.

### 5.5 Paket POLRI PSIKO (wajib)

Deteksi: nama/slug kategori = **`polri`** DAN subkategori = **`psiko`** DAN `sessionOrder != null`.

- `sessionOrder` **wajib unik** per `subCategoryId`.
- UI mengelompokkan sesi menjadi **satu paket soal**, diurut `sessionOrder`.
- Start mengarahkan ke sesi berikutnya yang belum selesai (atau pertama; setelah terakhir, siklus sesuai logika backend).
- Setelah submit: response `nextSession { slug, name, sessionOrder, breakSeconds }` atau jika sesi terakhir: `nextCermatMode` dari SiteSetting `psiko_tryout_cermat_mode` (`NUMBER` \| `LETTER` \| `IMAGE`).
- Istirahat: `psiko_tryout_break_seconds` (default **5**). Frontend countdown lalu auto-start sesi berikutnya (fullscreen).
- Review paket: `GET /exams/tryouts/results/:resultId/review-package` — rata-rata keseluruhan + per sesi.

Admin: `GET/PUT /admin/tryouts/psiko-config`.

### 5.6 Latihan soal — practice

Hierarki **4 tingkat:** Category → SubCategory → SubSubCategory → `PracticeSet`.

Akses free-flag sama seperti tryout. Flag paket `allowPractice`. **Tidak** memotong kuota tryout; ada `moduleQuota` di membership.

Pengerjaan, multi-correct, review, riwayat, jadwal: analog tryout. Timer default set 30 menit.

### 5.7 Tes kecermatan

Mode UI (urutan kartu): **IMAGE → LETTER → NUMBER**.

Default (SiteSetting, overridable admin):

| Key | Default |
|---|---|
| `cermat_question_count` | 60 |
| `cermat_duration_seconds` | 60 |
| `cermat_total_sessions` | 10 |
| `cermat_break_seconds` | 5 |

**Mekanisme:**

- `CermatAttempt` menampung seluruh run; tiap kolom = `CermatSession`.
- NUMBER / LETTER: deret dengan 1 item hilang; jawaban huruf/angka.
- IMAGE: pool 15 ikon line-art; 5 referensi A–E; soal 4 gambar (1 hilang); user pilih A–E. Seed per attempt agar ~10 sesi mendapat kolom unik. Aset di `frontend/public/cermat-icons` + komponen SVG.
- Query `?mode=` + `autoStart=1` didukung (lanjutan dari PSIKO).
- Skor sesi; rata-rata attempt. Band: **≥85 Sangat Baik**, **≥70 Baik**, selain itu **Cukup**.
- Butuh `allowCermat` + cek exam-block. **Hanya** di `/exams`, **tidak** di `/ujian`.
- Riwayat filter default IMAGE.

Admin: `/admin/kecermatan` (config cermat + PSIKO).

### 5.8 Dua permukaan ujian

| Surface | Prefix API | Isi | Kuota |
|---|---|---|---|
| Latihan | `/api/v1/exams` | Tryout + practice + **cermat** + free access + kuota membership | `Transaction.tryoutQuota` |
| Ujian | `/api/v1/ujian` | Tryout + practice + blocks; **tanpa cermat** | `ExamControlConfig.tryoutQuota` / `examQuota` via `ExamQuotaUsage` |

Frontend ujian: `/app/ujian/tryout/*` dan `/app/ujian/soal/*`, tampil jika exam-control enabled + paket mengizinkan.

**Exam control** (`ExamControlConfig`): `enabled`, `targetAll` / `targetPackageIds`, jendela `startAt`/`endAt`, kuota tryout & ujian soal. Mematikan control mereset `ExamQuotaUsage`. Status: `GET /dashboard/exam-control`.

**Kelas gratis (admin exam-control):** patch `isFree`, `freeForNewMembers`, `freePackageIds` pada tryout/set (`PATCH /admin/tryouts/:id/free`, `PATCH /admin/practice/sets/:id/free`).

### 5.9 Anti-cheat (exam block)

- Client `POST .../blocks` dengan `type`: `TRYOUT` \| `PRACTICE` \| `CERMAT` → blokir unresolved + kode **6 digit**.
- Unlock: `POST .../blocks/unlock` dengan kode.
- Admin: list, regenerate kode, resolve.
- SiteSetting toggle: `exam_block_practice_enabled`, `exam_block_tryout_enabled`, `exam_block_exam_enabled`, `exam_block_cermat_enabled`.
- Context `UJIAN` memakai flag exam untuk semua tipe di router ujian.
- HTTP 423 jika masih diblokir.

### 5.10 Materi

Tipe `PDF` \| `VIDEO` \| `LINK`. List member butuh membership aktif; filter `category`, `type`. Relasi M2M ke paket dan addon (`PackageMaterial`, `AddonPackageMaterial`). Admin CRUD + export CSV.

### 5.11 Membership & transaksi

**Paket** (`MembershipPackage`): nama, slug, kategori, tagline, deskripsi, `price` (integer), `durationDays`, `badgeLabel`, `features` JSON, `tryoutQuota`, `moduleQuota`, `allowTryout/Practice/Cermat`, `accessAllPackages`, `isActive`.

**Addon:** `tryoutBonus`, `moduleBonus`, materi tambahan; menempel ke transaksi membership target.

**Alur bayar (manual):**

1. `POST /commerce/transactions` → kode `TRX-…` (membership) atau `ADD-…` (addon), status `PENDING`.
2. `POST /commerce/transactions/:code/confirm` upload bukti (JPG/PNG/WEBP/PDF ≤5MB).
3. Admin `PATCH` status `PAID` / `REJECTED` / `PENDING`.

**Saat MEMBERSHIP → PAID:** `activatedAt`, `expiresAt = now + durationDays`, salin kuota paket, reset used.

**Saat ADDON → PAID:** tambah kuota ke membership target; expiry mengikuti membership.

Membership aktif: `PAID` + `MEMBERSHIP` + `activatedAt` + `expiresAt` null atau masa depan (yang terbaru).

Admin bisa `POST /admin/membership/grant-tryout` (tambah 1–50 kuota, tidak jika unlimited).

**PaymentSetting:** satu baris rekening (bank, nomor, nama).

### 5.12 Afiliasi

Setiap user punya `referralCode` unik. Register dengan kode → baris `Referral` (`status: REGISTERED`). Halaman `/app/afiliasi`: kode, link `{FRONTEND_URL}/auth/register?ref=KODE`, daftar member referred. **Tidak ada komisi/payout.**

### 5.13 Admin — kemampuan

- CMS landing + dashboard (stats, testimoni, gallery, video, hero, slides member, contact, welcome modal, background).
- Bank soal tryout/practice (hierarki, cover, CSV import, export management + questions).
- Tool `POST /admin/tools/convert-word-to-csv` (.doc/.docx ≤15MB) dan `questions-to-csv`.
- Commerce, aktivasi pembayaran, grant kuota.
- User: list/export CSV (tanpa developer admin), role, aktif/nonaktif, reset password, impersonate.
- Reporting + ranking (rata-rata tryout/practice/cermat) + export; **ranking hanya admin**, tidak ada halaman ranking member.
- Monitoring member + `GET /admin/monitoring/system-metrics`.
- Inbox `GET /admin/contacts/messages`.
- Exam control, blocks, cermat, PSIKO config.

**CSV soal (header):** `prompt`, `prompt_image`, `explanation`, `explanationImageUrl`, `order`, `option_a`…`option_e` (+ `_image`, `_correct`).

---

## 6. Model data

ID default: `cuid()`. Timestamp `createdAt`/`updatedAt` sesuai schema.

### 6.1 Enum

| Enum | Nilai |
|---|---|
| `Role` | `ADMIN`, `MEMBER` |
| `TransactionStatus` | `PENDING`, `PAID`, `REJECTED` |
| `TransactionType` | `MEMBERSHIP`, `ADDON` |
| `NewsKind` | `NEWS`, `INSIGHT` |
| `MaterialType` | `PDF`, `VIDEO`, `LINK` |
| `CalculatorType` | `ANGKA_HILANG`, `GENERAL` |
| `ExamBlockType` | `TRYOUT`, `PRACTICE`, `CERMAT` |
| `CermatMode` | `NUMBER`, `LETTER`, `IMAGE` |

### 6.2 Entitas (ringkas)

**Auth:** `User` (profil lengkap, `sessionVersion`, `referralCode`, verifikasi email), `RefreshToken`, `MemberArea`.

**CMS:** `Announcement`, `Faq`, `NewsArticle`, `LandingStat`, `GalleryItem`, `Testimonial`, `YoutubeVideo`, `HeroSlide`, `MemberOverviewSlide`, `ContactMessage`, `SiteSetting` (key/value LongText).

**Tryout:** `TryoutCategory` → `TryoutSubCategory` → `Tryout` → `TryoutQuestion` → `TryoutOption`; `TryoutResult` → `TryoutAnswer`.

**Practice:** `PracticeCategory` → `PracticeSubCategory` → `PracticeSubSubCategory` → `PracticeSet` → `PracticeQuestion` → `PracticeOption`; `PracticeResult` → `PracticeAnswer`.

**Cermat:** `CermatAttempt` → `CermatSession` → `CermatAnswer` (`sequence`, `userAnswer`, `correctAnswer`). `CermatSession.baseSet` string JSON.

**Ujian:** `ExamControlConfig`, `ExamQuotaUsage`, `ExamBlock`.

**Commerce:** `MembershipPackage`, `AddonPackage`, `Transaction`, `PackageMaterial`, `AddonPackageMaterial`, `PaymentSetting`.

**Lain:** `Material`, `Referral`, `PsychCalculatorTemplate` (`config` JSON), `PsychCalculatorSubmission`.

### 6.3 SiteSetting keys yang dipakai kode

`hero_image`, `company_email`, `whatsapp_primary`, `whatsapp_consult`, `company_address`, `member_area_background_*`, `welcome_modal_*`, `cermat_question_count`, `cermat_duration_seconds`, `cermat_total_sessions`, `cermat_break_seconds`, `psiko_tryout_break_seconds`, `psiko_tryout_cermat_mode`, `exam_block_practice_enabled`, `exam_block_tryout_enabled`, `exam_block_exam_enabled`, `exam_block_cermat_enabled`.

Sumber lengkap: `backend/prisma/schema.prisma`. Clone PostgreSQL harus mencakup **semua** model di file itu.

---

## 7. Kontrak API

Base: **`/api/v1`**. Static: **`/uploads`**. Root `GET /` → nama API + status. Health: `GET /api/v1/health`.

Semua rute `/api/v1` mengirim `Cache-Control: no-store`. CORS: origin dari `FRONTEND_URL` (dev: semua origin). JSON body limit 2MB. `trust proxy = 1`.

### 7.1 Auth — `/api/v1/auth`

| Method | Path | Auth | Ket |
|---|---|---|---|
| POST | `/register` | — + RL | Register |
| POST | `/verify-email` | — | Verifikasi |
| POST | `/resend-verification` | — + RL | Resend |
| POST | `/login` | — + RL | Login |
| POST | `/refresh` | — | Rotate |
| POST | `/logout` | Bearer | Logout |
| GET | `/me` | Bearer | Profil |
| PATCH | `/me` | Bearer | Update |
| POST | `/password` | Bearer | Ganti password |
| POST | `/avatar` | Bearer | Upload |

### 7.2 Landing — `/api/v1/landing`

`GET /home`, `/profile`, `/packages`, `/gallery`, `/testimonials`, `/contact-info`, `/parent/:slug`.

### 7.3 Dashboard — `/api/v1/dashboard` (Bearer)

`GET /overview`, `/announcements`, `/faq`, `/news`, `/welcome-modal`, `/member-background`, `/exam-control`.  
`POST /calculator/:slug`.

### 7.4 Exams — `/api/v1/exams` (Bearer)

Tryout: `GET /tryouts`, `GET /tryouts/:slug/info`, `GET /tryouts/:slug`, `POST .../start`, `POST .../submit`, `GET /tryouts-history`, `GET /tryouts/results/:resultId/review`, `GET .../review-package`.

Practice: `GET /practice/categories`, `GET /practice/:slug/info`, `GET /practice/:slug`, `POST .../submit`, `GET /practice-history`, `GET /practice/results/:resultId/review`.

Cermat: `GET /cermat/config`, `POST /cermat/session`, `POST /cermat/session/:sessionId/submit`, `GET /cermat/history`, `GET /cermat/history/:attemptId`.

Blocks: `GET /blocks`, `GET /block-config`, `POST /blocks`, `POST /blocks/unlock`.

### 7.5 Ujian — `/api/v1/ujian` (Bearer)

Mirror tryout + practice + blocks (**tanpa** cermat dan tanpa review-package).

### 7.6 Lain

| Prefix | Endpoint |
|---|---|
| `/materials` | `GET /` (auth + membership), `POST /` (ADMIN) |
| `/commerce` | `GET /packages`, `/payment-info` (publik); `GET /addons`, `/membership/status`; `POST /transactions`; `POST /transactions/:code/confirm`; `GET /transactions`; `PATCH /transactions/:id` (ADMIN) |
| `/referrals` | `GET /me` |
| `/contact` | `POST /` |
| `/calculators` | `GET /`, `GET /:slug`, `POST /:slug/compute` (auth + membership) |

### 7.7 Admin — `/api/v1/admin` (Bearer + role ADMIN)

Grup: `/overview`, `/reporting/*`, `/ranking`, `/ranking/export`, `/landing/*` (CRUD stats/testimonials/gallery/videos/announcements/faq/news), `/announcements/export`, `/tryouts/*` (kategori, sub, CRUD, free, export, psiko-config), `/practice/*`, `/materials`, `/packages`, `/addons`, `/payment-setting`, `/site/*` (contact, member-background, exam-control, exam-block-config, welcome-modal, hero-image, hero-slides), `/exams/cermat-config`, `/dashboard/slides`, `/monitoring/users`, `/monitoring/system-metrics`, `/exams/blocks`, `/membership/grant-tryout`, `/contacts/messages`, `/calculators`, `/transactions`, `/users` (+ export, role, status, reset-password, impersonate), `/tools/convert-word-to-csv`, `/tools/questions-to-csv`.

Daftar path persis: `backend/src/modules/admin/admin.routes.ts`.

---

## 8. Non-fungsional

| Aspek | Wajib |
|---|---|
| PWA | Manifest, SW autoUpdate, apple-touch-icon, viewport no-zoom. Setelah deploy: hard refresh / clear cache |
| HTTPS | API dari halaman HTTPS harus HTTPS (hindari Mixed Content) |
| Keamanan | Validasi backend, hash password, JWT secret ≥32, Helmet, CORS ketat di production, sanitasi XSS, parameterized query (Prisma / sqlc) |
| Rate limit | Auth 30/15 menit |
| Upload | Avatar 3MB; bukti 5MB; content 4MB; exam cover/CSV 5MB; Word 15MB; hero 100MB. Gambar di-resize |
| Skor tryout/practice | kredit / total × 100 (tanpa simbol % di UI skor) |
| Skor cermat | band 85 / 70 |
| Observability | `pm2 logs` AS-IS; clone: structured log + health |
| Email | SMTP opsional; tanpa SMTP, verifikasi harus tetap punya jalur admin |

Desain: sidebar putih, chrome slate, aksen `brand-600`, card `rounded`. Mobile-first PWA.

---

## 9. Deploy

### 9.1 AS-IS (VPS sekarang)

```bash
cd /var/www/tactical-education
git pull origin main

cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart tactical-backend

cd ../frontend
# pastikan VITE_API_URL HTTPS di .env sebelum build
npm install
npm run build
pm2 restart tactical-frontend
```

Health: `curl http://127.0.0.1:5000/api/v1/health` dan `curl -I http://127.0.0.1:4173`.

### 9.2 TARGET clone

1. `docker compose up -d` (postgres, redis, api, nginx).
2. Jalankan migrasi PostgreSQL.
3. Seed opsional (admin + paket).
4. Build frontend dengan `VITE_API_URL=https://<domain>/api/v1`.
5. Certbot pada Nginx.
6. Backup: `pg_dump` terjadwal + volume uploads/MinIO.

---

## 10. Checklist kloning (parity)

Clone dianggap selesai jika semua ini lolos:

- [ ] Landing CMS (home, profil, paket, galeri, testimoni, kontak, orang tua)
- [ ] Register 3 langkah + verifikasi email + login role-split
- [ ] JWT access/refresh + sessionVersion + premium multi-device
- [ ] Sidebar member sesuai filter paket + section Ujian saat exam-control on
- [ ] Tryout hierarki, shuffle, timer, multi-correct, review, riwayat, kuota, free flags, jadwal
- [ ] POLRI PSIKO: sessionOrder, break, review-package, next cermat mode
- [ ] Practice 3-level + set, free flags, review
- [ ] Cermat NUMBER/LETTER/IMAGE, 10×60×60, break, riwayat, ikon
- [ ] Dual API `/exams` vs `/ujian`
- [ ] Exam block 6 digit + admin resolve
- [ ] Materi, kalkulator tree, pengumuman targeting, FAQ, news
- [ ] Paket/addon, transfer manual, bukti, aktivasi PAID, grant kuota
- [ ] Afiliasi kode + daftar referred
- [ ] Admin: Word→CSV, CSV import/export, ranking, reporting, monitoring, impersonate, reset password
- [ ] PWA installable; HTTPS tanpa Mixed Content
- [ ] Path API `/api/v1` kompatibel dengan frontend ini

### Di luar scope produk sekarang (jangan dikira missing)

- Payment gateway (Midtrans, dll.)
- Lupa password self-service
- Halaman ranking untuk member
- Komisi afiliasi / payout
- Video classroom / ruang kelas
- Role selain ADMIN/MEMBER

---

## 11. Tujuan akhir

Paket kloning **TACTICAL EDUCATION** harus:

1. Menyalin **perilaku produksi** di atas (bukan PRD v1 lama).
2. Bisa dijalankan sebagai PWA di VPS dengan HTTPS.
3. **AS-IS:** tetap Node + Express + Prisma + MySQL jika hanya dioperasikan repo ini.
4. **TARGET:** rewrite API ke **Go Fiber + PostgreSQL + Redis**, frontend React/Vite/PWA yang sama, kontrak `/api/v1` dipertahankan.

Sumber kebenaran kode: `backend/prisma/schema.prisma`, router di `backend/src/modules/**`, rute UI di `frontend/src/App.tsx`.
