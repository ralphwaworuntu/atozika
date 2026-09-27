import { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';

type Topic = 'edukasi' | 'kuota' | 'alumni';

const FILTERS: Array<{ id: 'semua' | Topic; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'edukasi', label: 'Edukasi & Strategi' },
  { id: 'kuota', label: 'Kuota & Formasi' },
  { id: 'alumni', label: 'Alumni' },
];

const SECTIONS: Array<{ id: Topic; title: string }> = [
  { id: 'edukasi', title: 'Artikel Edukatif, Tips & Trik Lulus Fisik, Strategi HOTS' },
  { id: 'kuota', title: 'Informasi Kuota & Formasi Penerimaan TNI, POLRI, KEDINASAN, BUMN' },
  { id: 'alumni', title: 'Kisah Inspiratif & Testimoni Kelulusan Alumni Atozika' },
];

type Article = {
  id: string;
  topic: Topic;
  kicker: string;
  title: string;
  excerpt: string;
  cover: CoverTone;
};

type CoverTone = 'study' | 'run' | 'hots' | 'chart' | 'shield' | 'story';

const ARTICLES: Article[] = [
  {
    id: 'e1',
    topic: 'edukasi',
    kicker: 'Artikel Edukatif',
    title: 'Cara membaca soal TWK tanpa terburu',
    excerpt: 'Tandai kata kunci di stimulus, lalu coret pilihan yang bertentangan dengan pasal.',
    cover: 'study',
  },
  {
    id: 'e2',
    topic: 'edukasi',
    kicker: 'Tips & Trik Fisik',
    title: 'Lari 12 menit yang tidak mudah drop',
    excerpt: 'Bagi tempo jadi tiga bagian. Jaga napas di dua menit pertama, baru naikkan langkah.',
    cover: 'run',
  },
  {
    id: 'e3',
    topic: 'edukasi',
    kicker: 'Strategi HOTS',
    title: 'Urutkan argumen sebelum memilih jawaban',
    excerpt: 'Soal HOTS menguji hubungan sebab-akibat. Tulis premis singkat di kertas buram.',
    cover: 'hots',
  },
  {
    id: 'e4',
    topic: 'edukasi',
    kicker: 'Tips & Trik Fisik',
    title: 'Push-up, sit-up, dan pull-up seminggu',
    excerpt: 'Latihan tiga set di hari selang. Tambah dua repetisi hanya jika bentuk gerakan masih rapi.',
    cover: 'run',
  },
  {
    id: 'e5',
    topic: 'edukasi',
    kicker: 'Strategi HOTS',
    title: 'Jebakan opsi yang mirip di TIU',
    excerpt: 'Bandingkan dua pilihan terakhir. Pilih yang menjawab seluruh bagian pertanyaan.',
    cover: 'hots',
  },
  {
    id: 'e6',
    topic: 'edukasi',
    kicker: 'Artikel Edukatif',
    title: 'Istirahat sebelum hari tes samapta',
    excerpt: 'Tidur cukup dan makan ringan. Jangan uji lari maksimal di H-1.',
    cover: 'study',
  },
  {
    id: 'k1',
    topic: 'kuota',
    kicker: 'Polda NTT',
    title: 'Membaca formasi Bintara Polri',
    excerpt: 'Cek jalur pria dan wanita, lalu cocokkan dengan ijazah yang kamu miliki.',
    cover: 'chart',
  },
  {
    id: 'k2',
    topic: 'kuota',
    kicker: 'Polda NTT',
    title: 'Kuota Tamtama wilayah NTT',
    excerpt: 'Kuota resmi berubah tiap gelombang. Simpan pengumuman Polda sebagai acuan.',
    cover: 'shield',
  },
  {
    id: 'k3',
    topic: 'kuota',
    kicker: 'Korem',
    title: 'Formasi penerimaan Korem 161',
    excerpt: 'Perhatikan satuan, jenis kelamin, dan syarat tinggi badan di lampiran resmi.',
    cover: 'shield',
  },
  {
    id: 'k4',
    topic: 'kuota',
    kicker: 'Polda NTT',
    title: 'Perbedaan kuota Akpol dan Bintara',
    excerpt: 'Akpol memakai seleksi nasional. Bintara mengikuti formasi Polda setempat.',
    cover: 'chart',
  },
  {
    id: 'k5',
    topic: 'kuota',
    kicker: 'Korem',
    title: 'Apa yang dicek di pengumuman formasi',
    excerpt: 'Jumlah kursi, domisili, dan jadwal daftar ulang biasanya ada di satu lampiran.',
    cover: 'chart',
  },
  {
    id: 'k6',
    topic: 'kuota',
    kicker: 'Polda NTT',
    title: 'Siapkan berkas sebelum kuota dibuka',
    excerpt: 'Rapikan ijazah, KTP, dan surat keterangan sehat supaya unggahan tidak tertunda.',
    cover: 'shield',
  },
  {
    id: 'a1',
    topic: 'alumni',
    kicker: 'Testimoni',
    title: 'Lulus Bintara setelah tryout konsisten',
    excerpt: 'Alumni Atozika menyebut jadwal malam dan review soal salah sebagai kebiasaan utama.',
    cover: 'story',
  },
  {
    id: 'a2',
    topic: 'alumni',
    kicker: 'Kisah Inspiratif',
    title: 'Dari nilai fisik merah ke lulus samapta',
    excerpt: 'Latihan lapangan tiga kali seminggu mengubah catatan lari dalam dua bulan.',
    cover: 'run',
  },
  {
    id: 'a3',
    topic: 'alumni',
    kicker: 'Testimoni',
    title: 'Orang tua menemani jadwal belajar',
    excerpt: 'Dukungan di rumah membantu alumni menjaga target mingguan sampai hari tes.',
    cover: 'story',
  },
  {
    id: 'a4',
    topic: 'alumni',
    kicker: 'Kisah Inspiratif',
    title: 'Strategi HOTS yang dipakai saat CAT',
    excerpt: 'Alumni mengerjakan soal mudah lebih dulu, lalu kembali ke stimulus yang panjang.',
    cover: 'hots',
  },
  {
    id: 'a5',
    topic: 'alumni',
    kicker: 'Testimoni',
    title: 'Kelulusan Akpol dari kelas tahun lalu',
    excerpt: 'Rutinitas baca materi pagi dan tryout akhir pekan menjadi pola yang dipertahankan.',
    cover: 'study',
  },
  {
    id: 'a6',
    topic: 'alumni',
    kicker: 'Kisah Inspiratif',
    title: 'Tetap latihan saat sekolah masih padat',
    excerpt: 'Alumni memecah sesi jadi 40 menit sepulang sekolah supaya fisik tidak tertinggal.',
    cover: 'story',
  },
];

function NewsCover({ id, tone }: { id: string; tone: CoverTone }) {
  const gradientId = `news-cover-${id}`;
  const stops =
    tone === 'run'
      ? ['#D7F8E8', '#7DDCB0', '#14945C']
      : tone === 'hots'
        ? ['#EDE4FF', '#C4B5FD', '#7C3AED']
        : tone === 'chart'
          ? ['#FFF4D6', '#F6C453', '#D97706']
          : tone === 'shield'
            ? ['#FFE4E6', '#FDA4AF', '#E11D48']
            : tone === 'story'
              ? ['#E0F2FE', '#7DD3FC', '#0284C7']
              : ['#D7EEFF', '#93C5FD', '#1D72FE'];

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Contoh gambar artikel">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gradientId})`} />
      <circle cx="156" cy="42" r="28" fill="white" fillOpacity="0.35" />
      <rect x="28" y="118" width="144" height="54" rx="16" fill="white" fillOpacity="0.28" />
      {tone === 'chart' ? (
        <>
          <rect x="48" y="96" width="18" height="52" rx="6" fill="white" />
          <rect x="78" y="72" width="18" height="76" rx="6" fill="white" fillOpacity="0.85" />
          <rect x="108" y="84" width="18" height="64" rx="6" fill="white" />
          <rect x="138" y="58" width="18" height="90" rx="6" fill="white" fillOpacity="0.9" />
        </>
      ) : tone === 'run' ? (
        <>
          <circle cx="78" cy="78" r="16" fill="white" />
          <path d="M70 108c18-22 36-8 48 6 8 10 22 12 34 4" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M46 150h108" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        </>
      ) : tone === 'shield' ? (
        <path d="M100 42l46 18v34c0 28-20 48-46 58-26-10-46-30-46-58V60l46-18z" fill="white" fillOpacity="0.92" />
      ) : tone === 'hots' ? (
        <>
          <rect x="46" y="58" width="46" height="46" rx="12" fill="white" />
          <rect x="108" y="58" width="46" height="46" rx="12" fill="white" fillOpacity="0.75" />
          <rect x="76" y="112" width="46" height="46" rx="12" fill="white" fillOpacity="0.9" />
        </>
      ) : tone === 'story' ? (
        <>
          <circle cx="78" cy="78" r="18" fill="white" />
          <circle cx="124" cy="74" r="14" fill="white" fillOpacity="0.8" />
          <path d="M48 132c8-18 22-26 34-26s24 8 32 26" fill="white" />
          <path d="M108 128c6-14 16-20 26-20 12 0 20 8 26 22" fill="white" fillOpacity="0.85" />
        </>
      ) : (
        <>
          <rect x="48" y="56" width="104" height="72" rx="12" fill="white" />
          <path d="M64 78h72M64 96h48" stroke={stops[2]} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function NewsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('semua');
  const visible = useMemo(
    () => SECTIONS.filter((section) => filter === 'semua' || section.id === filter),
    [filter],
  );

  return (
    <div className="space-y-6">
      <nav
        className="inline-flex max-w-full flex-wrap rounded-full border border-slate-200/70 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5"
        aria-label="Filter berita"
      >
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              filter === item.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50'
                : 'text-slate-500',
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {visible.map((section) => {
        const articles = ARTICLES.filter((article) => article.topic === section.id);
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">{section.title}</h2>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {articles.map((article) => (
                <article key={article.id} className="member-card overflow-hidden transition hover:shadow-md">
                  <div className="aspect-square">
                    <NewsCover id={article.id} tone={article.cover} />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{article.kicker}</p>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-800 dark:text-ink-50">{article.title}</h3>
                    <p className="line-clamp-3 text-[11px] font-semibold leading-snug text-slate-400">{article.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
