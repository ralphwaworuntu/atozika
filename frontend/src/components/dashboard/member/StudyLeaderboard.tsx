import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cn } from '@/utils/cn';

type Row = {
  rank: number;
  name: string;
  tryoutCount: number;
  averageScore: number;
  you: boolean;
};

export function StudyLeaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-leaderboard'],
    queryFn: () => apiGet<Row[]>('/dashboard/leaderboard'),
  });

  const rows = (data ?? []).slice(0, 5);

  return (
    <section className="member-card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm text-member-600 dark:bg-white/5">🏆</span>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-ink-50">Peringkat Tryout</h2>
        </div>
      </div>
      {isLoading ? <p className="text-xs font-semibold text-slate-400">Memuat peringkat...</p> : null}
      {isError ? <p className="text-xs font-semibold text-rose-500">Gagal memuat peringkat.</p> : null}
      {!isLoading && !isError && rows.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400">Belum ada peringkat. Selesaikan tryout untuk masuk papan skor.</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.you ? 'you' : row.rank} className={cn('flex items-center justify-between rounded-xl px-2 py-1.5', row.you && 'bg-blue-50 dark:bg-white/5')}>
            <p className="text-[13px] font-bold text-slate-700 dark:text-ink-50">
              #{row.rank} {row.you ? 'Kamu' : row.name}
            </p>
            <p className="text-[12px] font-bold text-slate-500">{Math.round(row.averageScore)} • {row.tryoutCount}x</p>
          </div>
        ))}
      </div>
    </section>
  );
}
