export type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const publicNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Paket Bimbel', href: '/paket-bimbel' },
  { label: 'Tentang Kami', href: '/profil' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Testimoni', href: '/testimoni' },
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
    title: 'Materi',
    items: [{ label: 'Modul & Materi', to: '/app/materi' }],
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
    title: 'Dashboard',
    items: [{ label: 'Ringkasan', to: '/admin', exact: true }],
  },
  {
    title: 'Informasi',
    items: [
      { label: 'Pengumuman', to: '/admin/announcements' },
      { label: 'Berita', to: '/admin/news' },
      { label: 'Kalkulator', to: '/admin/calculators' },
    ],
  },
  {
    title: 'Materi',
    items: [{ label: 'Modul & Materi', to: '/admin/materials' }],
  },
  {
    title: 'Latihan',
    items: [
      { label: 'Tryout', to: '/admin/tryouts' },
      { label: 'Latihan Soal', to: '/admin/practice' },
      { label: 'Tes Kecermatan', to: '/admin/kecermatan' },
      { label: 'Kontrol Ujian', to: '/admin/exam-control' },
      { label: 'Konversi Word', to: '/admin/word-converter' },
    ],
  },
  {
    title: 'Riwayat',
    items: [
      { label: 'Riwayat Member', to: '/admin/monitoring' },
      { label: 'Laporan Hasil', to: '/admin/reporting' },
      { label: 'Peringkat', to: '/admin/ranking' },
    ],
  },
  {
    title: 'Beli Paket',
    items: [
      { label: 'Paket Membership', to: '/admin/commerce' },
      { label: 'Konfirmasi Pembayaran', to: '/admin/activation' },
      { label: 'Pesan Kontak', to: '/admin/contacts' },
    ],
  },
  {
    title: 'Member',
    items: [
      { label: 'Afiliasi', to: '/admin/referrals' },
      { label: 'Manajemen User', to: '/admin/users' },
      { label: 'Log Aktivitas', to: '/admin/activity-logs' },
      { label: 'WhatsApp Orang Tua', to: '/admin/whatsapp' },
      { label: 'Monitoring Sistem', to: '/admin/system-monitoring' },
    ],
  },
  {
    title: 'Situs',
    items: [
      { label: 'Beranda', to: '/admin/beranda' },
      { label: 'Profil Lembaga', to: '/admin/profil' },
      { label: 'FAQ', to: '/admin/faq' },
      { label: 'Landing', to: '/admin/landing' },
      { label: 'Tampilan Member', to: '/admin/tampilan' },
    ],
  },
];
