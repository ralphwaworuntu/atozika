import type { ReactNode } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export type LearningLayout = 'grid' | 'list';

export function LearningPageHeader({
  title,
  description,
  searchPlaceholder,
  query,
  onQueryChange,
  layout,
  onLayoutChange,
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  layout: LearningLayout;
  onLayoutChange: (value: LearningLayout) => void;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{title}</h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-ink-200">{description}</p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-member-600 dark:border-white/10 dark:bg-ink-800 dark:text-ink-50"
          />
        </div>
        <button
          type="button"
          title="Tampilan kisi"
          onClick={() => onLayoutChange('grid')}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            layout === 'grid' ? 'bg-[#1B3A4B] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10',
          )}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Tampilan daftar"
          onClick={() => onLayoutChange('list')}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            layout === 'list' ? 'bg-[#1B3A4B] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10',
          )}
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function StatItem({ icon, tone, value, label }: { icon: ReactNode; tone: string; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-tight text-slate-900 dark:text-ink-50">{value}</p>
        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-ink-200">{label}</p>
      </div>
    </div>
  );
}

export function FilterPills({
  items,
  value,
  onChange,
}: {
  items: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            'rounded-lg border px-4 py-1.5 text-xs font-semibold transition',
            value === item
              ? 'border-member-600 bg-member-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-100',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
