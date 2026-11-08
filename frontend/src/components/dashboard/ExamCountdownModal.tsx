import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrainCircuit, Check, Maximize2, ShieldCheck, Wifi, X } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';
import { cn } from '@/utils/cn';

type CountdownKind = 'tryout' | 'cermat' | 'practice' | 'exam';

type CountdownContentProps = {
  kind: CountdownKind;
  eyebrow: string;
  title: string;
  subtitle?: string;
  warning?: string | null;
  onComplete: () => void;
  onCancel: () => void;
  initialSeconds: number;
};

function CountdownContent({
  kind,
  eyebrow,
  title,
  subtitle,
  warning,
  onComplete,
  onCancel,
  initialSeconds,
}: CountdownContentProps) {
  const safeInitialSeconds = Math.max(1, initialSeconds);
  const [seconds, setSeconds] = useState(safeInitialSeconds);
  const completedRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    if (seconds !== 0 || completedRef.current) return;
    completedRef.current = true;
    const timer = window.setTimeout(() => {
      onComplete();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [onComplete, seconds]);

  const config =
    kind === 'cermat'
      ? {
          accent: 'text-emerald-300',
          badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
          icon: 'bg-emerald-400/15 text-emerald-300',
          ring: '#34d399',
          glow: 'bg-emerald-400/20',
          progress: 'from-emerald-400 to-cyan-300',
        }
      : kind === 'tryout'
        ? {
            accent: 'text-sky-300',
            badge: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
            icon: 'bg-sky-400/15 text-sky-300',
            ring: '#60a5fa',
            glow: 'bg-blue-500/20',
            progress: 'from-blue-400 to-cyan-300',
          }
        : {
            accent: 'text-violet-300',
            badge: 'border-violet-300/20 bg-violet-300/10 text-violet-200',
            icon: 'bg-violet-400/15 text-violet-300',
            ring: '#a78bfa',
            glow: 'bg-violet-500/20',
            progress: 'from-violet-400 to-sky-300',
          };
  const checks =
    kind === 'cermat'
      ? [
          { icon: BrainCircuit, label: 'Fokus penuh', note: 'Jawab cepat dan tepat' },
          { icon: Maximize2, label: 'Layar penuh', note: 'Jangan tinggalkan halaman' },
          { icon: Wifi, label: 'Koneksi stabil', note: 'Pastikan jaringan siap' },
        ]
      : [
          { icon: Maximize2, label: 'Layar penuh', note: 'Tetap sampai ujian selesai' },
          { icon: ShieldCheck, label: 'Anti-cheat aktif', note: 'Jangan berpindah tab' },
          { icon: Wifi, label: 'Koneksi stabil', note: 'Jawaban tersimpan aman' },
        ];
  const radius = 67;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / safeInitialSeconds;
  const showWarning = warning !== null;
  const warningText = warning ?? 'Ujian akan diblokir jika Anda meninggalkan halaman ini sebelum selesai.';

  return (
    <div className="relative grid min-h-[100dvh] w-full overflow-hidden bg-[#09111f] text-white sm:min-h-0 sm:max-w-5xl sm:rounded-[32px] sm:border sm:border-white/10 sm:shadow-[0_30px_100px_rgba(0,0,0,0.55)] lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)]">
      <div aria-hidden="true" className={cn('pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl', config.glow)} />
      <button
        type="button"
        onClick={onCancel}
        aria-label="Batalkan persiapan ujian"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:right-5 sm:top-5"
      >
        <X className="h-4 w-4" />
      </button>

      <section className="relative flex flex-col justify-center px-5 pb-5 pt-16 sm:px-8 sm:pb-8 sm:pt-10 lg:px-10 lg:py-12">
        <BrandMark variant="icon" size="sm" tone="ink" className="mb-7" />
        <span className={cn('inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em]', config.badge)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
          {eyebrow}
        </span>
        <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">{title}</h2>
        {subtitle ? <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">{subtitle}</p> : null}

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {checks.map(({ icon: Icon, label, note }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', config.icon)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white">{label}</p>
                <p className="hidden truncate text-[9px] font-medium text-slate-400 sm:block">{note}</p>
              </div>
            </div>
          ))}
        </div>

        {showWarning ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-3.5 py-3 text-left">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p className="text-[11px] font-semibold leading-relaxed text-amber-100/90 sm:text-xs">{warningText}</p>
          </div>
        ) : null}
      </section>

      <section className="relative flex flex-col items-center justify-center border-t border-white/10 bg-white/[0.025] px-5 py-7 lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
        <p className={cn('text-[10px] font-extrabold uppercase tracking-[0.24em]', config.accent)}>
          {seconds <= 1 ? 'Bersiap' : 'Dimulai dalam'}
        </p>
        <div className="relative mt-3 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          <div aria-hidden="true" className={cn('absolute inset-5 rounded-full blur-2xl', config.glow)} />
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={config.ring}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
            />
          </svg>
          <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/10 bg-[#0d1727] shadow-[inset_0_0_30px_rgba(255,255,255,0.025)] sm:h-40 sm:w-40">
            <span className="text-6xl font-extrabold leading-none tracking-tight tabular-nums sm:text-7xl">{seconds}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">detik</span>
          </div>
        </div>

        <div className="mt-5 w-full max-w-xs">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span>Persiapan</span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Check className="h-3 w-3" /> Siap
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-linear', config.progress)}
              style={{ width: `${Math.max(0, Math.min(100, (1 - progress) * 100))}%` }}
            />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">Ujian dimulai otomatis. Tetap di halaman ini.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-5 rounded-full border border-white/10 px-5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Batalkan
        </button>
      </section>
    </div>
  );
}

type ExamCountdownModalProps = {
  open: boolean;
  kind?: CountdownKind;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  initialSeconds?: number;
  warning?: string | null;
  onComplete: () => void;
  onCancel: () => void;
  resetKey?: number;
  /** Kept for compatibility; countdown is always solid/opaque. */
  variant?: 'default' | 'focus';
};

export function ExamCountdownModal({
  open,
  kind = 'exam',
  eyebrow,
  title,
  subtitle,
  warning,
  onComplete,
  onCancel,
  initialSeconds = 5,
  resetKey,
}: ExamCountdownModalProps) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        'fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-y-auto bg-[#030712] sm:flex sm:items-center sm:justify-center sm:p-5',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.18),_transparent_45%)]"
      />
      <div className="relative min-h-full w-full sm:min-h-0 sm:max-w-5xl">
        <CountdownContent
          key={resetKey}
          kind={kind}
          eyebrow={eyebrow ?? (kind === 'cermat' ? 'Tes Kecermatan' : kind === 'tryout' ? 'Simulasi CAT' : 'Persiapan Ujian')}
          title={title}
          subtitle={subtitle}
          warning={warning}
          onComplete={onComplete}
          onCancel={onCancel}
          initialSeconds={initialSeconds}
        />
      </div>
    </div>,
    document.body,
  );
}
