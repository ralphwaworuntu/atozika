import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useContactConfig } from '@/hooks/useContactConfig';
import { programCatalog } from '@/constants/programs';

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function ProgramCatalog() {
  const { data: contact } = useContactConfig();
  const whatsappNumber = (contact?.whatsappConsult ?? contact?.whatsappPrimary ?? '6281234567890').replace(/[^0-9]/g, '');
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Halo ATOZIKA, saya ingin konsultasi dan booking seat Paket Platinum / Offline Kupang.',
  )}`;

  return (
    <section aria-labelledby="program-catalog-title">
      <div className="text-center">
        <h2 id="program-catalog-title" className="type-hero text-ink-50">
          {programCatalog.title}
        </h2>
        <p className="type-body mx-auto mt-3 max-w-2xl text-ink-200">{programCatalog.subtitle}</p>
      </div>

      <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        {programCatalog.tiers.map((pkg) => {
          const href = pkg.ctaHref === 'whatsapp' ? whatsappHref : pkg.ctaHref;

          return (
            <article
              key={pkg.tier}
              className={cn(
                'relative flex h-full flex-col rounded-xl border bg-ink-900 p-6 sm:p-7',
                pkg.featured
                  ? 'border-2 border-brand-400 shadow-glow lg:-translate-y-2'
                  : 'border-brand-400/20',
              )}
            >
              {pkg.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-950">
                  {pkg.badge}
                </span>
              ) : null}

              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">{pkg.tier}</p>
              <h3 className="type-h1 mt-2 text-ink-50">{pkg.name}</h3>

              <div className="mt-4 flex flex-wrap items-end gap-2">
                <p className="text-2xl font-bold text-brand-300 sm:text-[1.75rem]">{formatRupiah(pkg.price)}</p>
                <p className="mb-1 text-sm text-ink-200/70 line-through">{formatRupiah(pkg.originalPrice)}</p>
              </div>

              <ul className="type-body mt-6 flex-1 space-y-3 text-ink-200">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2.5} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {pkg.ctaVariant === 'whatsapp' ? (
                <Button asChild variant="success" className="mt-8 w-full">
                  <a href={href} target="_blank" rel="noreferrer">
                    {pkg.ctaLabel}
                  </a>
                </Button>
              ) : (
                <Button asChild variant={pkg.ctaVariant === 'outline' ? 'outline' : 'primary'} className="mt-8 w-full">
                  <Link to={href}>{pkg.ctaLabel}</Link>
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
