export type LandingFaq = {
  id: string;
  question: string;
  answer: string;
};

export const landingFaqs: LandingFaq[] = [
  {
    id: 'apa-itu-atozika',
    question: 'Apa itu ATOZIKA?',
    answer:
      'ATOZIKA (Akademi Taktis Optimasi Zona Integritas, Kepemimpinan & Aparatur) adalah bimbel elit untuk seleksi TNI, Polri, kedinasan, CPNS, BUMN, dan Bank Indonesia. Bukan hapalan soal semata — kami menempa karakter, intelektualitas, dan disiplin ujian dalam satu sistem PWA.',
  },
  {
    id: 'sistem-bimbel',
    question: 'Bagaimana sistem bimbel ATOZIKA berjalan?',
    answer:
      'Pembelajaran terpadu: simulasi CAT 1:1, latihan soal, tes kecermatan ber-timer, materi/modul, serta live class atau bimbingan luring di Kupang (sesuai paket). Setiap sesi tercatat di dashboard: skor, kuota, riwayat, dan rekomendasi latihan.',
  },
  {
    id: 'paket-bimbel',
    question: 'Apa saja paket bimbel yang tersedia?',
    answer:
      'Ada jalur fleksibel: paket tryout, live class intensif, hingga Platinum/offline Kupang dengan bimbingan fisik di Stadion Oepoi. Pilih sesuai target institusi dan durasi akses. Pendaftaran lewat halaman Paket Bimbel atau registrasi akun.',
  },
  {
    id: 'laporan-orang-tua',
    question: 'Bagaimana orang tua mengakses laporan perkembangan?',
    answer:
      'Setiap member memiliki Kode Akses Orang Tua di dashboard. Orang tua membuka halaman Orang Tua, memasukkan kode tersebut, lalu melihat ringkasan tryout, latihan soal, tes kecermatan, dan status membership — tanpa membuat akun sendiri.',
  },
  {
    id: 'wa-magic-link',
    question: 'Apa itu Parent WA Magic Link?',
    answer:
      'Fitur pengiriman rapor otomatis ke WhatsApp orang tua. Tanpa login atau password, orang tua menerima ringkasan diagnostik (skor CAT, nilai lari/fisik, kehadiran) beserta grafik perkembangan. Cukup nomor WhatsApp yang terdaftar pada data orang tua.',
  },
  {
    id: 'ortu-tanpa-login',
    question: 'Apakah orang tua wajib punya akun ATOZIKA?',
    answer:
      'Tidak. Orang tua tidak perlu daftar, login, atau mengingat password. Ada dua jalur: masukkan kode akses di halaman Orang Tua, atau terima rapor lewat WA Magic Link yang dikirim otomatis.',
  },
  {
    id: 'garansi-sistem',
    question: 'Apa itu Garansi Sistem ATOZIKA?',
    answer:
      'Garansi Sistem menjamin tiga hal selama membership aktif: (1) akses PWA lintas perangkat, (2) integritas ujian — timer, anti-cheat, dan skor tidak boleh hilang, (3) laporan orang tua terkirim sesuai jadwal. Jika sesi gagal karena gangguan sistem, kuota yang terpotong dikembalikan setelah diverifikasi tim.',
  },
  {
    id: 'garansi-bukan-kelulusan',
    question: 'Apakah Garansi Sistem menjamin kelulusan?',
    answer:
      'Tidak. Garansi Sistem melindungi keandalan platform dan pencatatan hasil, bukan hasil seleksi institusi. Kelulusan tetap ditentukan disiplin latihan, tes resmi, dan kuota formasi. Kami menjamin sistemnya bekerja; peserta yang menempa diri.',
  },
];
