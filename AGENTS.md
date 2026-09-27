# Arahan untuk AI Coding Agent

Dokumen ini dibaca lebih dulu saat proyek ATOZIKA dibuka di mesin lain. Tujuannya: menjalankan aplikasi lokal dengan aman, tanpa mengubah rahasia, tanpa mengirim data produksi, dan tanpa menebak stack yang sudah tidak dipakai.

## Yang sedang berjalan

- Frontend: React 19 + Vite. Perintah `npm run dev` di folder `frontend`. Alamat lokal `http://localhost:5174`.
- API: Go Fiber di folder `api`. Perintah `go run ./cmd/server`. Alamat lokal `http://127.0.0.1:5000`. Kontrak HTTP tetap `/api/v1`.
- Database: PostgreSQL 16 lewat Docker, port host **5434**.
- Cache: Redis 7 lewat Docker, port host **6380**.
- Folder `backend/` hanya untuk skema Prisma, migrasi, dan seed. Jangan jalankan server Express lama sebagai API.
- Folder `member-dashboard-v2/` adalah mockup HTML. Bukan aplikasi yang di-deploy.

## Prasyarat mesin

- Docker Desktop
- Go 1.23 atau lebih baru
- Node.js 20 atau lebih baru
- Git

Port yang harus kosong: `5174`, `5000`, `5434`, `6380`.

## Menyalakan proyek dari nol

Jalankan dari akar repositori.

```powershell
docker compose -f docker-compose.dev.yml up -d
cd backend
copy .env.example .env
npm install
npx prisma migrate deploy
npm run seed
cd ..\api
copy .env.example .env
go run ./cmd/server
```

Di terminal kedua:

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Buka `http://localhost:5174`.

Cek API: `GET http://127.0.0.1:5000/api/v1/health` harus menjawab `status: ok`.

Di Linux atau macOS, ganti `copy` dengan `cp`.

## Akun lokal dari seed

Hanya untuk mesin pengembangan. Jangan dipakai di server yang bisa diakses publik.

| Peran | Email | Password |
|---|---|---|
| Admin | admin@atozika.id | Admin@123 |
| Member | member@atozika.id | Member@123 |

## Aturan aman

- Jangan pernah meng-commit `.env`, `backend/.env`, `api/.env`, `frontend/.env`, kunci JWT, password SMTP, atau isi folder `uploads`.
- File contoh yang boleh ada di git hanya `*.env.example`.
- Password database `atozika_secret` dan rahasia di `.env.example` hanya untuk Docker lokal. Sebelum deploy, ganti `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, dan password Postgres. Panjang rahasia JWT minimal 32 karakter.
- Repositori GitHub ini publik. Jangan menaruh token, cookie sesi, atau dump database ke dalam kode atau commit.
- Jangan mengubah `git config`. Jangan `push --force` ke `main`.
- Jangan menghapus data Postgres atau menjalankan `prisma migrate reset` kecuali pengguna meminta dengan jelas.
- Jangan menonaktifkan aturan anti-cheat di klien supaya ujian bisa dilanjutkan. Buka blokir lewat kode di tabel `ExamBlock` atau lewat admin, hanya jika pengguna meminta.
- Upload pengguna ada di `backend/uploads` dan tidak ikut git.

## Peta kerja yang sering disentuh

- Halaman member: `frontend/src/pages/dashboard/`
- Gaya kartu member memakai kelas `member-card` di dalam `.member-shell` (`frontend/src/index.css`). Dialog yang di-portal ke `document.body` harus punya latar sendiri, karena kelas `member-card` tidak berlaku di luar shell.
- API Go: `api/cmd/server/main.go` dan `api/internal/`.
- Setelah mengubah kode Go, hentikan proses yang memakai port 5000 lalu jalankan ulang `go run ./cmd/server`. Perubahan frontend cukup disimpan; Vite memuat ulang sendiri.

## Saat diminta mengubah UI member

Ikuti komponen yang sudah ada di halaman Ringkasan (`frontend/src/pages/dashboard/DashboardHomePage.tsx`): kartu putih `member-card`, judul `font-extrabold`, dan mode gelap `dark:`. Mockup di `member-dashboard-v2/` adalah acuan visual, bukan sumber data.
