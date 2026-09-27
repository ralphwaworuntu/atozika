import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { homeAnnouncement } from '@/constants/promo';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: diff <= 0,
  };
}

export function PromoHighlight() {
  const promo = homeAnnouncement;
  const target = useMemo(() => new Date(promo.endsAt), [promo.endsAt]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const remaining = Math.max(0, promo.quotaRemaining);
  const total = Math.max(1, promo.quotaTotal);
  const remainingPercent = Math.min(100, Math.round((remaining / total) * 100));
  const units = [
    { label: 'Hari', value: pad(timeLeft.days) },
    { label: 'Jam', value: pad(timeLeft.hours) },
    { label: 'Menit', value: pad(timeLeft.minutes) },
    { label: 'Detik', value: pad(timeLeft.seconds) },
  ];

  return (
    <section aria-labelledby="promo-highlight-title">
      <div className="relative overflow-hidden rounded-xl border-2 border-brand-400/50 bg-ink-800 shadow-glow">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-300 to-brand-500" />
        <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative grid items-center gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:px-10 lg:py-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                <Megaphone className="h-3.5 w-3.5" aria-hidden />
                {promo.eyebrow}
              </span>
              <span className="rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-800">
                {promo.badge}
              </span>
            </div>

            <h2 id="promo-highlight-title" className="type-hero mt-4 text-ink-50">
              {promo.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">{promo.description}</p>

            <Button size="lg" asChild className="mt-6">
              <Link to={promo.ctaHref}>{promo.ctaLabel}</Link>
            </Button>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <p className="text-sm font-semibold text-ink-50">
                  Sisa <span className="text-brand-300">{remaining.toLocaleString('id-ID')}</span> dari {total.toLocaleString('id-ID')} kuota
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">{remainingPercent}% tersisa</p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-950 ring-1 ring-brand-400/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 shadow-[0_0_16px_rgba(176,138,50,0.55)] transition-all duration-500"
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-400/30 bg-ink-950/55 p-4 text-center shadow-[inset_0_0_40px_rgba(176,138,50,0.08)] sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
              {timeLeft.expired ? 'Periode soft launching berakhir' : 'Hitung mundur penutupan kuota'}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
              {units.map((unit) => (
                <div key={unit.label} className="rounded-2xl border border-brand-400/25 bg-ink-900/80 px-1 py-3 sm:py-4">
                  <p className="text-2xl font-bold leading-none text-brand-300 sm:text-[1.75rem]">
                    {timeLeft.expired ? '00' : unit.value}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-200 sm:text-xs">{unit.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
