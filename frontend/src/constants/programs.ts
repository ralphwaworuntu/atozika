export type ProgramTier = {
  tier: string;
  name: string;
  price: number;
  originalPrice: number;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: 'outline' | 'primary' | 'whatsapp';
  featured?: boolean;
  badge?: string;
};

export const programCatalog = {
  title: 'Katalog Program & Biaya Bimbingan',
  subtitle: 'Pilihan paket fleksibel disesuaikan kebutuhan calon prajurit & taruna se-NTT.',
  tiers: [
    {
      tier: 'Tier 1',
      name: 'Paket Starter (Tryout Only)',
      price: 79000,
      originalPrice: 129000,
      features: ['Akses Platform 30 Hari', '5x Simulasi CAT & Tes Kecermatan', 'Masuk Leaderboard Regional NTT'],
      ctaLabel: 'Checkout QRIS / E-Wallet',
      ctaHref: '/auth/register',
      ctaVariant: 'outline',
    },
    {
      tier: 'Tier 2',
      name: 'Paket Live Class / Intensive',
      price: 499000,
      originalPrice: 699000,
      features: ['Akses Kelas Zoom Interaktif', 'Modul Pembelajaran PDF Lengkap', 'Tryout CAT Unlimited & WA Group'],
      ctaLabel: 'Pilih Paket Intensive',
      ctaHref: '/auth/register',
      ctaVariant: 'primary',
      featured: true,
      badge: 'Paling Populer',
    },
    {
      tier: 'Tier 3',
      name: 'Paket Platinum / Offline Kupang',
      price: 2500000,
      originalPrice: 4500000,
      features: ['Tatap Muka Luring di Kupang', 'Bimbingan Fisik Stadion Oepoi Kupang', 'Audit Medis & Rikkes Awal'],
      ctaLabel: 'Konsultasi WA & Booking Seat',
      ctaHref: 'whatsapp',
      ctaVariant: 'whatsapp',
    },
  ] satisfies ProgramTier[],
};
