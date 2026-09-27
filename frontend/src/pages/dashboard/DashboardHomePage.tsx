import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, BookOpen, ClipboardList, CreditCard, Eye, FolderOpen, Play, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { DashboardOverview } from '@/types/dashboard';
import { formatDate } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/utils/cn';
import { CharacterBodyStatsCard } from '@/components/dashboard/member/CharacterBodyStats';
import { StudyCalendar } from '@/components/dashboard/member/StudyCalendar';
import { StudyLeaderboard } from '@/components/dashboard/member/StudyLeaderboard';
import { DssScoreCard } from '@/components/dashboard/member/DssScoreCard';
import {
  consecutiveStreak,
  firstNameOf,
  greetingForHour,
  lastSevenDays,
} from '@/lib/memberHome';

const skillTiles = [
  {
    label: 'Tryout',
    hint: 'Simulasi CAT',
    to: '/app/latihan/tryout',
    icon: ClipboardList,
    tone: 'bg-violet-100 text-violet-600',
  },
  {
    label: 'Latihan Soal',
    hint: 'Bank soal',
    to: '/app/latihan-soal',
    icon: BookOpen,
    tone: 'bg-rose-100 text-rose-600',
  },
  {
    label: 'Kecermatan',
    hint: 'Timer live',
    to: '/app/tes-kecermatan',
    icon: Eye,
    tone: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Materi',
    hint: 'Modul & video',
    to: '/app/materi',
    icon: FolderOpen,
    tone: 'bg-amber-100 text-amber-600',
  },
] as const;

export function DashboardHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiGet<DashboardOverview>('/dashboard/overview'),
  });
  const membership = useMembershipStatus();
  const { user } = useAuth();
  const [pillarOpen, setPillarOpen] = useState(false);

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const firstName = firstNameOf(user?.name);
  const greeting = greetingForHour();
  const isActive = Boolean(membership.data?.isActive ?? user?.membership?.isActive);
  const packageName = membership.data?.packageName ?? user?.membership?.packageName ?? 'Member';
  const latest = data.tryoutResults[0];
  const activityDates = data.tryoutResults.map((item) => item.startedAt);
  const week = lastSevenDays(activityDates);
  const streak = consecutiveStreak(activityDates);
  const doneThisWeek = week.filter((day) => day.done).length;
  const avgScore =
    data.tryoutResults.length > 0
      ? data.tryoutResults.reduce((sum, item) => sum + item.score, 0) / data.tryoutResults.length
      : 0;
  const pillars = pillarScores(data.tryoutResults);
  const ctaHref = !isActive ? '/app/paket-membership' : latest ? `/app/latihan/tryout/review/${latest.id}` : '/app/latihan/tryout';
  const ctaLabel = !isActive ? 'Aktifkan Membership' : latest ? 'Lanjut Belajar' : 'Mulai Tryout';

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-6">
      <div className="space-y-6">
        <section className="relative min-h-[17.5rem] overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-[#D7EEFF] via-[#E4F3FF] to-[#D5EDFF] p-5 shadow-sm sm:min-h-[19.5rem] sm:p-7 dark:border-blue-500/20 dark:from-blue-950/60 dark:via-ink-800 dark:to-blue-950/40">
          <HeroBooks />
          <div className="relative z-10 max-w-[min(24rem,calc(100%-8.5rem))] space-y-3 sm:max-w-sm">
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm dark:bg-white/10 dark:text-ink-50">
              {isActive ? packageName : 'Membership belum aktif'}
            </span>
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl dark:text-ink-50">
              {greeting},
              <br />
              <span className="text-member-600">{firstName}!</span> 👋
            </h2>
            <p className="text-xs font-medium text-slate-600 sm:text-sm dark:text-ink-200">
              Satu sesi lagi lebih dekat
              <br />
              ke kelulusan kamu.
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-56">
              <Link
                to={ctaHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-member-600 px-5 py-2.5 text-sm font-bold text-white shadow-memberFloat transition hover:bg-member-700 active:scale-95"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              {!isActive ? (
                <Link
                  to="/app/konfirmasi-pembayaran"
                  className="inline-flex w-full items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 dark:border-amber-400/40 dark:bg-ink-900 dark:text-amber-100"
                >
                  Konfirmasi Pembayaran
                </Link>
              ) : null}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-[42%] items-end justify-end sm:w-[min(22rem,48%)]">
            <picture className="flex h-full max-h-full w-full items-end justify-end">
              <source srcSet="/mascot.webp" type="image/webp" />
              <img
                src="/mascot.png"
                alt="Maskot ATOZIKA"
                className="h-full w-auto max-w-full select-none object-contain object-bottom drop-shadow-md"
              />
            </picture>
          </div>
        </section>

        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <StudyCalendar activityDates={activityDates} />
          <StudyLeaderboard />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Lanjut Belajar</h3>
            <Link to="/app/latihan/tryout" className="text-xs font-bold text-member-600 hover:text-member-700">
              See All
            </Link>
          </div>
          <div className="member-card flex flex-col items-center justify-between gap-4 p-4 transition hover:shadow-md sm:flex-row sm:p-5">
            <div className="flex w-full items-center gap-4 sm:w-auto">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-sky-50">
                <ContinueThumb />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-800 sm:text-base dark:text-ink-50">
                  {latest?.tryout.name ?? 'Belum ada tryout'}
                </h4>
                <p className="mb-3 text-xs font-semibold text-slate-400">
                  {latest
                    ? `${latest.tryout.subCategory.category.name} • ${formatDate(latest.startedAt)}`
                    : 'Mulai sesi pertama kamu hari ini'}
                </p>
                <div className="flex w-full items-center gap-3 sm:w-60">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-member-600"
                      style={{ width: `${latest ? Math.min(100, Math.round(latest.score)) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {latest ? `${Math.round(latest.score)}` : '0'}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to={ctaHref}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-member-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-member-700 active:scale-95 sm:w-auto"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Build Your Skills</h3>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {skillTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="member-card group flex flex-col justify-between p-3.5 transition hover:shadow-md"
                >
                  <span className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105', tile.tone)}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-ink-50">{tile.label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{tile.hint}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="mt-6 flex flex-col gap-6 xl:mt-0">
        <DssScoreCard pillars={pillars} />
        <button
          type="button"
          onClick={() => setPillarOpen(true)}
          className="member-card flex w-full flex-col p-5 text-left transition hover:shadow-md"
        >
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-ink-50">4 Pilar</h4>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Rata-rata skor tryout tiap pilar. Klik untuk detail.</p>
          <PillarRadar scores={pillars} />
        </button>
        <PillarDetailModal open={pillarOpen} onOpenChange={setPillarOpen} pillars={pillars} />

        <CharacterBodyStatsCard
          stats={{
            name: user?.name ?? 'Member',
            packageName: isActive ? packageName : 'Belum aktif',
            avgScore,
            tryouts: data.summary.tryouts,
            materials: data.summary.materials,
            streak,
            weekDays: doneThisWeek,
          }}
        />

        <div className="member-card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-ink-50">Ringkasan</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Tryout</p>
              <p className="mt-1 text-xl font-extrabold text-member-600">{data.summary.tryouts}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Materi</p>
              <p className="mt-1 text-xl font-extrabold text-member-600">{data.summary.materials}</p>
            </div>
            <Link to="/app/konfirmasi-pembayaran" className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <CreditCard className="h-3 w-3" /> Pending
              </p>
              <p className="mt-1 text-xl font-extrabold text-member-600">{data.summary.pendingPayments}</p>
            </Link>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Kode Ortu</p>
              <p className="mt-1 truncate text-sm font-extrabold text-slate-800 dark:text-ink-50">
                {user?.memberArea?.slug ?? '-'}
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/app/paket-membership"
          className="relative block overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-r from-[#D7EEFF] to-[#E3F2FD] p-4 shadow-member dark:border-blue-500/20 dark:from-blue-950/50 dark:to-ink-800"
        >
          <p className="text-sm font-extrabold text-slate-800 dark:text-ink-50">
            {isActive ? packageName : 'Upgrade ke ATOZIKA PRO'}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-ink-200">
            {isActive ? 'Kelola paket dan perpanjang akses.' : 'Buka tryout unlimited, materi, dan rapor orang tua.'}
          </p>
        </Link>
      </aside>
    </div>
  );
}

const PILLARS = [
  { id: 'akademik', label: 'Akademik', note: 'Tryout akademik, SKD, dan matematika.' },
  { id: 'psikotes', label: 'Psikotes', note: 'Tryout psikotes, kepribadian, dan kecermatan.' },
  { id: 'jasmani', label: 'Jasmani', note: 'Tryout jasmani, fisik, dan samapta.' },
  { id: 'medis', label: 'Medis/MCU', note: 'Tryout medis, MCU, dan rikkes.' },
] as const;

type PillarScore = {
  id: (typeof PILLARS)[number]['id'];
  label: string;
  note: string;
  value: number;
  attempts: Array<{ id: string; name: string; score: number; startedAt: string }>;
};

function pillarId(text: string) {
  const value = text.toLowerCase();
  if (/medis|mcu|rikkes|kesehatan/.test(value)) return 'medis';
  if (/jasmani|fisik|samapta/.test(value)) return 'jasmani';
  if (/psiko|kecermatan|kepribadian/.test(value)) return 'psikotes';
  if (/akademik|skd|\btwk\b|\btiu\b|\btkp\b|matematika/.test(value)) return 'akademik';
  return null;
}

function pillarScores(results: DashboardOverview['tryoutResults']): PillarScore[] {
  const buckets: Record<PillarScore['id'], PillarScore['attempts']> = {
    akademik: [],
    psikotes: [],
    jasmani: [],
    medis: [],
  };
  for (const result of results) {
    const text = [result.tryout?.name, result.tryout?.subCategory?.name, result.tryout?.subCategory?.category?.name]
      .filter(Boolean)
      .join(' ');
    const id = pillarId(text);
    const score = Number(result.score);
    if (!id || !Number.isFinite(score)) continue;
    buckets[id].push({
      id: result.id,
      name: result.tryout?.name ?? 'Tryout',
      score: Math.round(Math.max(0, Math.min(100, score))),
      startedAt: result.startedAt,
    });
  }
  return PILLARS.map((pillar) => {
    const attempts = buckets[pillar.id];
    const value = attempts.length
      ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length)
      : 0;
    return { id: pillar.id, label: pillar.label, note: pillar.note, value, attempts };
  });
}

function PillarDetailModal({
  open,
  onOpenChange,
  pillars,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillars: PillarScore[];
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(96vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl [scrollbar-width:none] dark:border dark:border-white/10 dark:bg-ink-800 [&::-webkit-scrollbar]:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-extrabold text-slate-900 dark:text-ink-50">Detail 4 Pilar</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                Rata-rata skor tryout pada Akademik, Psikotes, Jasmani, dan Medis/MCU.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-ink-50">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <PillarRadar scores={pillars} />
          <div className="mt-2 space-y-3">
            {pillars.map((pillar) => (
              <section key={pillar.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-ink-50">{pillar.label}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">{pillar.note}</p>
                  </div>
                  <span className="text-lg font-extrabold text-member-600">{pillar.value}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-member-600" style={{ width: `${pillar.value}%` }} />
                </div>
                {pillar.attempts.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400">Belum ada skor tryout di pilar ini.</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {pillar.attempts.map((attempt) => (
                      <li key={attempt.id}>
                        <Link
                          to={`/app/latihan/tryout/review/${attempt.id}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center justify-between rounded-xl px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-slate-800 dark:text-ink-50">{attempt.name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{formatDate(attempt.startedAt)}</span>
                          </span>
                          <span className="text-xs font-extrabold text-member-600">{attempt.score}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PillarRadar({ scores }: { scores: Array<{ label: string; value: number }> }) {
  const cx = 160;
  const cy = 118;
  const radius = 68;
  const count = scores.length;
  const angle = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const at = (index: number, scale: number) => {
    const theta = angle(index);
    return [cx + Math.cos(theta) * radius * scale, cy + Math.sin(theta) * radius * scale] as const;
  };
  const ring = (scale: number) => scores.map((_, index) => at(index, scale).join(',')).join(' ');
  const shape = scores.map((item, index) => at(index, item.value / 100).join(',')).join(' ');

  return (
    <svg viewBox="0 0 320 248" className="mt-1 w-full" role="img" aria-label="Radar 4 pilar">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon key={scale} points={ring(scale)} className="fill-none stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />
      ))}
      {scores.map((item, index) => {
        const [x, y] = at(index, 1);
        return <line key={item.label} x1={cx} y1={cy} x2={x} y2={y} className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />;
      })}
      <polygon points={shape} className="fill-member-600/20 stroke-member-600" strokeWidth="2" strokeLinejoin="round" />
      {scores.map((item, index) => {
        const [x, y] = at(index, Math.max(item.value, 0) / 100);
        return <circle key={`${item.label}-dot`} cx={x} cy={y} r="3.5" className="fill-member-600" />;
      })}
      {scores.map((item, index) => {
        const [x, y] = at(index, 1.38);
        const anchor = Math.abs(x - cx) < 12 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <text key={`${item.label}-label`} x={x} y={y} textAnchor={anchor} className="fill-slate-700 dark:fill-ink-50">
            <tspan fontSize="11" fontWeight="700">
              {item.label}
            </tspan>
            <tspan x={x} dy="13" fontSize="10" fontWeight="800" className="fill-member-600">
              {item.value}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

function HeroBooks() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 240"
      fill="none"
      aria-hidden
    >
      <circle cx="620" cy="90" r="160" fill="#FFFFFF" fillOpacity="0.3" />
      <g opacity="0.45" transform="translate(350, 140) rotate(-6)">
        <rect x="0" y="45" width="130" height="22" rx="5" fill="#60A5FA" fillOpacity="0.55" />
        <rect x="10" y="24" width="118" height="20" rx="4" fill="#F59E0B" fillOpacity="0.7" />
        <rect x="18" y="5" width="102" height="18" rx="4" fill="#3B82F6" fillOpacity="0.6" />
      </g>
      <g opacity="0.35" transform="translate(260, 25) rotate(14)">
        <rect x="0" y="0" width="38" height="48" rx="5" fill="#FFFFFF" fillOpacity="0.75" stroke="#93C5FD" />
      </g>
    </svg>
  );
}

function ContinueThumb() {
  return (
    <svg className="h-full w-full" viewBox="0 0 100 80" aria-hidden>
      <rect fill="#E0F2FE" height="80" width="100" />
      <rect fill="#3B82F6" height="36" rx="4" width="48" x="12" y="28" />
      <rect fill="#F59E0B" height="28" rx="4" width="40" x="28" y="20" />
      <rect fill="#60A5FA" height="22" rx="4" width="36" x="40" y="12" />
    </svg>
  );
}
