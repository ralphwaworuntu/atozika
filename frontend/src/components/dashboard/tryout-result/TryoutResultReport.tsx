import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  Clock3,
  Copy,
  Share2,
  Trophy,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  buildDssClusterImpact,
  buildRegionalRank,
  buildSubTestBreakdown,
  buildTimeAnalytics,
  buildWeaknessDiagnostics,
  formatDurationLabel,
  passingScenario,
  TRYOUT_PASSING_GRADE,
  type SubTestBreakdown,
} from '@/lib/tryoutResultInsights';
import type { TryoutReviewQuestion } from '@/types/exam';
import { cn } from '@/utils/cn';

type TryoutResultReportProps = {
  resultId: string;
  title: string;
  categoryName?: string;
  subCategoryName?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAtLabel: string;
  tryoutSlug?: string;
  questions: TryoutReviewQuestion[];
  sectionBreakdowns?: Array<{ label: string; score: number; correct: number; total: number }>;
  backToList: string;
  onRetry?: () => void;
};

function btn3d(base: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60',
    base,
  );
}

function OwlMascot({ mood }: { mood: 'celebrate' | 'spirit' }) {
  return (
    <div className="relative flex h-28 w-28 items-end justify-center sm:h-36 sm:w-36" aria-hidden>
      <div
        className={cn(
          'absolute bottom-2 h-6 w-20 rounded-full bg-slate-900/10 blur-md dark:bg-black/40',
          mood === 'celebrate' ? 'animate-pulse' : '',
        )}
      />
      <picture
        className={cn(
          'relative z-[1] drop-shadow-lg transition-transform duration-500',
          mood === 'celebrate' ? 'animate-[bounce_1.4s_ease-in-out_infinite]' : 'animate-[pulse_2.2s_ease-in-out_infinite]',
        )}
      >
        <source srcSet="/mascot.webp" type="image/webp" />
        <img src="/mascot.png" alt="" className="h-28 w-auto object-contain object-bottom sm:h-36" />
      </picture>
      {mood === 'celebrate' ? (
        <span className="absolute -right-1 top-2 text-lg animate-[bounce_1s_infinite]">✨</span>
      ) : (
        <span className="absolute -left-1 top-3 text-base animate-pulse">🔥</span>
      )}
    </div>
  );
}

function ShareStatusModal({
  open,
  onClose,
  title,
  score,
  passed,
  rankLabel,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  score: number;
  passed: boolean;
  rankLabel: string;
  userName: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  if (!open || typeof document === 'undefined') return null;

  const shareText = `${userName} menyelesaikan ${title} dengan skor ${Math.round(score)}. ${rankLabel}. #ATOZIKA`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Status berhasil disalin');
    } catch {
      toast.error('Gagal menyalin status');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Hasil Tryout ATOZIKA', text: shareText });
        return;
      } catch {
        /* fall through */
      }
    }
    await handleCopy();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-ink-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-ink-50">Share Status Card</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="text-sm font-bold">✕</span>
          </button>
        </div>
        <div
          ref={cardRef}
          className={cn(
            'overflow-hidden rounded-3xl p-5 text-white',
            passed
              ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700'
              : 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-600',
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">ATOZIKA Status</p>
          <p className="mt-2 text-sm font-semibold text-white/90">{userName}</p>
          <h4 className="mt-1 text-xl font-extrabold leading-tight">{title}</h4>
          <p className="mt-4 text-5xl font-extrabold tabular-nums">{Math.round(score)}</p>
          <p className="mt-1 text-sm font-semibold text-white/90">{rankLabel}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-ink-800 dark:text-ink-50"
          >
            <Copy className="h-4 w-4" /> Salin
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={btn3d('bg-member-600 text-white shadow-[0_4px_0_0_#1d4ed8] hover:bg-member-700')}
          >
            <Share2 className="h-4 w-4" /> Bagikan
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ScoringTable({
  items,
  score,
  correctCount,
  totalQuestions,
}: {
  items: SubTestBreakdown[];
  score: number;
  correctCount: number;
  totalQuestions: number;
}) {
  const incorrectCount = Math.max(0, totalQuestions - correctCount);
  const unansweredCount = Math.max(
    0,
    totalQuestions - items.reduce((sum, item) => sum + item.total, 0),
  );

  return (
    <section className="member-card overflow-hidden print:break-inside-avoid">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Hasil Penilaian</p>
        <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50 sm:text-lg">
          Tabel Penilaian Tryout
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-ink-300">
          Rincian skor per sub-tes setelah kamu menyelesaikan pengerjaan.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-ink-200">
            <tr>
              <th className="px-4 py-3 sm:px-5">Sub-tes</th>
              <th className="px-3 py-3 text-center">Soal</th>
              <th className="px-3 py-3 text-center">Benar</th>
              <th className="px-3 py-3 text-center">Salah</th>
              <th className="px-3 py-3 text-center">Skor</th>
              <th className="px-3 py-3 text-center">PG</th>
              <th className="px-4 py-3 text-center sm:px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {items.map((item) => {
              const wrong = Math.max(0, item.total - item.correct);
              return (
                <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-ink-50 sm:px-5">{item.label}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums font-semibold text-slate-600 dark:text-ink-200">
                    {item.total}
                  </td>
                  <td className="px-3 py-3.5 text-center tabular-nums font-bold text-emerald-600">{item.correct}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums font-bold text-rose-600">{wrong}</td>
                  <td
                    className={cn(
                      'px-3 py-3.5 text-center text-base font-extrabold tabular-nums',
                      item.passed ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {Math.round(item.score)}
                  </td>
                  <td className="px-3 py-3.5 text-center tabular-nums font-semibold text-slate-500">{item.passingGrade}</td>
                  <td className="px-4 py-3.5 text-center sm:px-5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                        item.passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                      )}
                    >
                      {item.passed ? 'Lulus' : 'TMS'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 dark:border-white/15 dark:bg-white/5">
            <tr>
              <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-ink-50 sm:px-5">Total</td>
              <td className="px-3 py-3.5 text-center tabular-nums font-extrabold text-slate-800 dark:text-ink-100">
                {totalQuestions}
              </td>
              <td className="px-3 py-3.5 text-center tabular-nums font-extrabold text-emerald-600">{correctCount}</td>
              <td className="px-3 py-3.5 text-center tabular-nums font-extrabold text-rose-600">{incorrectCount}</td>
              <td
                className={cn(
                  'px-3 py-3.5 text-center text-base font-extrabold tabular-nums',
                  score >= TRYOUT_PASSING_GRADE ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {Math.round(score)}
              </td>
              <td className="px-3 py-3.5 text-center tabular-nums font-semibold text-slate-500">{TRYOUT_PASSING_GRADE}</td>
              <td className="px-4 py-3.5 text-center sm:px-5">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                    score >= TRYOUT_PASSING_GRADE
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                  )}
                >
                  {score >= TRYOUT_PASSING_GRADE ? 'Lulus' : 'TMS'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {unansweredCount > 0 ? (
        <p className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-amber-700 dark:border-white/10 dark:text-amber-300 sm:px-6">
          Catatan: {unansweredCount} soal belum masuk ke sub-tes di atas.
        </p>
      ) : null}
    </section>
  );
}

export function TryoutResultReport({
  resultId,
  title,
  categoryName,
  subCategoryName,
  score,
  correctCount,
  totalQuestions,
  durationSeconds,
  completedAtLabel,
  questions,
  sectionBreakdowns,
  backToList,
  onRetry: _onRetry,
}: TryoutResultReportProps) {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const pembahasanHref = `/app/latihan/tryout/review/${resultId}/pembahasan`;

  const scenario = passingScenario(score);
  const subTests = useMemo(
    () => buildSubTestBreakdown(questions, categoryName, subCategoryName, sectionBreakdowns),
    [questions, categoryName, subCategoryName, sectionBreakdowns],
  );
  const weaknesses = useMemo(() => buildWeaknessDiagnostics(subTests), [subTests]);
  const timeAnalytics = useMemo(
    () => buildTimeAnalytics(resultId, questions, durationSeconds),
    [resultId, questions, durationSeconds],
  );
  const clusters = useMemo(() => buildDssClusterImpact(score), [score]);
  const regional = useMemo(() => buildRegionalRank(score, resultId), [score, resultId]);
  const rankLabel = `Peringkat #${regional.rank} · ${regional.region}`;

  const waMessage = encodeURIComponent(
    `Assalamualaikum, laporan tryout ATOZIKA untuk ${user?.name ?? 'putra/putri Bapak/Ibu'}.\n` +
      `Tryout: ${title}\nSkor: ${Math.round(score)} (${correctCount}/${totalQuestions} benar)\n` +
      `Status: ${scenario.label}\n${rankLabel}\nSelesai: ${completedAtLabel}`,
  );
  const waHref = `https://wa.me/?text=${waMessage}`;

  const handlePrint = () => {
    toast.success('Menyiapkan cetak rapor PDF', {
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    });
    window.setTimeout(() => window.print(), 150);
  };

  const handleShareWhatsapp = () => {
    toast.success('Membuka WhatsApp untuk kirim rapor orang tua', {
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    });
    window.open(waHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative space-y-5 print:pb-0">
      <div className="print:hidden">
        <Link
          to={backToList}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar tryout
        </Link>
      </div>

      <div className="member-card flex items-center gap-3 px-3 py-2.5 sm:px-4 print:hidden">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Hasil Tryout</p>
          <h1 className="truncate text-sm font-extrabold text-slate-900 dark:text-ink-50 sm:text-base">{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className={btn3d(
            'shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-[0_4px_0_0_#cbd5e1] hover:bg-slate-50 dark:border-white/10 dark:bg-ink-800 dark:text-ink-50 dark:shadow-[0_4px_0_0_#334155]',
          )}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      <article
        className={cn(
          'member-card overflow-hidden print:break-inside-avoid',
          scenario.passed ? 'ring-1 ring-emerald-200 dark:ring-emerald-500/30' : 'ring-1 ring-rose-200 dark:ring-rose-500/30',
        )}
      >
        <div
          className={cn(
            'grid gap-4 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-6',
            scenario.passed ? 'bg-emerald-50/80 dark:bg-emerald-500/10' : 'bg-rose-50/80 dark:bg-rose-500/10',
          )}
        >
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-sm',
                scenario.passed ? 'bg-emerald-600' : 'bg-rose-600',
              )}
            >
              <span aria-hidden>{scenario.passed ? '🟢' : '🔴'}</span>
              {scenario.label}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-ink-300">{scenario.detail}</p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">Skor Komposit</p>
            <p
              className={cn(
                'text-6xl font-extrabold tabular-nums tracking-tight sm:text-7xl',
                scenario.passed ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {Math.round(score)}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-ink-200">
              {correctCount}/{totalQuestions} benar · PG {TRYOUT_PASSING_GRADE} · {completedAtLabel}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:bg-ink-900/80 dark:text-ink-100">
              <Trophy className="h-4 w-4 text-amber-500" />
              Regional Leaderboard · {rankLabel}
              <span className="text-slate-400">· Top {regional.percentile}%</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-end">
            <OwlMascot mood={scenario.passed ? 'celebrate' : 'spirit'} />
            <p className="mt-1 text-[11px] font-bold text-slate-500">
              {scenario.passed ? 'Selebrasi Owl!' : 'Semangat, Owl siap dampingi'}
            </p>
          </div>
        </div>
      </article>

      <ScoringTable
        items={subTests}
        score={score}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
      />

      <section className="grid gap-3 print:hidden sm:grid-cols-3">
        <Link
          to={pembahasanHref}
          className={cn(
            'relative flex flex-col items-start gap-2 rounded-3xl border border-emerald-400/40 bg-[#10B981] p-4 text-left text-white transition',
            'shadow-[0_6px_0_0_#059669] hover:brightness-105 active:translate-y-[4px] active:shadow-none',
          )}
        >
          <span className="absolute -top-2 right-3 inline-flex items-center rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950 shadow-sm">
            🔥 Paling Penting
          </span>
          <span className="text-lg font-extrabold leading-tight">🔍 Bedah Soal & Pembahasan</span>
          <span className="text-xs font-semibold text-emerald-50/90">Lihat kunci jawaban & video tentor</span>
        </Link>

        <button
          type="button"
          onClick={handleShareWhatsapp}
          className={cn(
            'flex flex-col items-start gap-2 rounded-3xl border border-[#1ebe5d]/40 bg-[#25D366] p-4 text-left text-white transition',
            'shadow-[0_6px_0_0_#128C7E] hover:brightness-105 active:translate-y-[4px] active:shadow-none',
          )}
        >
          <span className="text-lg font-extrabold leading-tight">📲 Kirim WA Ortu</span>
          <span className="text-xs font-semibold text-white/90">Magic link tanpa login</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className={cn(
            'flex flex-col items-start gap-2 rounded-3xl border-2 border-[#1e3a5f] bg-white p-4 text-left text-[#1e3a5f] transition dark:border-slate-300 dark:bg-ink-900 dark:text-slate-100',
            'shadow-[0_6px_0_0_#1e3a5f] hover:bg-slate-50 active:translate-y-[4px] active:shadow-none dark:shadow-[0_6px_0_0_#64748b] dark:hover:bg-ink-800',
          )}
        >
          <span className="text-lg font-extrabold leading-tight">📄 Cetak Rapor PDF</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Unduh dokumen rapor resmi</span>
        </button>
      </section>

      <section className="member-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Weakness Diagnostic</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Klasifikasi akurasi per area latihan</p>
          </div>
          <Link
            to="/app/materi"
            className={btn3d('bg-member-600 text-white shadow-[0_4px_0_0_#1d4ed8] hover:bg-member-700')}
          >
            <BookOpenCheck className="h-4 w-4" />
            Buka Modul Intervensi
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {weaknesses.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded-2xl border p-4',
                item.level === 'strength' && 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
                item.level === 'moderate' && 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
                item.level === 'critical' && 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {item.level === 'strength' ? 'Kekuatan' : item.level === 'moderate' ? 'Sedang' : 'Kelemahan Kritis'}
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-ink-50">{item.label}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-800 dark:text-ink-50">
                {Math.round(item.accuracy)}%
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                {item.correct}/{item.total} benar
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="member-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-member-600" />
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Time Spend Analytics</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Rata-rata / nomor</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-ink-50">
              {formatDurationLabel(timeAnalytics.averageSeconds)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-400">
              Total {formatDurationLabel(timeAnalytics.totalSeconds)}
              {timeAnalytics.estimated ? ' · estimasi sesi' : ''}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">Top 3 Soal Terlama (Time Bottleneck)</p>
            <div className="space-y-2">
              {timeAnalytics.bottlenecks.map((item, index) => (
                <div key={item.questionId} className="flex items-start gap-3 rounded-2xl border border-slate-100 px-3 py-2.5 dark:border-white/10">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-extrabold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                    #{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-ink-50">
                      Soal {item.order}: {item.prompt}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {formatDurationLabel(item.seconds)} · {item.isCorrect ? 'Benar' : 'Salah'}
                    </p>
                  </div>
                </div>
              ))}
              {!timeAnalytics.bottlenecks.length ? (
                <p className="text-sm text-slate-500">Belum ada data bottleneck.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="member-card space-y-4 p-5">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">DSS Multi-Cluster Impact</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Proyeksi kelayakan berdasarkan skor tryout ini di 4 klaster seleksi
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{cluster.label}</p>
              <p
                className={cn(
                  'mt-2 text-3xl font-extrabold tabular-nums',
                  cluster.tone === 'high' && 'text-emerald-600',
                  cluster.tone === 'mid' && 'text-amber-600',
                  cluster.tone === 'low' && 'text-rose-600',
                )}
              >
                {cluster.eligibility}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full',
                    cluster.tone === 'high' && 'bg-emerald-500',
                    cluster.tone === 'mid' && 'bg-amber-500',
                    cluster.tone === 'low' && 'bg-rose-500',
                  )}
                  style={{ width: `${cluster.eligibility}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <ShareStatusModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        score={score}
        passed={scenario.passed}
        rankLabel={rankLabel}
        userName={user?.name ?? 'Member ATOZIKA'}
      />
    </div>
  );
}
