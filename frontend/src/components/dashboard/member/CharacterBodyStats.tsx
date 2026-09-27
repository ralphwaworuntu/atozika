import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LearnerCharacter } from '@/components/dashboard/member/LearnerCharacter';

export type CharacterBodyStatsModel = {
  name: string;
  packageName: string;
  avgScore: number;
  tryouts: number;
  materials: number;
  streak: number;
  weekDays: number;
};

type Zone = {
  id: string;
  n: number;
  title: string;
  metric: string;
  body: string;
  percent: number;
  target: string;
  hotspot: string;
  tooltip: string;
  ring: string;
  badge: string;
  bar: string;
  hover: string;
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function zonesFrom(stats: CharacterBodyStatsModel): Zone[] {
  const weekPct = clampPct((stats.weekDays / 7) * 100);
  const catPct = clampPct(stats.avgScore);
  const materiPct = clampPct((stats.materials / 20) * 100);
  const drillPct = clampPct((stats.tryouts / 20) * 100);
  const streakPct = clampPct((stats.streak / 14) * 100);

  return [
    {
      id: 'head',
      n: 1,
      title: 'Kepala • Skor CAT & Retensi',
      metric: `${catPct}% Skor`,
      body: `Rata-rata tryout kamu ${catPct}. Zona ini mengukur daya ingat kisi CAT, SKD, dan soal simulasi yang sudah dikerjakan.`,
      percent: catPct,
      target: 'Target: 100 skor',
      hotspot: 'top-[12%] left-[48%] -translate-x-1/2',
      tooltip: `Otak & CAT: ${catPct}%`,
      ring: 'bg-sky-400',
      badge: 'bg-[#1D72FE]',
      bar: 'bg-member-600',
      hover: 'hover:border-blue-200',
    },
    {
      id: 'ears',
      n: 2,
      title: 'Telinga • Materi & Ketelitian',
      metric: `${stats.materials} modul`,
      body: `Kamu punya akses ke ${stats.materials} materi. Semakin rutin dibaca, semakin tajam rekognisi pola soal dan ketelitian.`,
      percent: materiPct,
      target: 'Target: 20 modul',
      hotspot: 'top-[20%] right-[16%]',
      tooltip: `Materi: ${stats.materials}`,
      ring: 'bg-emerald-400',
      badge: 'bg-emerald-600',
      bar: 'bg-emerald-500',
      hover: 'hover:border-emerald-200',
    },
    {
      id: 'torso',
      n: 3,
      title: 'Dada • Stamina Latihan Mingguan',
      metric: `Konsistensi ${weekPct}%`,
      body: `Hari aktif minggu ini ${stats.weekDays} dari 7. Stamina seleksi diukur dari kebiasaan masuk dashboard dan menyelesaikan sesi.`,
      percent: weekPct,
      target: `${stats.weekDays} / 7 hari`,
      hotspot: 'top-[42%] left-[50%] -translate-x-1/2',
      tooltip: `Stamina: ${stats.weekDays}/7 hari`,
      ring: 'bg-indigo-400',
      badge: 'bg-indigo-600',
      bar: 'bg-indigo-500',
      hover: 'hover:border-indigo-200',
    },
    {
      id: 'hands',
      n: 4,
      title: 'Tangan • Drills Tryout Selesai',
      metric: `${stats.tryouts} sesi`,
      body: `Total ${stats.tryouts} tryout tersimpan. Semakin banyak drill, semakin cepat eksekusi soal di ruang ujian.`,
      percent: drillPct,
      target: 'Target: 20 sesi',
      hotspot: 'top-[50%] left-[20%]',
      tooltip: `Drills: ${stats.tryouts}`,
      ring: 'bg-purple-400',
      badge: 'bg-purple-600',
      bar: 'bg-purple-500',
      hover: 'hover:border-purple-200',
    },
    {
      id: 'feet',
      n: 5,
      title: 'Kaki • Pace & Streak',
      metric: `${stats.streak}-Hari Streak`,
      body: `Langkah tanpa putus selama ${stats.streak} hari. Jaga streak agar ritme seleksi TNI, Polri, dan kedinasan tidak pecah.`,
      percent: streakPct,
      target: 'Milestone: 14 hari',
      hotspot: 'bottom-[8%] left-[50%] -translate-x-1/2',
      tooltip: `Streak: ${stats.streak} hari`,
      ring: 'bg-amber-400',
      badge: 'bg-amber-500',
      bar: 'bg-amber-500',
      hover: 'hover:border-amber-200',
    },
  ];
}

function synergyOf(zones: Zone[]) {
  if (zones.length === 0) return 0;
  return clampPct(zones.reduce((sum, zone) => sum + zone.percent, 0) / zones.length);
}

export function CharacterBodyStatsCard({ stats }: { stats: CharacterBodyStatsModel }) {
  const [open, setOpen] = useState(false);
  const zones = zonesFrom(stats);
  const synergy = synergyOf(zones);
  const firstName = stats.name.split(/\s+/)[0] ?? stats.name;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="member-card group w-full space-y-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">✨</span>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-ink-50">Karakter & Statistik Tubuh</h4>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-member-600 dark:bg-blue-500/15">
            Detail ↗
          </span>
        </div>
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-blue-100/60 bg-gradient-to-b from-sky-50 via-blue-50/60 to-indigo-50/40 p-3 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-ink-800 dark:to-indigo-950/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(147,197,253,0.4),_transparent_70%)]" />
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-blue-100/80 bg-white/90 px-2 py-0.5 backdrop-blur-md dark:border-blue-500/20 dark:bg-ink-800/90">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-ink-50">{synergy}% Synergy</span>
          </div>
          <div className="relative flex h-36 items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <LearnerCharacter className="h-36 w-auto drop-shadow-md" />
          </div>
          <p className="mt-1 text-center text-xs font-bold text-slate-800 dark:text-ink-50">
            {firstName} • Learner Avatar
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <StatPill emoji="🧠" label="Head" value={`${zones[0]?.percent ?? 0}%`} hint="Skor CAT" tone="text-blue-600" />
          <StatPill emoji="✍️" label="Hands" value={`${stats.tryouts}`} hint="Tryout selesai" tone="text-purple-600" />
          <StatPill emoji="👟" label="Feet" value={`${stats.streak}-Day`} hint="Streak pace" tone="text-amber-500" />
        </div>
        <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-member-600 transition hover:bg-member-600 hover:text-white dark:bg-blue-500/15">
          Buka Analisis Tubuh Belajar
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </span>
      </button>
      <CharacterStatsModal open={open} onClose={() => setOpen(false)} stats={stats} zones={zones} synergy={synergy} />
    </>
  );
}

function StatPill({
  emoji,
  label,
  value,
  hint,
  tone,
}: {
  emoji: string;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-1.5 text-center dark:border-white/10 dark:bg-white/5">
      <p className="text-[9px] font-bold leading-none text-slate-400">
        {emoji} {label}
      </p>
      <p className={cn('mt-1 text-[11px] font-extrabold', tone)}>{value}</p>
      <p className="truncate text-[8px] font-semibold text-slate-500">{hint}</p>
    </div>
  );
}

function CharacterStatsModal({
  open,
  onClose,
  stats,
  zones,
  synergy,
}: {
  open: boolean;
  onClose: () => void;
  stats: CharacterBodyStatsModel;
  zones: Zone[];
  synergy: number;
}) {
  const [active, setActive] = useState(zones[0]?.id ?? 'head');
  const weakest = [...zones].sort((a, b) => a.percent - b.percent)[0];
  const cta =
    weakest?.id === 'ears'
      ? { to: '/app/materi', label: 'Buka Materi' }
      : weakest?.id === 'hands'
        ? { to: '/app/latihan-soal', label: 'Mulai Latihan Soal' }
        : { to: '/app/latihan/tryout', label: 'Mulai Tryout' };

  useEffect(() => {
    if (!open) return undefined;
    setActive('head');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="body-stats-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl scale-100 flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white font-member shadow-2xl dark:border-blue-500/20 dark:bg-ink-800">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#F8FAFF] via-white to-[#F0F7FF] px-5 py-4 dark:border-white/10 dark:from-blue-950/40 dark:via-ink-800 dark:to-ink-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-member-600 text-lg text-white shadow-md shadow-blue-500/25">
              🧬
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="body-stats-title" className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50 sm:text-lg">
                  Statistik Belajar: Head-to-Toe Analysis
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                  {synergy}% Synergy
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                Siswa: <span className="font-bold text-slate-800 dark:text-ink-50">{stats.name}</span> • {stats.packageName}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup modal"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-white/10 dark:text-ink-100"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5 [scrollbar-width:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
            <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/80 via-sky-50/40 to-slate-50 p-5 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-ink-800 dark:to-ink-900 md:col-span-5">
              <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-member-600" />
                  5 Zona Aktif
                </span>
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] text-member-600 shadow-sm dark:bg-ink-800">
                  Full Diagnostic
                </span>
              </div>
              <div className="relative flex aspect-[3/4] w-full max-w-[260px] items-center justify-center">
                <LearnerCharacter className="h-full w-full object-contain drop-shadow-lg" />
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    className={cn('group absolute cursor-pointer', zone.hotspot)}
                    onClick={() => setActive(zone.id)}
                    aria-label={zone.tooltip}
                  >
                    <span className={cn('pointer-events-none absolute -inset-2 rounded-full animate-pulse-ring', zone.ring)} />
                    <span
                      className={cn(
                        'relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white shadow-md',
                        zone.badge,
                        active === zone.id && 'scale-110',
                      )}
                    >
                      {zone.n}
                    </span>
                    <span className="absolute left-7 top-0 z-30 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:flex">
                      {zone.tooltip}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-1.5 text-center text-[11px] font-medium text-slate-500 backdrop-blur-sm dark:border-blue-500/20 dark:bg-ink-800/80">
                💡 Sorot atau klik penanda bernomor untuk eksplorasi metrik tubuh
              </p>
            </div>

            <div className="space-y-3 md:col-span-7">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setActive(zone.id)}
                  className={cn(
                    'w-full rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition dark:border-white/10 dark:bg-ink-900',
                    zone.hover,
                    active === zone.id && 'border-blue-300 ring-2 ring-member-600/20',
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 text-xs font-extrabold text-blue-700">
                        {zone.n}
                      </span>
                      <span className="truncate text-sm font-extrabold text-slate-800 dark:text-ink-50">{zone.title}</span>
                    </div>
                    <span className="shrink-0 text-xs font-black text-member-600">{zone.metric}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{zone.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className={cn('h-full rounded-full', zone.bar)} style={{ width: `${zone.percent}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{zone.target}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-500/20 dark:from-blue-950/40 dark:to-indigo-950/30 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-member-600 text-base text-white shadow-sm">
                🎯
              </div>
              <div>
                <h5 className="text-xs font-black tracking-tight text-slate-900 dark:text-ink-50">
                  Rekomendasi Latihan Personalisasi
                </h5>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-ink-200">
                  Fokus berikutnya: <strong className="font-bold text-member-700">{weakest?.title ?? 'Tryout CAT'}</strong> agar sinergi tubuh naik.
                </p>
              </div>
            </div>
            <Link
              to={cta.to}
              onClick={onClose}
              className="whitespace-nowrap self-start rounded-xl bg-member-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-member-700 active:scale-95 sm:self-auto"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
