import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ClipboardList, Target, Trophy } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { topicByName } from '@/constants/learningCatalog';
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

type TryoutHistoryItem = {
  id: string;
  score: number | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  tryout: {
    name: string;
    durationMinutes?: number;
    totalQuestions?: number;
    sessionOrder?: number | null;
    subCategory?: { name: string; category?: { name: string } };
  };
};

const STATUS_FILTERS = ['Semua', 'Lulus', 'Perlu Peningkatan'] as const;

function minutesLabel(item: TryoutHistoryItem) {
  if (item.durationSeconds && item.durationSeconds > 0) return `${Math.max(1, Math.round(item.durationSeconds / 60))} menit`;
  if (item.tryout.durationMinutes) return `${item.tryout.durationMinutes} menit`;
  return 'Durasi tidak tercatat';
}

export function TryoutHistoryPage() {
  const membership = useMembershipStatus();
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
  const [status, setStatus] = useState<string>('Semua');
  const [topic, setTopic] = useState('Semua');
  const { data, isLoading } = useQuery({
    queryKey: ['tryout-history'],
    queryFn: () => apiGet<TryoutHistoryItem[]>('/exams/tryouts-history'),
    enabled: Boolean(membership.data?.isActive),
  });

  const rows = useMemo(() => {
    return (data ?? []).map((item) => {
      const score = roundedScore(item.score);
      const category = item.tryout.subCategory?.category?.name ?? 'Tryout';
      const sub = item.tryout.subCategory?.name;
      const icon = topicByName(category)?.icon ?? topicByName(item.tryout.name)?.icon ?? '/covers/cover-quiz.jpg';
      const facts = [
        { label: 'Tanggal', value: formatHistoryDate(item.completedAt ?? item.startedAt ?? item.createdAt) },
        { label: 'Kategori', value: category },
        { label: 'Jumlah soal', value: String(item.tryout.totalQuestions ?? 0) },
        { label: 'Durasi', value: minutesLabel(item) },
      ];
      return {
        item,
        score,
        category,
        passed: score != null && score >= 70,
        entry: {
          id: item.id,
          title: item.tryout.sessionOrder ? `${item.tryout.name} · Sesi ${item.tryout.sessionOrder}` : item.tryout.name,
          subtitle: sub ? `${category} • ${sub}` : category,
          meta: facts.map((fact) => fact.value).join(' '),
          facts,
          icon,
          score,
          href: `/app/latihan/tryout/review/${item.id}`,
          action: 'Lihat Pembahasan',
        } satisfies HistoryEntry,
      };
    });
  }, [data]);

  const topics = useMemo(() => ['Semua', ...Array.from(new Set(rows.map((row) => row.category)))], [rows]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (topic !== 'Semua' && row.category !== topic) return false;
      if (status === 'Lulus' && !row.passed) return false;
      if (status === 'Perlu Peningkatan' && row.passed) return false;
      if (!term) return true;
      return `${row.entry.title} ${row.entry.subtitle}`.toLowerCase().includes(term);
    });
  }, [query, rows, status, topic]);

  const scores = rows.map((row) => row.score);
  const best = rows.reduce<(typeof rows)[number] | undefined>((top, row) => {
    if (row.score == null) return top;
    if (!top || (top.score ?? -1) < row.score) return row;
    return top;
  }, undefined);
  const passedCount = rows.filter((row) => row.passed).length;

  if (membership.isLoading || (membership.data?.isActive && (isLoading || !data))) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  if (membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Riwayat Tryout"
        description="Rekap simulasi CAT yang sudah kamu selesaikan, lengkap dengan skor dan pembahasan."
        searchPlaceholder="Cari judul atau kategori tryout..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <HistoryStatGrid
          items={[
            { icon: <ClipboardList className="h-5 w-5" />, tone: 'bg-blue-50 text-blue-600', label: 'Total Sesi', value: String(rows.length), hint: rows.length ? 'Sesi selesai' : 'Belum ada sesi' },
            { icon: <Target className="h-5 w-5" />, tone: 'bg-sky-50 text-sky-600', label: 'Rata-rata Skor', value: String(averageScore(scores) ?? 0), hint: rows.length ? 'Dari seluruh sesi' : 'Menunggu sesi pertama' },
            { icon: <Trophy className="h-5 w-5" />, tone: 'bg-amber-50 text-amber-600', label: 'Skor Tertinggi', value: String(best?.score ?? 0), hint: best?.entry.title ?? 'Belum ada nilai' },
            { icon: <Award className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600', label: 'Sesi Lulus', value: String(passedCount), hint: 'Ambang skor 70' },
          ]}
        />
        <BestScoreCard
          label="Skor terbaik"
          name={best?.entry.title}
          score={best?.score ?? null}
          note="Ambang lulus 70. Buka pembahasan untuk melihat soal yang masih lemah."
        />
      </div>

      <div className="space-y-2">
        <FilterPills items={STATUS_FILTERS} value={status} onChange={setStatus} />
        {topics.length > 2 ? <FilterPills items={topics} value={topic} onChange={setTopic} /> : null}
      </div>

      <HistoryResults
        layout={layout}
        entries={filtered.map((row) => row.entry)}
        emptyTitle={rows.length ? 'Tidak ada tryout yang cocok' : 'Belum ada riwayat tryout'}
        emptyText={
          rows.length
            ? 'Ubah kata kunci atau filter untuk melihat sesi lain.'
            : 'Selesaikan satu paket tryout untuk melihat skor, status kelulusan, dan pembahasannya di sini.'
        }
        emptyHref="/app/latihan/tryout"
        emptyAction="Mulai Tryout"
      />
    </div>
  );
}
