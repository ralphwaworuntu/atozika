import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function StudyCalendar({ activityDates }: { activityDates: string[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Month');
  const active = useMemo(() => new Set(activityDates.map((value) => dayKey(new Date(value)))), [activityDates]);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const label = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const slots: Array<number | null> = Array.from({ length: first }, () => null);
    for (let day = 1; day <= count; day += 1) slots.push(day);
    while (slots.length % 7 !== 0) slots.push(null);
    return slots;
  }, [year, month]);

  return (
    <section className="member-card relative overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <nav className="inline-flex rounded-full border border-slate-200/70 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5" aria-label="Tampilan kalender">
          {(['Day', 'Week', 'Month'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                view === item ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50' : 'text-slate-500',
              )}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">{label}</h2>
        <div className="flex gap-1.5">
          <button type="button" aria-label="Bulan sebelumnya" onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-ink-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Bulan berikutnya" onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-ink-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {view === 'Month' ? (
        <>
          <div className="grid grid-cols-7 pb-2 text-center text-xs font-bold text-slate-700 dark:text-ink-100">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t border-slate-100 dark:border-white/10">
            {cells.map((day, index) => {
              const date = day ? new Date(year, month, day) : null;
              const isToday = Boolean(date && dayKey(date) === dayKey(today));
              const done = Boolean(date && active.has(dayKey(date)));
              return (
                <div key={`${day ?? 'empty'}-${index}`} className="flex min-h-[3.2rem] flex-col items-center border-b border-slate-100 p-1 dark:border-white/10">
                  {day ? (
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                        isToday && 'bg-sky-400 text-white shadow-md',
                        !isToday && done && 'bg-blue-50 text-member-600 dark:bg-blue-500/20',
                        !isToday && !done && 'text-slate-700 dark:text-ink-100',
                      )}
                    >
                      {day}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm font-medium text-slate-500">
          {view === 'Week' ? 'Tampilan minggu mengikuti hari belajar yang sudah tercatat.' : 'Tampilan hari menandai sesi belajar hari ini.'}
        </p>
      )}
    </section>
  );
}
