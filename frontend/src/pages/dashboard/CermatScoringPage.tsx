import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Target } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { CERMAT_MODE_LABELS, type CermatMode } from '@/types/cermat';
import { cn } from '@/utils/cn';

export type CermatScoringAttempt = {
  id: string;
  mode: CermatMode;
  totalSessions: number;
  sessionCount: number;
  averageScore: number;
  totalCorrect: number;
  totalQuestions: number;
  finishedAt?: string | null;
  startedAt: string;
  sessions: Array<{
    id: string;
    sessionIndex: number;
    totalQuestions: number;
    correctCount: number;
    score: number | null;
    finishedAt?: string | null;
    createdAt: string;
  }>;
};

function scoreTone(score: number) {
  if (score >= 85) return { label: 'Sangat Baik', bar: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (score >= 70) return { label: 'Baik', bar: 'bg-brand-500', soft: 'bg-brand-50 text-brand-800 border-brand-200' };
  if (score >= 50) return { label: 'Cukup', bar: 'bg-amber-500', soft: 'bg-amber-50 text-amber-900 border-amber-200' };
  return { label: 'Perlu Latihan', bar: 'bg-rose-500', soft: 'bg-rose-50 text-rose-800 border-rose-200' };
}

export function CermatScoringPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const membership = useMembershipStatus();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cermat-scoring', attemptId],
    queryFn: () => apiGet<CermatScoringAttempt>(`/exams/cermat/history/${attemptId}`),
    enabled: Boolean(membership.data?.isActive && attemptId),
  });

  if (membership.isLoading || isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  if (membership.data?.allowCermat === false) {
    return (
      <section className="rounded-3xl border border-brand-200 bg-brand-50 p-6 text-sm text-brand-800">
        Paket membership kamu tidak mencakup akses tes kecermatan. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="page-shell">
        <div className="member-card p-8 text-center">
          <p className="text-sm text-slate-600">Hasil skoring tes tidak ditemukan.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/app/tes-kecermatan">Kembali ke Tes Kecermatan</Link>
          </Button>
        </div>
      </section>
    );
  }

  const avg = Math.round(data.averageScore ?? 0);
  const tone = scoreTone(avg);
  const modeLabel = CERMAT_MODE_LABELS[data.mode] ?? data.mode;

  return (
    <section className="page-shell space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/app/tes-kecermatan">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Tes Kecermatan
          </Link>
        </Button>
      </div>

      <div className="member-card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 px-6 py-8 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">Hasil Skoring</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{modeLabel}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {data.sessionCount} sesi selesai · {formatDate(data.finishedAt ?? data.startedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  const enterFullscreen = document.fullscreenElement
                    ? Promise.resolve()
                    : document.documentElement.requestFullscreen?.().catch(() => undefined);
                  void Promise.resolve(enterFullscreen).finally(() => {
                    navigate(`/app/tes-kecermatan?mode=${data.mode}&autoStart=1`);
                  });
                }}
              >
                Ulangi Tes
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/tes-kecermatan/riwayat">Semua Riwayat</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rata-rata skor</p>
              <p className="mt-1 text-6xl font-extrabold tabular-nums text-slate-900">{avg}%</p>
              <span className={cn('mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold', tone.soft)}>
                {tone.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[16rem]">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Benar
                </div>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {data.totalCorrect}
                  <span className="text-base font-semibold text-slate-400">/{data.totalQuestions}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Target className="h-3.5 w-3.5" />
                  Sesi
                </div>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {data.sessionCount}
                  <span className="text-base font-semibold text-slate-400">/{data.totalSessions}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <h2 className="text-lg font-extrabold text-slate-900">Skor per sesi</h2>
          <p className="mt-1 text-sm text-slate-500">Rincian hasil untuk seluruh putaran tes {modeLabel.toLowerCase()}.</p>

          <div className="mt-5 space-y-3">
            {data.sessions.map((session) => {
              const sessionScore = Math.round(session.score ?? 0);
              const sessionTone = scoreTone(sessionScore);
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">Sesi {session.sessionIndex}</p>
                      <p className="text-sm text-slate-500">
                        {session.correctCount}/{session.totalQuestions} benar
                      </p>
                    </div>
                    <p className="text-3xl font-extrabold tabular-nums text-slate-900">{sessionScore}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={cn('h-full rounded-full transition-all', sessionTone.bar)}
                      style={{ width: `${Math.min(100, Math.max(0, sessionScore))}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.sessions.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Belum ada data sesi.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
