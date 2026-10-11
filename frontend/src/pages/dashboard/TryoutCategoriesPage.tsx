import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, Check, ChevronRight, Clock3, ExternalLink, Flame, Megaphone, ScrollText, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import type { Tryout } from '@/types/exam';
import type { DashboardOverview } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/utils/cn';
import { consecutiveStreak } from '@/lib/memberHome';
import { LEARNING_TOPICS, topicByName } from '@/constants/learningCatalog';

const WEEK_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const CATEGORY_CARDS = [
  { key: 'TNI', label: 'TNI', subs: 2, packs: 4, tint: 'bg-emerald-50', ring: 'bg-emerald-200/70' },
  { key: 'POLRI', label: 'POLRI', subs: 1, packs: 1, tint: 'bg-rose-50', ring: 'bg-rose-200/70' },
  { key: 'Kedinasan', label: 'Sekolah Kedinasan', subs: 3, packs: 6, tint: 'bg-violet-50', ring: 'bg-violet-200/70' },
  { key: 'BUMN', label: 'BUMN', subs: 2, packs: 3, tint: 'bg-amber-50', ring: 'bg-amber-200/70' },
];

const EXAMPLE_RESULTS = [
  { id: 'tni', name: 'Tryout TNI - Paket A', meta: '5 Okt 2026 • 100 soal • 120 menit', score: 82, topic: 'TNI' },
  { id: 'polri', name: 'Tryout POLRI - Paket 1', meta: '1 Okt 2026 • 100 soal • 120 menit', score: 75, topic: 'POLRI' },
  { id: 'kedinasan', name: 'Tryout Kedinasan - Paket 2', meta: '25 Sep 2026 • 100 soal • 120 menit', score: 68, topic: 'Kedinasan' },
];

const POPULAR_MATERIALS = [
  { title: 'TWK - Wawasan Kebangsaan', meta: '45 materi • 1.2k siswa', topic: 'TWK' },
  { title: 'TIU - Kemampuan Numerik', meta: '38 materi • 980 siswa', topic: 'TIU' },
  { title: 'TKP - Kepribadian', meta: '32 materi • 870 siswa', topic: 'TKP' },
  { title: 'Tes Kecermatan', meta: '25 materi • 650 siswa', topic: 'Tes Kecermatan' },
];

const TARGET_DAYS: Array<'done' | 'empty' | 'today'> = ['done', 'done', 'done', 'done', 'empty', 'today', 'empty'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function currentWeekDone(activityDates: string[]) {
  const done = new Set(activityDates.map((value) => startOfDay(new Date(value))));
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  return WEEK_LABELS.map((_, index) => done.has(startOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index))));
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ icon, tone, label, value, extra, note }: { icon: ReactNode; tone: string; label: string; value: string; extra?: ReactNode; note: string }) {
  return (
    <section className="member-card flex items-start gap-3 p-4">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-ink-200">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-2xl font-extrabold leading-none text-slate-900 dark:text-ink-50">{value}</p>
          {extra}
        </div>
        <p className="mt-1.5 truncate text-[10px] font-medium text-slate-400">{note}</p>
      </div>
    </section>
  );
}

function SectionLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-bold text-member-600 hover:text-member-700">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

export function TryoutCategoriesPage() {
  const navigate = useNavigate();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const categoriesRef = useRef<HTMLElement>(null);
  const { data: tryouts, isLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => apiGet<Tryout[]>('/exams/tryouts'),
  });
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiGet<DashboardOverview>('/dashboard/overview'),
  });

  const realCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; subIds: Set<string>; packs: number }>();
    (tryouts ?? []).forEach((item) => {
      const category = item.subCategory.category;
      const entry = map.get(category.id) ?? { id: category.id, name: category.name, subIds: new Set<string>(), packs: 0 };
      entry.subIds.add(item.subCategory.id);
      entry.packs += 1;
      map.set(category.id, entry);
    });
    return Array.from(map.values());
  }, [tryouts]);

  const categoryCards = useMemo(() => {
    const cards = CATEGORY_CARDS.map((card) => {
      const real = realCategories.find((category) => topicByName(category.name)?.key === card.key);
      return {
        key: card.key,
        label: card.label,
        tint: card.tint,
        ring: card.ring,
        icon: LEARNING_TOPICS.find((topic) => topic.key === card.key)?.icon ?? LEARNING_TOPICS[0].icon,
        subs: real ? real.subIds.size : card.subs,
        packs: real ? real.packs : card.packs,
        categoryId: real?.id,
      };
    });
    if (!showAllCategories) return cards;
    const extras = realCategories
      .filter((category) => !cards.some((card) => card.categoryId === category.id))
      .map((category) => ({
        key: category.id,
        label: category.name,
        tint: 'bg-sky-50',
        ring: 'bg-sky-200/70',
        icon: topicByName(category.name)?.icon ?? LEARNING_TOPICS[4].icon,
        subs: category.subIds.size,
        packs: category.packs,
        categoryId: category.id as string | undefined,
      }));
    return [...cards, ...extras];
  }, [realCategories, showAllCategories]);

  const results = overview?.tryoutResults ?? [];
  const activityDates = results.map((item) => item.startedAt);
  const weekDone = currentWeekDone(activityDates);
  const streak = consecutiveStreak(activityDates);
  const averageScore = results.length ? results.reduce((sum, item) => sum + item.score, 0) / results.length : null;
  const latest = results[0];
  const announcement = overview?.announcements?.[0];

  const recentRows = results.length
    ? results.slice(0, 3).map((item) => ({
        id: item.id,
        name: item.tryout.name,
        meta: `${formatShortDate(item.startedAt)} • ${item.tryout.subCategory.category.name}`,
        score: Math.round(item.score),
        icon: (topicByName(item.tryout.subCategory.category.name) ?? topicByName(item.tryout.name) ?? LEARNING_TOPICS[1]).icon,
        href: `/app/latihan/tryout/review/${item.id}`,
      }))
    : EXAMPLE_RESULTS.map((item) => ({
        id: item.id,
        name: item.name,
        meta: item.meta,
        score: item.score,
        icon: topicByName(item.topic)?.icon ?? LEARNING_TOPICS[0].icon,
        href: undefined as string | undefined,
      }));

  const scrollToCategories = () => categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const continueLearning = () => {
    if (latest) navigate(`/app/latihan/tryout/review/${latest.id}`);
    else scrollToCategories();
  };

  if (membership.isLoading || isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[20px] shadow-sm">
        <img src="/banners/banner-tryout.png" alt="Menempa Intelektual, Mengunci Kelulusan. Persiapan elit, hasil nyata." className="block h-auto w-full" />
        <button
          type="button"
          aria-label="Mulai Tryout Sekarang"
          onClick={scrollToCategories}
          className="absolute rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          style={{ left: '3.4%', top: '74%', width: '19.7%', height: '12.9%' }}
        />
        <button
          type="button"
          aria-label="Lanjutkan Belajar"
          onClick={continueLearning}
          className="absolute rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          style={{ left: '24.1%', top: '74%', width: '16.4%', height: '12.9%' }}
        />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.9fr)]">
        <StatCard
          icon={<ScrollText className="h-5 w-5" />}
          tone="bg-rose-50 text-rose-500"
          label="Total Tryout"
          value={`${results.length || 12}x`}
          note="Sudah kamu kerjakan"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-500"
          label="Rata-rata Skor"
          value={(averageScore ?? 78.5).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
          extra={
            averageScore === null ? (
              <span className="whitespace-nowrap rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">↑ 12%</span>
            ) : undefined
          }
          note="Meningkat dari bulan lalu"
        />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} tone="bg-blue-50 text-blue-600" label="Peringkat Kelas" value="#124" note="dari 2.431 peserta" />
        <StatCard icon={<Clock3 className="h-5 w-5" />} tone="bg-violet-50 text-violet-600" label="Total Waktu Belajar" value="36 jam" note="Selama 30 hari terakhir" />
        <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[1.5rem] border border-amber-100 bg-gradient-to-r from-[#FFF4E4] to-[#FFF8EE] p-4 sm:col-span-2 xl:col-span-1 dark:border-amber-500/20 dark:from-amber-950/40 dark:to-ink-800">
          <div className="flex shrink-0 items-center gap-2.5">
            <Flame className="h-9 w-9 shrink-0 fill-orange-500 text-orange-500" />
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-ink-200">Streak Belajar</p>
              <p className="whitespace-nowrap text-2xl font-extrabold leading-none text-slate-900 dark:text-ink-50">{streak} Hari</p>
              <p className="mt-1.5 whitespace-nowrap text-[10px] font-medium text-slate-500">Pertahankan konsistensimu!</p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 gap-1">
            {WEEK_LABELS.map((label, index) => (
              <div key={label} className="flex w-5 flex-col items-center gap-1">
                <span className="text-[9px] font-semibold text-slate-500">{label}</span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full',
                    weekDone[index] ? 'bg-member-600 text-white' : 'border border-slate-200 bg-white dark:border-white/20 dark:bg-transparent',
                  )}
                >
                  {weekDone[index] ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-4">
          <section ref={categoriesRef} className="member-card p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Pilih Kategori Tryout</h2>
                <p className="text-[11px] font-medium text-slate-500">Mulai latihan sesuai target tujuanmu</p>
              </div>
              <SectionLink onClick={() => setShowAllCategories((value) => !value)}>{showAllCategories ? 'Lebih Sedikit' : 'Lihat Semua'}</SectionLink>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map((card) => (
                <article key={card.key} className={cn('relative flex min-h-[5.5rem] items-center gap-2.5 rounded-2xl border border-slate-100 p-3 pb-9 dark:border-white/10 dark:bg-white/5', card.tint)}>
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full', card.ring)}>
                    <img src={card.icon} alt="" className="h-9 w-9 object-contain mix-blend-multiply" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-ink-50">{card.label}</h3>
                    <p className="mt-0.5 text-[10px] font-medium leading-snug text-slate-500">
                      {card.subs} sub kategori • {card.packs} paket
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Buka ${card.label}`}
                    onClick={() => {
                      if (card.categoryId) navigate(`/app/latihan/tryout/kategori/${card.categoryId}`);
                      else toast.message(`Tryout ${card.label} segera tersedia.`);
                    }}
                    className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-ink-800 dark:text-ink-50"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="member-card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Tryout Terbaru</h2>
                <SectionLink onClick={() => navigate('/app/latihan/tryout/riwayat')}>Lihat Riwayat</SectionLink>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {recentRows.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-2.5">
                    <img src={row.icon} alt="" className="h-8 w-8 shrink-0 rounded-full object-contain mix-blend-multiply" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{row.name}</p>
                      <p className="truncate text-[10px] font-medium text-slate-400">{row.meta}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1 text-[10px] font-bold',
                        row.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
                      )}
                    >
                      Skor {row.score}
                    </span>
                    <button
                      type="button"
                      onClick={() => (row.href ? navigate(row.href) : navigate('/app/latihan/tryout/riwayat'))}
                      className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-member-600 hover:bg-blue-100"
                    >
                      Lihat Hasil
                    </button>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="member-card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Materi Populer</h2>
                <SectionLink onClick={() => navigate('/app/materi')}>Lihat Semua</SectionLink>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {POPULAR_MATERIALS.map((item) => (
                  <li key={item.title}>
                    <button type="button" onClick={() => navigate('/app/materi')} className="flex w-full items-center gap-3 py-2 text-left">
                      <img src={topicByName(item.topic)?.icon ?? LEARNING_TOPICS[4].icon} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain mix-blend-multiply" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{item.title}</p>
                        <p className="truncate text-[10px] font-medium text-slate-400">{item.meta}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="member-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Lanjutkan Belajar</h2>
              <button
                type="button"
                aria-label="Riwayat tryout"
                onClick={() => navigate('/app/latihan/tryout/riwayat')}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-member-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-100 p-3 dark:border-white/10">
              <div className="flex items-center gap-3">
                <img src="/covers/cover-study.jpg" alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{latest?.tryout.name ?? 'Tryout POLRI - Paket 1'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full w-[60%] rounded-full bg-member-600" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">60%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={continueLearning}
                  className="flex-1 rounded-lg bg-member-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-member-700"
                >
                  Lanjutkan Tryout
                </button>
                <button
                  type="button"
                  aria-label="Buka riwayat tryout"
                  onClick={() => navigate('/app/latihan/tryout/riwayat')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          <section className="member-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Target Belajar Minggu Ini</h2>
              <button type="button" onClick={() => toast.message('Pengaturan target segera tersedia.')} className="inline-flex items-center gap-1 text-[10px] font-bold text-member-600">
                Atur Target <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#1d72fe 0% 75%, #e2e8f0 75% 100%)' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-extrabold text-slate-900 dark:bg-ink-800 dark:text-ink-50">75%</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-800 dark:text-ink-50">6 dari 8 sesi</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full w-[75%] rounded-full bg-member-600" />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEK_LABELS.map((label, index) => {
                const state = TARGET_DAYS[index];
                return (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full',
                        state === 'done' ? 'bg-member-600 text-white' : 'border border-slate-200 bg-white dark:border-white/20 dark:bg-transparent',
                      )}
                    >
                      {state === 'done' ? <Check className="h-3 w-3" strokeWidth={3} /> : state === 'today' ? <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> : null}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            onClick={() => navigate('/app/pengumuman')}
            className="flex w-full items-start gap-3 rounded-[1.5rem] border border-amber-100 bg-gradient-to-r from-[#FFF4E4] to-[#FFF8EE] p-4 text-left dark:border-amber-500/20 dark:from-amber-950/40 dark:to-ink-800"
          >
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-slate-900 dark:text-ink-50">Pengumuman</p>
                <p className="text-[10px] font-medium text-slate-500">
                  {announcement ? formatShortDate(announcement.publishedAt) : '3 Okt 2026'}
                </p>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-600 dark:text-ink-200">
                {announcement ? announcement.title : 'Tryout Kedinasan Paket Baru sudah tersedia! Latihan sekarang dan tingkatkan peluang lolosmu.'}
              </p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </aside>
      </div>
    </div>
  );
}
