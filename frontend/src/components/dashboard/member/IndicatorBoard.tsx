import { useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const TOTAL = 12;

export function IndicatorBoard({ doneThisWeek }: { doneThisWeek: number }) {
  const [page, setPage] = useState(5);
  const shift = (direction: -1 | 1) => {
    setPage((current) => {
      const next = current + direction;
      if (next < 1) return TOTAL;
      if (next > TOTAL) return 1;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 bg-white p-4 text-slate-900 md:p-6 dark:bg-[#0a1126] dark:text-white">
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <article className="relative flex items-center gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#203163] dark:bg-[#131f45] dark:text-white dark:shadow-2xl">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ff8533] to-[#bf2b09] shadow-lg">
            <FlameIcon />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-300">Target Mingguan</span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{doneThisWeek}</span>
              <span className="text-lg font-bold text-slate-400">/ 7 hari</span>
            </div>
            <div className="my-2.5 flex items-center gap-1.5">
              {Array.from({ length: 7 }, (_, index) => (
                <span
                  key={index}
                  className={cn('h-2.5 w-5 rounded-full', index < doneThisWeek ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-slate-200 dark:bg-[#1b2b57]')}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">Jaga streak-mu!</p>
          </div>
        </article>

        <article className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#203163] dark:bg-[#131f45] dark:shadow-2xl">
          <img src="/level/lv-4.svg" alt="Level" className="h-24 w-full object-contain" />
        </article>

        <article className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#203163] dark:bg-[#131f45] dark:text-white dark:shadow-2xl">
          <XpStar />
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-300">Total XP</span>
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">2.480</span>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 p-0.5 dark:bg-[#1c2954]">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-amber-400 to-yellow-300" />
            </div>
            <p className="mt-2 text-right text-xs font-bold text-amber-400">+120 XP hari ini</p>
          </div>
        </article>
      </section>

      <section className="relative rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-[#1e2c59] dark:bg-[#121c3d] dark:text-white dark:shadow-2xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Badge Prestasi</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-300">Kumpulkan badge dan tunjukkan pencapaianmu!</p>
          </div>
          <nav className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:border-[#273873] dark:bg-[#192652] dark:text-slate-200">
            <button type="button" aria-label="Sebelumnya" onClick={() => shift(-1)} className="text-slate-300">‹</button>
            <span>{page} / {TOTAL}</span>
            <button type="button" aria-label="Berikutnya" onClick={() => shift(1)} className="text-slate-300">›</button>
          </nav>
        </header>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Badge sebelumnya" onClick={() => shift(-1)} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 md:flex dark:border-[#2c3d79] dark:bg-[#182654] dark:text-slate-200">‹</button>
          <div className="grid min-w-0 flex-1 items-stretch gap-6 md:grid-cols-3">
            <BadgeCard title="Progressor" detail="Selesaikan 10 tugas pertama." rarity="Rare" icon={<GreenBadge />} />
            <article className="relative z-10 flex scale-105 flex-col items-center rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center text-slate-900 shadow-sm dark:border-amber-300/70 dark:bg-[radial-gradient(ellipse_at_50%_30%,rgba(245,158,11,0.28),rgba(20,27,56,0.95)_75%)] dark:text-white dark:shadow-[0_0_35px_rgba(245,158,11,0.35)]">
              <FireBadge />
              <h3 className="mt-2 text-xl font-extrabold">Streak Master</h3>
              <p className="mt-1 max-w-[210px] text-xs leading-relaxed text-slate-600 dark:text-amber-100/90">Pertahankan streak selama 7 hari berturut-turut.</p>
              <span className="mt-4 inline-flex rounded-full border border-purple-300 bg-purple-600 px-4 py-1.5 text-xs font-bold">★ Epic</span>
            </article>
            <BadgeCard title="XP Hunter" detail="Kumpulkan 1.000 XP dalam satu minggu." rarity="Rare" icon={<BlueBadge />} />
          </div>
          <button type="button" aria-label="Badge berikutnya" onClick={() => shift(1)} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 md:flex dark:border-[#2c3d79] dark:bg-[#182654] dark:text-slate-200">›</button>
        </div>
        <footer className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={cn('rounded-full', index === 0 ? 'h-2.5 w-2.5 bg-amber-400' : 'h-2 w-2 bg-slate-300 dark:bg-[#27386d]')} />
          ))}
        </footer>
      </section>
    </div>
  );
}

function BadgeCard({ title, detail, rarity, icon }: { title: string; detail: string; rarity: string; icon: ReactNode }) {
  return (
    <article className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-900 shadow-sm dark:border-[#1b2a59] dark:bg-[#101838] dark:text-white dark:shadow-xl">
      {icon}
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-[210px] text-xs leading-relaxed text-slate-500 dark:text-slate-300">{detail}</p>
      <span className="mt-4 inline-flex rounded-full border border-sky-500/50 bg-sky-600/20 px-3.5 py-1 text-xs font-bold text-cyan-400">★ {rarity}</span>
    </article>
  );
}

function FlameIcon() {
  return (
    <svg className="h-11 w-11" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2C8.5 6 7 9.5 7 13 7 16.5 9.2 19 12 19s5-2.5 5-6c0-3-1.5-5.5-3-7.5-.5 2.5-1.8 4-3.5 5C10.5 8.5 11 5 12 2Z" fill="#FF9900" />
      <path d="M12 11C10.8 12.5 10 14 10 15.5 10 17 10.9 18 12 18s2-1 2-2.5C14 14.5 13.5 13 12 11Z" fill="#FFF275" />
    </svg>
  );
}

function XpStar() {
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg className="h-20 w-20" viewBox="0 0 100 100" aria-hidden>
        <path d="M50 8 L62 33 L89 36 L69 55 L75 82 L50 68 L25 82 L31 55 L11 36 L38 33 Z" fill="#ffc107" stroke="#ffd700" strokeWidth="3" />
      </svg>
      <span className="absolute text-lg font-black text-amber-900">XP</span>
    </div>
  );
}

function GreenBadge() {
  return (
    <svg className="my-2 h-40 w-40" viewBox="0 0 160 160" aria-hidden>
      <polygon points="80,18 128,45 128,105 80,132 32,105 32,45" fill="#10b981" stroke="#6ee7b7" strokeWidth="2.5" />
      <polygon points="80,27 120,50 120,100 80,123 40,100 40,50" fill="#064e3b" />
      <path d="M80 102 V72" stroke="#4ade80" strokeWidth="6" strokeLinecap="round" />
      <path d="M80 82 C65 82 58 68 62 58 C74 58 80 72 80 82 Z" fill="#4ade80" />
      <path d="M80 76 C95 76 102 62 98 52 C86 52 80 66 80 76 Z" fill="#86efac" />
    </svg>
  );
}

function FireBadge() {
  return (
    <svg className="h-48 w-48" viewBox="0 0 180 180" aria-hidden>
      <polygon points="90,26 146,57 146,123 90,154 34,123 34,57" fill="#f59e0b" />
      <polygon points="90,37 136,63 136,117 90,143 44,117 44,63" fill="#c2410c" />
      <path d="M72 38 L76 22 L84 31 L90 16 L96 31 L104 22 L108 38 Z" fill="#fde68a" />
      <path d="M90 70c-8 8-12 16-12 24 0 8 5 14 12 14s12-6 12-14c0-6-3-12-6-16-1 5-4 8-6 8 0-6 1-14 0-16Z" fill="#fff" />
    </svg>
  );
}

function BlueBadge() {
  return (
    <svg className="my-2 h-40 w-40" viewBox="0 0 160 160" aria-hidden>
      <polygon points="80,18 128,45 128,105 80,132 32,105 32,45" fill="#2563eb" stroke="#93c5fd" strokeWidth="2.5" />
      <polygon points="80,27 120,50 120,100 80,123 40,100 40,50" fill="#172554" />
      <path d="M80 44 L88 62 L108 65 L93 79 L97 99 L80 89 L63 99 L67 79 L52 65 L72 62 Z" fill="#3b82f6" stroke="#93c5fd" />
      <text x="80" y="79" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900">XP</text>
    </svg>
  );
}
