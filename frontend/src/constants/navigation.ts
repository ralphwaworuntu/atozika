type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export const publicNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Paket Bimbel', href: '/paket-bimbel' },
  { label: 'Tentang Kami', href: '/profil' },
  { label: 'Hubungi Kami', href: '/hubungi-kami' },
];

export const dashboardMenu: NavSection[] = [
  {
    title: 'Dashboard',
    items: [{ label: 'Ringkasan', to: '/app', exact: true }],
  },
  {
    title: 'Informasi',
    items: [
      { label: 'Pengumuman', to: '/app/pengumuman' },
      { label: 'Berita', to: '/app/berita' },
      { label: 'Kalkulator', to: '/app/kalkulator' },
    ],
  },
  {
    title: 'Latihan',
    items: [
      { label: 'Tryout', to: '/app/latihan/tryout' },
      { label: 'Latihan Soal', to: '/app/latihan-soal' },
      { label: 'Tes Kecermatan', to: '/app/tes-kecermatan' },
    ],
  },
  {
    title: 'Riwayat',
    items: [
      { label: 'Riwayat Tryout', to: '/app/latihan/tryout/riwayat' },
      { label: 'Riwayat Latihan', to: '/app/latihan-soal/riwayat' },
      { label: 'Riwayat Kecermatan', to: '/app/tes-kecermatan/riwayat' },
    ],
  },
  {
    title: 'Materi',
    items: [{ label: 'Modul & Materi', to: '/app/materi' }],
  },
  {
    title: 'Beli Paket',
    items: [
      { label: 'Paket Membership', to: '/app/paket-membership' },
      { label: 'Konfirmasi Pembayaran', to: '/app/konfirmasi-pembayaran' },
      { label: 'Riwayat Transaksi', to: '/app/riwayat-transaksi' },
    ],
  },
  {
    title: 'Member Get Member',
    items: [{ label: 'Afiliasi', to: '/app/afiliasi' }],
  },
];

const examNavPaths = [
  '/app/ujian/tryout',
  '/app/ujian/tryout/riwayat',
  '/app/ujian/soal',
  '/app/ujian/soal/riwayat',
];

export function isDashboardPathActive(pathname: string, to: string, end?: boolean) {
  if (pathname === to) return true;
  if (end || !pathname.startsWith(`${to}/`)) return false;
  const paths = [...dashboardMenu.flatMap((section) => section.items.map((item) => item.to)), ...examNavPaths];
  return !paths.some(
    (other) => other !== to && other.startsWith(`${to}/`) && (pathname === other || pathname.startsWith(`${other}/`)),
  );
}

export const adminMenu: NavSection[] = [
  {
    title: 'Umum',
    items: [
      { label: 'Overview', to: '/admin', exact: true },
      { label: 'Landing Content', to: '/admin/landing' },
      { label: 'Pengumuman', to: '/admin/announcements' },
      { label: 'Reporting', to: '/admin/reporting' },
      { label: 'Ranking', to: '/admin/ranking' },
      { label: 'Pesan Kontak', to: '/admin/contacts' },
    ],
  },
  {
    title: 'Kontrol Ujian',
    items: [{ label: 'Kontrol Ujian', to: '/admin/exam-control' }],
  },
  {
    title: 'Konten Akademik',
    items: [
      { label: 'Konversi Word → CSV', to: '/admin/word-converter' },
      { label: 'Tryouts & Tes', to: '/admin/tryouts' },
      { label: 'Latihan & Tugas', to: '/admin/practice' },
      { label: 'Pengaturan Kecermatan', to: '/admin/kecermatan' },
      { label: 'Materi Belajar', to: '/admin/materials' },
      { label: 'Kalkulator', to: '/admin/calculators' },
    ],
  },
  {
    title: 'Bisnis',
    items: [
      { label: 'Paket & Transaksi', to: '/admin/commerce' },
      { label: 'Aktivasi Membership', to: '/admin/activation' },
       { label: 'Monitoring Member', to: '/admin/monitoring' },
      { label: 'Manajemen User', to: '/admin/users' },
    ],
  },
];
