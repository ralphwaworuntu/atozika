import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LearningLayout } from '@/components/dashboard/member/LearningPageHeader';

export function roundedScore(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

export function averageScore(values: Array<number | null>) {
  const scores = values.filter((value): value is number => value != null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export function scoreStatus(score: number | null) {
  if (score == null) return { label: 'Belum dinilai', badge: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-ink-200', bar: 'bg-slate-300' };
  if (score >= 80) return { label: 'Sangat Baik', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-500' };
  if (score >= 70) return { label: 'Lulus', badge: 'bg-blue-50 text-member-700 dark:bg-blue-500/15 dark:text-blue-200', bar: 'bg-member-600' };
  return { label: 'Perlu Peningkatan', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200', bar: 'bg-amber-500' };
}

export function formatHistoryDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type HistoryFact = { label: string; value: string };

export type HistoryEntry = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  facts: HistoryFact[];
  icon: string;
  score: number | null;
  href: string;
  action: string;
};

export function HistoryResults({
  layout,
  entries,
  emptyTitle,
  emptyText,
  emptyHref,
  emptyAction,
}: {
  layout: LearningLayout;
  entries: HistoryEntry[];
  emptyTitle: string;
  emptyText: string;
  emptyHref: string;
  emptyAction: string;
}) {
  if (!entries.length) {
    return (
      <section className="member-card px-6 py-14 text-center">
        <p className="text-base font-extrabold text-slate-900 dark:text-ink-50">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-ink-200">{emptyText}</p>
        <Link
          to={emptyHref}
          className="mt-4 inline-flex rounded-full bg-member-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-member-700"
        >
          {emptyAction}
        </Link>
      </section>
    );
  }

  if (layout === 'list') {
    return (
      <section className="member-card divide-y divide-slate-100 px-4 dark:divide-white/10 sm:px-5">
        {entries.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </section>
    );
  }

  return (
    <div className={cn('grid gap-3', entries.length > 1 && 'md:grid-cols-2')}>
      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const status = scoreStatus(entry.score);
  return (
    <article className="member-card flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <img src={entry.icon} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-ink-50">{entry.title}</h3>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-ink-200">{entry.subtitle}</p>
          <span className={cn('mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold', status.badge)}>{status.label}</span>
        </div>
        <div className="shrink-0 pl-2 text-right">
          <p className="text-2xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-ink-50">{entry.score ?? 0}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">Skor</p>
        </div>
      </div>
      <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div className={cn('h-full rounded-full', status.bar)} style={{ width: `${Math.min(100, Math.max(0, entry.score ?? 0))}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 border-t border-slate-100 dark:border-white/10 sm:grid-cols-4">
        {entry.facts.map((fact, index) => (
          <div
            key={fact.label}
            className={cn(
              'min-w-0 px-4 py-3',
              index % 2 === 1 && 'border-l border-slate-100 dark:border-white/10',
              index >= 2 && 'border-t border-slate-100 dark:border-white/10 sm:border-t-0',
              index > 0 && 'sm:border-l sm:border-slate-100 sm:dark:border-white/10',
            )}
          >
            <p className="truncate text-[10px] font-semibold text-slate-400">{fact.label}</p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{fact.value}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-slate-100 px-4 py-3 dark:border-white/10">
        <Link
          to={entry.href}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-member-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-200"
        >
          {entry.action}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const status = scoreStatus(entry.score);
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <img src={entry.icon} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-ink-50">{entry.title}</p>
        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-ink-200">{entry.subtitle}</p>
        <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{entry.facts.map((fact) => fact.value).join(' • ')}</p>
      </div>
      <span className={cn('w-fit shrink-0 rounded-md px-2 py-1 text-[10px] font-bold', status.badge)}>{status.label}</span>
      <div className="shrink-0 text-right">
        <p className="text-xl font-extrabold leading-none tabular-nums text-slate-900 dark:text-ink-50">{entry.score ?? 0}</p>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">Skor</p>
      </div>
      <Link
        to={entry.href}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-member-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-200"
      >
        {entry.action}
      </Link>
    </div>
  );
}

export function BestScoreCard({
  label,
  name,
  score,
  note,
}: {
  label: string;
  name?: string;
  score: number | null;
  note: string;
}) {
  const status = scoreStatus(score);
  return (
    <section className="member-card flex flex-col justify-center p-4">
      <p className="text-[11px] font-medium text-slate-500 dark:text-ink-200">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <p className="text-3xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-ink-50">{score ?? 0}</p>
        <span className={cn('mb-0.5 rounded-md px-2 py-1 text-[10px] font-bold', status.badge)}>{score == null ? 'Belum ada' : status.label}</span>
      </div>
      <p className="mt-2 truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{name ?? 'Belum ada sesi'}</p>
      <p className="mt-0.5 text-[10px] font-medium text-slate-400">{note}</p>
    </section>
  );
}

export type HistoryStat = {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  hint: string;
};

export function HistoryStatGrid({ items }: { items: HistoryStat[] }) {
  return (
    <section className="member-card grid grid-cols-2 self-start sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex min-w-0 items-center gap-3 px-4 py-3.5',
            index % 2 === 1 && 'border-l border-slate-100 dark:border-white/10',
            index >= 2 && 'border-t border-slate-100 dark:border-white/10 sm:border-t-0',
            index > 0 && 'sm:border-l sm:border-slate-100 sm:dark:border-white/10',
          )}
        >
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', item.tone)}>{item.icon}</span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-ink-200">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-ink-50">{item.value}</p>
            <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{item.hint}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
