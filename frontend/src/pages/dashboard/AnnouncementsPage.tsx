import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Dumbbell, FileText, GraduationCap, Megaphone, Shield } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useMemberChrome } from '@/hooks/useMemberChrome';
import type { Announcement } from '@/types/dashboard';
import { formatDate } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

type Category = 'Akademik' | 'Jasmani' | 'Administrasi' | 'Urgent';

const TONE: Record<Category, string> = {
  Akademik: 'bg-violet-100 text-violet-600',
  Jasmani: 'bg-emerald-100 text-emerald-600',
  Administrasi: 'bg-amber-100 text-amber-600',
  Urgent: 'bg-rose-100 text-rose-600',
};

const SCHEDULE_ICON = {
  'Tryout Akbar': GraduationCap,
  'Jam Kelas': Clock3,
  'Sesi Jasmani': Dumbbell,
} as const;

export function AnnouncementsPage() {
  const chrome = useMemberChrome();
  const announcements = useQuery({
    queryKey: ['member-announcements'],
    queryFn: () => apiGet<Announcement[]>('/dashboard/announcements'),
  });
  const [filter, setFilter] = useState<string>('Semua');
  const schedules = useMemo(
    () => (chrome.data?.boards.schedules ?? []).filter((item) => filter === 'Semua' || item.category === filter),
    [chrome.data?.boards.schedules, filter],
  );
  const openings = useMemo(
    () => (chrome.data?.boards.openings ?? []).filter((item) => filter === 'Semua' || item.category === filter),
    [chrome.data?.boards.openings, filter],
  );
  if (chrome.isLoading || announcements.isLoading) {
    return <Skeleton className="h-96" />;
  }
  const feed = announcements.data ?? [];
  const banner = feed[0];
  const filters = ['Semua', ...new Set([...(chrome.data?.boards.schedules ?? []).map((item) => item.category), ...(chrome.data?.boards.openings ?? []).map((item) => item.category)])];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-[#D7EEFF] via-[#E4F3FF] to-[#D5EDFF] p-5 shadow-sm sm:p-7 dark:border-blue-500/20 dark:from-blue-950/60 dark:via-ink-800 dark:to-blue-950/40">
        <div className="max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm dark:bg-white/10 dark:text-ink-50">
            <Megaphone className="h-3.5 w-3.5 text-member-600" strokeWidth={2.4} />
            Notifikasi resmi manajemen
          </span>
          <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl dark:text-ink-50">
            {banner?.title ?? 'Pengumuman resmi'}
            <br />
            <span className="text-member-600">ATOZIKA</span>
          </h2>
          <p className="text-xs font-medium text-slate-600 sm:text-sm dark:text-ink-200">{banner?.body ?? 'Pengumuman dari admin akan tampil di sini.'}</p>
          {banner ? <p className="text-[11px] font-semibold text-slate-500 dark:text-ink-200">{formatDate(banner.publishedAt)}</p> : null}
        </div>
      </section>

      <nav
        className="inline-flex max-w-full flex-wrap rounded-full border border-slate-200/70 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5"
        aria-label="Filter kategori pengumuman"
      >
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              filter === item
                ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50'
                : 'text-slate-500',
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className="space-y-3">
        <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Feed Resmi</h3>
        <div className="space-y-3">
          {feed.slice(1).map((item) => (
            <article key={item.id} className="member-card flex items-center gap-4 p-4 transition hover:shadow-md sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Megaphone className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400">{formatDate(item.publishedAt)}</p>
                <h4 className="truncate text-sm font-bold text-slate-800 sm:text-base dark:text-ink-50">{item.title}</h4>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.body}</p>
              </div>
            </article>
          ))}
          {feed.length === 0 ? <p className="text-[11px] font-semibold text-slate-400">Belum ada pengumuman.</p> : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">
          Jadwal Tryout Akbar, Jam Kelas, dan Sesi Jasmani
        </h3>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {schedules.map((item) => {
            const Icon = SCHEDULE_ICON[item.kind as keyof typeof SCHEDULE_ICON] ?? Clock3;
            return (
              <article key={item.id} className="member-card flex flex-col justify-between p-3.5 transition hover:shadow-md">
                <span className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', TONE[item.category as Category] ?? TONE.Akademik)}>
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p className="text-[11px] font-semibold text-slate-400">{item.kind}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-ink-50">{item.title}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.time}</p>
              </article>
            );
          })}
        </div>
        {schedules.length === 0 ? <p className="text-[11px] font-semibold text-slate-400">Tidak ada jadwal pada kategori ini.</p> : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Pembukaan Pendaftaran Resmi</h3>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {openings.map((item) => (
            <article key={item.id} className="member-card flex flex-col justify-between p-3.5 transition hover:shadow-md">
              <span className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', TONE[item.category as Category] ?? TONE.Administrasi)}>
                {item.category === 'Administrasi' ? (
                  <FileText className="h-5 w-5" strokeWidth={2.2} />
                ) : (
                  <Shield className="h-5 w-5" strokeWidth={2.2} />
                )}
              </span>
              <p className="text-[11px] font-semibold uppercase text-slate-400">{item.agency}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-ink-50">{item.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.window}</p>
            </article>
          ))}
        </div>
        {openings.length === 0 ? (
          <p className="text-[11px] font-semibold text-slate-400">Tidak ada info pendaftaran pada kategori ini.</p>
        ) : null}
      </section>
    </div>
  );
}
