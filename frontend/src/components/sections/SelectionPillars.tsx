import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/common/PageHeader';
import { selectionPillars } from '@/constants/pillars';

export function SelectionPillars() {
  return (
    <section aria-labelledby="selection-pillars-title">
      <SectionHeader
        eyebrow="Keunggulan Utama"
        title="4 Pilar Seleksi Terpadu"
        titleClassName="type-hero"
        description="Empat komponen seleksi dalam satu sistem: akademik, psikotes, jasmani, dan medis."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {selectionPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article
              key={pillar.number}
              className="flex h-full flex-col rounded-xl border border-brand-400/20 bg-ink-800 p-5 shadow-command sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="type-hero text-brand-400/80">{pillar.number}</span>
              </div>
              <h3 className="type-h1 mt-5 text-ink-50">{pillar.title}</h3>
              <p className="type-body mt-2 flex-1 text-ink-200">{pillar.description}</p>
              <Link
                to={pillar.ctaHref}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 transition hover:text-brand-200"
              >
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
