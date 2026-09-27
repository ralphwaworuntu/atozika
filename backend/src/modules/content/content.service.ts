import { prisma } from '../../config/prisma';

function resolvePublicUrl(path: string | null | undefined, baseUrl?: string) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (!baseUrl) {
    return path;
  }
  return `${baseUrl}${path}`;
}

const fallbackStats = [
  { label: 'Materi Video', value: 1200 },
  { label: 'Soal Try Out', value: 4500 },
  { label: 'Jumlah Alumni', value: 724 },
  { label: 'Modul Interaktif', value: 35 },
];

const fallbackReasons = [
  'Pembentukan karakter kepemimpinan dan integritas, bukan sekadar hapalan soal.',
  'Bank soal terstandardisasi CAT untuk TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.',
  'Kurikulum taktis sesuai kisi resmi dan pola seleksi institusi elit.',
  'Simulasi ujian berdisiplin: timer, anti-cheat, dan evaluasi berkala.',
  'Laporan progres untuk orang tua serta pendampingan mentor berpengalaman.',
];

const fallbackPackages = [
  {
    name: 'Jalur Kedinasan & CPNS',
    category: 'KEDINASAN',
    price: 1499000,
    description: 'Persiapan terstruktur untuk sekolah kedinasan favorit dan seleksi CPNS.',
  },
  {
    name: 'BUMN & Bank Indonesia',
    category: 'BUMN',
    price: 1799000,
    description: 'Program elit untuk karier di BUMN dan Bank Indonesia.',
  },
];

const contactSettingKeys = ['company_email', 'whatsapp_primary', 'whatsapp_consult', 'company_address'] as const;

type ContactSettingKey = (typeof contactSettingKeys)[number];

function buildContactInfo(settings: Array<{ key: string; value: string }>) {
  const map = settings.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  const whatsappPrimary = map.whatsapp_primary ?? '6281234567890';
  return {
    email: map.company_email ?? 'hallo@atozika.id',
    whatsappPrimary,
    whatsappConsult: map.whatsapp_consult ?? whatsappPrimary,
    companyAddress: map.company_address ?? 'Alamat perusahaan belum diatur',
  };
}

export async function getHomeContent(baseUrl?: string) {
  const [stats, packages, testimonials, videos, heroSetting, heroSlides, contactSettings] = await Promise.all([
    prisma.landingStat.findMany(),
    prisma.membershipPackage.findMany({ where: { isActive: true }, take: 6 }),
    prisma.testimonial.findMany({ take: 6 }),
    prisma.youtubeVideo.findMany({ take: 6 }),
    prisma.siteSetting.findUnique({ where: { key: 'hero_image' } }),
    prisma.heroSlide.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    prisma.siteSetting.findMany({ where: { key: { in: [...contactSettingKeys] } } }),
  ]);

  const heroPath = heroSetting?.value ?? '/Alumni.png';
  const heroUrl = resolvePublicUrl(heroPath, baseUrl) ?? '/Alumni.png';
  const slides = heroSlides.length
    ? heroSlides.map((slide) => ({ id: slide.id, imageUrl: resolvePublicUrl(slide.imageUrl, baseUrl) ?? heroUrl }))
    : [{ id: 'fallback', imageUrl: heroUrl }];
  const contact = buildContactInfo(contactSettings);

  return {
    hero: {
      title: 'Menempa Intelektual, Mengunci Kelulusan.',
      subtitle:
        'Akademi Taktis Optimasi Integritas, Intelektual, dan Kepemimpinan. Persiapan elit, berstandar tinggi, dan terstruktur.',
      ctaPrimary: { label: 'Gabung Sekarang', href: '/auth/register' },
      ctaSecondary: { label: 'Paket Bimbel', href: '/paket-bimbel' },
      imageUrl: heroUrl,
      slides,
    },
    stats: stats.length ? stats : fallbackStats,
    reasons: fallbackReasons,
    packages: packages.length
      ? packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          category: pkg.category,
          price: pkg.price,
          description: pkg.description,
          badgeLabel: pkg.badgeLabel,
        }))
      : fallbackPackages,
    testimonials,
    videos,
    contact,
  };
}

export async function getContactInfo() {
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: [...contactSettingKeys] } } });
  return buildContactInfo(settings);
}

export async function getProfilePage() {
  const profileCopy = `ATOZIKA (Akademi Taktis Optimasi Zona Integritas, Kepemimpinan & Aparatur) berfokus pada pembentukan karakter kepemimpinan, daya saing intelektual, dan persiapan ujian kompetensi tinggi untuk posisi strategis di institusi pemerintahan, perbankan nasional, hingga panggung politik.

Kami menempa peserta dengan standar elit: disiplin, tegas, taktis, dan berintegritas tinggi — tepat untuk lulusan yang mengejar karier di Bank Indonesia, BUMN, sekolah kedinasan favorit, TNI, Polri, dan CPNS.`;

  return {
    title: 'Profil Lembaga',
    body: profileCopy,
    highlights: [
      'Citra taktis, tegas, disiplin, dan berintegritas tinggi.',
      'Kurikulum terstruktur untuk seleksi TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.',
      'Satu dashboard: tryout, latihan soal, tes kecermatan, materi, dan transaksi.',
    ],
  };
}

export async function getBimbelPackages() {
  const packages = await prisma.membershipPackage.findMany({ where: { isActive: true } });
  return packages;
}

export async function getGalleryContent() {
  const [alumni, activities] = await Promise.all([
    prisma.galleryItem.findMany({ where: { kind: 'ALUMNI' }, take: 12 }),
    prisma.galleryItem.findMany({ where: { kind: 'AKTIVITAS' }, take: 12 }),
  ]);
  return { alumni, activities };
}

export async function getTestimonials() {
  const testimonials = await prisma.testimonial.findMany({ take: 12 });
  return testimonials;
}
