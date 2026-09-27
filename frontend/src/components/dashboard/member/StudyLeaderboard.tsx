import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

const PERIODS = ['This Week', 'All Time', 'Friends'] as const;

type Row = {
  rank: number;
  name: string;
  meta: string;
  xp: string;
  you: boolean;
  crown: boolean;
};

const ROWS: Row[] = [
  { rank: 1, name: 'Sophie', meta: '14 day streak', xp: '3,420', you: false, crown: true },
  { rank: 2, name: 'Daniel', meta: 'Level 18 • French', xp: '2,980', you: false, crown: false },
  { rank: 3, name: 'Maya', meta: 'Level 15 • Spanish', xp: '2,760', you: false, crown: false },
  { rank: 4, name: 'Liam', meta: 'Level 14 • English', xp: '2,540', you: false, crown: false },
  { rank: 5, name: 'Alya', meta: 'Level 13 • English', xp: '2,310', you: false, crown: false },
  { rank: 13, name: 'You', meta: '9 day streak', xp: '1,240', you: true, crown: false },
];

function visibleRows(rows: Row[]) {
  const member = rows.find((row) => row.you);
  const top = rows.filter((row) => row.rank <= 3);
  if (!member || member.rank <= 3) return top;
  return [...top, member];
}

export function StudyLeaderboard() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('This Week');
  const [open, setOpen] = useState(false);

  const rows = visibleRows(ROWS);

  return (
    <section className="member-card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm text-member-600 dark:bg-white/5">🏆</span>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-ink-50">Leaderboard</h2>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-bold text-slate-600 dark:bg-white/10 dark:text-ink-100"
          >
            {period}
            <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
          </button>
          {open ? (
            <div className="absolute right-0 z-20 mt-1.5 w-36 rounded-2xl bg-white p-1.5 shadow-xl dark:bg-ink-800">
              {PERIODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setPeriod(item);
                    setOpen(false);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 dark:text-ink-50 dark:hover:bg-white/5"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 dark:bg-white/5">
        <p className="text-[13px] font-bold text-slate-600 dark:text-ink-200">⚡ Ruby League • Top 3 advance</p>
        <p className="text-[11px] font-bold text-slate-400">⏱ 2d 14h</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.you ? 'you' : row.rank} className="flex flex-col gap-1.5">
            {row.you && row.rank > 3 ? <div className="mt-1 h-px bg-slate-200 dark:bg-white/10" /> : null}
            <RankRow row={row} className={row.you && row.rank > 3 ? 'mt-2' : undefined} />
          </div>
        ))}
      </div>
      <p className="mt-auto flex items-start gap-1.5 pt-3 text-[11px] font-medium leading-snug text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Leaderboard reset setiap Minggu di Jam 23:59 WITA
      </p>
    </section>
  );
}

function RankRow({ row, className }: { row: Row; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-2xl px-2.5 py-2',
        row.you ? 'bg-blue-50 ring-1 ring-member-600/30 dark:bg-blue-500/10' : 'bg-white dark:bg-transparent',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold',
            row.rank === 1 && 'bg-amber-100 text-amber-800',
            row.you && 'bg-blue-100 text-member-700',
            row.rank !== 1 && !row.you && 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-ink-200',
          )}
        >
          {row.rank}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600 dark:bg-white/10 dark:text-ink-50">
          {row.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-bold', row.you ? 'text-member-600' : 'text-slate-800 dark:text-ink-50')}>
            {row.name}
            {row.crown ? ' 👑' : ''}
          </p>
          <p className="truncate text-xs font-medium text-slate-400">{row.meta}</p>
        </div>
      </div>
      <div className="pl-2 text-right">
        <p className={cn('text-sm font-extrabold', row.you ? 'text-member-600' : 'text-slate-800 dark:text-ink-50')}>{row.xp}</p>
        <p className="text-[11px] font-bold text-slate-400">XP</p>
      </div>
    </div>
  );
}
