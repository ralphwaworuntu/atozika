import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpen, HeartPulse, ListChecks, MonitorPlay, Timer, type LucideIcon } from 'lucide-react';
import { SectionHeader } from '@/components/common/PageHeader';
import type { HomeCopy } from '@/types/siteContent';
import { selectionPillars } from '@/constants/pillars';

const ICONS: Record<string, LucideIcon> = {
  monitor: MonitorPlay,
  timer: Timer,
  activity: Activity,
  heart: HeartPulse,
  book: BookOpen,
  list: ListChecks,
};

const fallback = {
  eyebrow: 'Keunggulan Utama',
  title: '4 Pilar Seleksi Terpadu',
  description: 'Empat komponen seleksi dalam satu sistem: akademik, psikotes, jasmani, dan medis.',
  items: selectionPillars.map((pillar, index) => ({
    number: pillar.number,
    title: pillar.title,
    description: pillar.description,
    ctaLabel: pillar.ctaLabel,
    ctaHref: pillar.ctaHref,
    icon: ['monitor', 'timer', 'activity', 'heart'][index] ?? 'book',
  })),
};

export function SelectionPillars({ block }: { block?: HomeCopy['pillars'] }) {
  const data = block?.items?.length ? block : fallback;
  return (
    <section aria-labelledby="selection-pillars-title">
      <SectionHeader
        eyebrow={data.eyebrow}
        title={data.title}
        titleClassName="type-hero"
        description={data.description}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.items.map((pillar) => {
          const Icon = ICONS[pillar.icon] ?? BookOpen;
          return (
            <article key={pillar.number + pillar.title} className="flex h-full flex-col rounded-xl border border-brand-400/20 bg-ink-800 p-5 shadow-command sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="type-hero text-brand-400/80">{pillar.number}</span>
              </div>
              <h3 className="type-h1 mt-5 text-ink-50">{pillar.title}</h3>
              <p className="type-body mt-2 flex-1 text-ink-200">{pillar.description}</p>
              <Link to={pillar.ctaHref || '/profil'} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 transition hover:text-brand-200">
                {pillar.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
