# ATOZIKA

**Akademi Taktis Optimasi Zona Integritas, Kepemimpinan & Aparatur**

> *Menempa Intelektual, Mengunci Kelulusan.*

PWA bimbel online untuk persiapan seleksi **TNI, Polri, Kedinasan, CPNS, BUMN, Bank Indonesia**, hingga kepemimpinan politik. Perilaku produk mengikuti spesifikasi PRD (landing CMS, dashboard member, panel admin, tryout, latihan soal, tes kecermatan, membership, afiliasi).

## Tema brand

Citra **taktis, tegas, disiplin, dan berintegritas tinggi**: palet tinta/navy + emas, tipografi akademi (Cormorant Garamond) dan UI komando (Barlow), landing gelap elit, dashboard member tetap terang agar ujian mudah dibaca.

## Stack

| Layer | Pilihan |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind 3 + PWA |
| API | Go + Fiber v2 (kontrak `/api/v1`) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Migrasi/seed | Prisma di folder `backend/` (skema & seed saja) |
| Orkestrasi | Docker Compose + Nginx |

Kontrak API tetap `/api/v1`. Health: `GET /api/v1/health` → `{ "status": "ok" }`. Frontend tidak berubah: PWA React memanggil API yang sama; nanti aplikasi mobile bisa memakai origin yang sama.

## Menjalankan di local

Prasyarat: Go 1.23+, Node.js 20+ (untuk frontend + seed Prisma), Docker Desktop.

PostgreSQL di mesin ini dipetakan ke **5434** dan Redis ke **6380** agar tidak bentrok dengan layanan lain. Frontend Vite memakai **5174**. API Fiber memakai **5000**.

```bash
# 1. PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# 2. Skema & seed (sekali, dari Prisma)
cd backend
copy .env.example .env
npm install
npx prisma migrate deploy
npm run seed
cd ..

# 3. API Go Fiber
cd api
copy .env.example .env
go run ./cmd/server

# 4. Frontend (terminal baru)
cd frontend
copy .env.example .env
npm install
npm run dev
```

`go run ./cmd/server` juga membaca `backend/.env` jika `api/.env` belum ada. Upload memakai folder `backend/uploads` agar file yang sudah ada tetap terlayani.

Buka `http://localhost:5174`.

Arahan untuk AI coding agent di mesin lain ada di [AGENTS.md](AGENTS.md). Ikuti berkas itu sebelum menyalakan server atau mengubah kode.

### Akun seed

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@atozika.id` | `Admin@123` |
| Developer (terproteksi) | `developer@atozika.id` | `Developer@123` |
| Member | `member@atozika.id` | `Member@123` |
| Premium | `premium@atozika.id` | `Premium@123` |

Kode referral prefix: `ATOZ` + 6 karakter.

## Produksi (Docker)

1. Salin `backend/.env.example` → `backend/.env` dan ganti JWT secret (≥32 karakter).
2. `docker compose up -d --build`
3. Aplikasi di `http://localhost:8080` (Nginx → PWA + `/api/v1` + `/uploads`).

Compose menjalankan migrasi Prisma sekali, lalu API Go Fiber. Folder `backend/` Express lama boleh tetap sebagai referensi; runtime produksi memakai `api/`.

Pastikan halaman HTTPS hanya memanggil API HTTPS (hindari Mixed Content). Set `VITE_API_URL` ke origin yang sama, misalnya `https://app.atozika.id/api/v1`.

## Modul

- Publik: Home, Profil, Paket, Orang Tua, Galeri, Testimoni, Hubungi Kami
- Auth: register 3 langkah, verifikasi email, login role-split
- Member: dashboard, pengumuman, FAQ, berita, kalkulator, tryout, latihan, kecermatan, ujian (jika exam-control aktif), materi, membership, afiliasi
- Admin: CMS, bank soal, Word→CSV, commerce, aktivasi, ranking, monitoring, impersonate

Lupa password self-service tidak tersedia (sesuai PRD) — login menautkan WhatsApp admin.
