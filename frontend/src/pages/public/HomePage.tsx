import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Clapperboard, GraduationCap, ListChecks, type LucideIcon } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { HomeContent } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/common/PageHeader';
import { PromoHighlight } from '@/components/sections/PromoHighlight';
import { SelectionPillars } from '@/components/sections/SelectionPillars';
import { ProgramCatalog } from '@/components/sections/ProgramCatalog';
import { ParentMagicLink } from '@/components/sections/ParentMagicLink';
import { FaqSection } from '@/components/sections/FaqSection';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { logoSrcForTheme } from '@/lib/brand';

function slideSrc(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith('/uploads/')) return url;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function HeroVisual({
  slides,
  logoSrc,
}: {
  slides: Array<{ id: string; imageUrl: string }>;
  logoSrc: string;
}) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const visible = slides.filter((slide) => slide.imageUrl && !failed[slide.id]);
  const current = visible[0];

  if (!current) {
    return (
      <img
        src={logoSrc}
        alt="ATOZIKA"
        width={720}
        height={720}
        decoding="sync"
        fetchPriority="high"
        className="brand-logo h-auto w-full max-w-md object-contain drop-shadow-[0_24px_60px_rgba(176,138,50,0.28)] md:max-w-lg lg:max-w-xl"
      />
    );
  }

  return (
    <img
      src={slideSrc(current.imageUrl)}
      alt=""
      className="max-h-[28rem] w-full max-w-xl rounded-3xl object-contain"
      onError={() => setFailed((prev) => ({ ...prev, [current.id]: true }))}
    />
  );
}

function iconForStat(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes('video')) return Clapperboard;
  if (key.includes('try') || key.includes('soal')) return ListChecks;
  if (key.includes('alumni') || key.includes('lulus')) return GraduationCap;
  if (key.includes('modul') || key.includes('materi')) return BookOpen;
  return BookOpen;
}

export function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: ['home-content'], queryFn: () => apiGet<HomeContent>('/landing/home') });
  const theme = useResolvedTheme();
  const heroLogoSrc = logoSrcForTheme(theme);
  const copy = data?.copy;
  const heroSlides = (data?.hero.slides ?? []).filter((slide) => slide.id !== 'fallback' && slide.imageUrl);

  if (isLoading || !data) {
    return (
      <div id="home-hero" className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="space-y-8">
      <section id="home-hero" className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="type-hero text-ink-50">{data.hero.title}</h1>
          <p className="type-body mt-4 text-ink-200">{data.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={data.hero.ctaPrimary.href}>{data.hero.ctaPrimary.label}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={data.hero.ctaSecondary.href}>{data.hero.ctaSecondary.label}</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <HeroVisual slides={heroSlides} logoSrc={heroLogoSrc} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {data.stats.map((stat) => {
          const Icon = iconForStat(stat.label);
          return (
            <div key={stat.label} className="surface-card flex flex-col items-center px-4 py-4 text-center sm:px-5 sm:py-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-2 text-xl font-bold text-brand-500 sm:text-2xl">{stat.value.toLocaleString('id-ID')}</p>
              <p className="type-caption mt-1 text-ink-200">{stat.label}</p>
            </div>
          );
        })}
      </section>

      <PromoHighlight promo={copy?.promo} />
      </div>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow={copy?.about.eyebrow || 'Apa itu ATOZIKA?'}
            title={copy?.about.title || 'Akademi untuk karakter, intelektualitas, dan kelulusan'}
            titleClassName="type-hero"
          />
          {(copy?.about.paragraphs?.length ? copy.about.paragraphs : [
            'ATOZIKA menempa peserta untuk posisi strategis di pemerintahan, perbankan nasional, dan panggung politik. Bukan bimbel biasa — ini zona latihan berstandar tinggi: terukur, terstruktur, dan elit.',
            'Tryout CAT, latihan soal, tes kecermatan, materi, dan laporan orang tua berada dalam satu PWA. Setiap sesi dirancang untuk mengunci kelulusan.',
          ]).map((paragraph) => (
            <p key={paragraph} className="type-body mt-4 text-ink-200">{paragraph}</p>
          ))}
        </div>
        <Card className="border-brand-400/25 bg-ink-800 text-ink-50">
          <CardContent className="space-y-4 p-6">
            <h3 className="type-h1 text-ink-50">{copy?.about.advantagesTitle || 'Keunggulan Komando'}</h3>
            <ul className="type-body space-y-3 text-ink-200">
              {(copy?.about.advantages?.length ? copy.about.advantages : [
                'Simulasi ujian berdisiplin dengan anti-cheat',
                'Tracking skor, kuota, dan rekomendasi latihan',
                'Akses PWA lintas perangkat — premium multi-device',
                'Afiliasi member get member tanpa komisi rumit',
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <SelectionPillars block={copy?.pillars} />

      <ParentMagicLink />

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardContent className="p-6">
            <SectionHeader eyebrow={copy?.challenges.eyebrow || 'Tantangan Seleksi'} title={copy?.challenges.title || 'Persaingan elit membutuhkan standar elit'} />
            <ul className="type-body mt-4 space-y-3 text-slate-600 dark:text-ink-200">
              {(copy?.challenges.items?.length ? copy.challenges.items : [
                'Kuota sempit di TNI, Polri, kedinasan, dan BUMN',
                'Pola soal CAT yang berubah dan semakin ketat',
                'Kurang disiplin latihan, evaluasi, dan ketahanan mental',
                'Belum terbiasa dengan sistem ujian berintegritas tinggi',
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6">
            <SectionHeader eyebrow={copy?.reasonsEyebrow || 'Kenapa ATOZIKA?'} title={copy?.reasonsTitle || 'Taktis, tegas, disiplin, berintegritas'} />
            <ul className="type-body mt-4 space-y-3 text-slate-600 dark:text-ink-200">
              {data.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <ProgramCatalog catalog={copy?.programs} />

      <section>
        <SectionHeader eyebrow="Testimoni" title="Cerita dari para alumni" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.testimonials.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-6">
                <p className="type-body text-ink-200">“{item.message}”</p>
                <div>
                  <p className="type-h2 text-ink-50">{item.name}</p>
                  {item.role && <p className="type-caption text-brand-500">{item.role}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {data.videos.length ? (
        <section>
          <SectionHeader eyebrow={copy?.videos.eyebrow || 'Video'} title={copy?.videos.title || 'Cuplikan kelas dan alumni'} />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {data.videos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-xl border border-brand-400/20 bg-ink-800">
                {video.embedUrl.startsWith('https://') ? (
                  <iframe title={video.title} src={video.embedUrl} className="aspect-video w-full" allowFullScreen />
                ) : null}
                <div className="space-y-1 p-4">
                  <h3 className="type-h2 text-ink-50">{video.title}</h3>
                  {video.description ? <p className="type-caption text-ink-200">{video.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <FaqSection header={copy?.faq} />
    </div>
  );
}
