import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gauge, ScanEye, Target, Trophy } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { CERMAT_MODE_LABELS, type CermatMode } from '@/types/cermat';
import { FilterPills, LearningPageHeader, type LearningLayout } from '@/components/dashboard/member/LearningPageHeader';
import {
  BestScoreCard,
  HistoryResults,
  HistoryStatGrid,
  averageScore,
  formatHistoryDate,
  roundedScore,
  type HistoryEntry,
} from '@/components/dashboard/member/HistoryBoard';

type CermatHistoryAttempt = {
  id: string;
  mode: CermatMode;
  totalSessions: number;
  sessionCount: number;
  averageScore: number;
  totalCorrect: number;
  totalQuestions: number;
  questionCount?: number;
  durationSeconds?: number;
  finishedAt?: string | null;
  startedAt: string;
};

const MODE_VISUAL: Record<string, { image: string; label: string }> = {
  IMAGE: { image: '/illustrations/cermat-gambar-hilang.jpg', label: CERMAT_MODE_LABELS.IMAGE },
  LETTER: { image: '/illustrations/cermat-huruf-hilang.jpg', label: CERMAT_MODE_LABELS.LETTER },
  NUMBER: { image: '/illustrations/cermat-angka-hilang.jpg', label: CERMAT_MODE_LABELS.NUMBER },
};

const FILTERS = ['Semua', CERMAT_MODE_LABELS.IMAGE, CERMAT_MODE_LABELS.LETTER, CERMAT_MODE_LABELS.NUMBER] as const;

export function CermatHistoryPage() {
  const membership = useMembershipStatus();
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
  const [filter, setFilter] = useState<string>('Semua');
  const { data, isLoading } = useQuery({
    queryKey: ['cermat-history'],
    queryFn: () => apiGet<CermatHistoryAttempt[]>('/exams/cermat/history'),
    enabled: Boolean(membership.data?.isActive),
  });

  const rows = useMemo(() => {
    return (data ?? []).map((item) => {
      const visual = MODE_VISUAL[item.mode] ?? { image: '/illustrations/icon-kecermatan.jpg', label: item.mode };
      const score = roundedScore(item.averageScore);
      const perSession = item.questionCount || (item.sessionCount ? Math.round(item.totalQuestions / item.sessionCount) : 0);
      const when = formatHistoryDate(item.finishedAt ?? item.startedAt);
      const facts = [
        { label: 'Tanggal', value: when },
        { label: 'Jawaban benar', value: `${item.totalCorrect}/${item.totalQuestions}` },
        { label: 'Soal per sesi', value: String(perSession || 0) },
        { label: 'Waktu sesi', value: item.durationSeconds ? `${item.durationSeconds} detik` : 'Tidak tercatat' },
      ];
      return {
        label: visual.label,
        score,
        correct: item.totalCorrect,
        entry: {
          id: item.id,
          title: visual.label,
          subtitle: `${item.sessionCount || item.totalSessions} sesi selesai`,
          meta: facts.map((fact) => fact.value).join(' '),
          facts,
          icon: visual.image,
          score,
          href: `/app/tes-kecermatan/hasil/${item.id}`,
          action: 'Lihat Skor',
        } satisfies HistoryEntry,
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== 'Semua' && row.label !== filter) return false;
      if (!term) return true;
      return `${row.entry.title} ${row.entry.meta}`.toLowerCase().includes(term);
    });
  }, [filter, query, rows]);

  const scores = rows.map((row) => row.score);
  const best = rows.reduce<(typeof rows)[number] | undefined>((top, row) => {
    if (row.score == null) return top;
    if (!top || (top.score ?? -1) < row.score) return row;
    return top;
  }, undefined);
  const totalCorrect = rows.reduce((sum, row) => sum + row.correct, 0);

  if (membership.isLoading || (membership.data?.isActive && (isLoading || !data))) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  if (membership.data?.allowCermat === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses tes kecermatan. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Riwayat Kecermatan"
        description="Rekap setiap paket tes kecermatan: kecepatan, ketepatan, dan skor rata-rata per sesi."
        searchPlaceholder="Cari varian tes..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <HistoryStatGrid
          items={[
            { icon: <ScanEye className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600', label: 'Paket Selesai', value: String(rows.length), hint: rows.length ? 'Paket kecermatan' : 'Belum ada paket' },
            { icon: <Target className="h-5 w-5" />, tone: 'bg-sky-50 text-sky-600', label: 'Rata-rata Akurasi', value: `${averageScore(scores) ?? 0}%`, hint: rows.length ? 'Dari seluruh paket' : 'Menunggu tes pertama' },
            { icon: <Trophy className="h-5 w-5" />, tone: 'bg-amber-50 text-amber-600', label: 'Akurasi Tertinggi', value: `${best?.score ?? 0}%`, hint: best?.entry.title ?? 'Belum ada nilai' },
            { icon: <Gauge className="h-5 w-5" />, tone: 'bg-violet-50 text-violet-600', label: 'Jawaban Benar', value: String(totalCorrect), hint: rows.length ? 'Seluruh sesi' : 'Belum ada jawaban' },
          ]}
        />
        <BestScoreCard
          label="Paket paling akurat"
          name={best ? `${best.entry.title} • ${best.entry.subtitle}` : undefined}
          score={best?.score ?? null}
          note="Skor adalah rata-rata ketepatan seluruh sesi dalam satu paket."
        />
      </div>

      <FilterPills items={FILTERS} value={filter} onChange={setFilter} />

      <HistoryResults
        layout={layout}
        entries={filtered.map((row) => row.entry)}
        emptyTitle={rows.length ? 'Tidak ada tes yang cocok' : 'Belum ada riwayat kecermatan'}
        emptyText={
          rows.length
            ? 'Pilih varian lain atau kosongkan pencarian.'
            : 'Selesaikan satu paket tes kecermatan untuk melihat akurasi tiap sesi di halaman ini.'
        }
        emptyHref="/app/tes-kecermatan"
        emptyAction="Mulai Tes Kecermatan"
      />
    </div>
  );
}
