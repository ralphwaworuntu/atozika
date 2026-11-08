import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Target, Trophy } from 'lucide-react';
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

type PracticeHistoryItem = {
  id: string;
  score: number | null;
  createdAt: string;
  completedAt?: string | null;
  set?: {
    title?: string;
    durationMinutes?: number;
    totalQuestions?: number;
    subSubCategory?: {
      name?: string;
      subCategory?: { name?: string; category?: { name?: string } };
    };
  };
};

const STATUS_FILTERS = ['Semua', 'Lulus', 'Perlu Peningkatan'] as const;

export function PracticeHistoryPage() {
  const membership = useMembershipStatus();
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
  const [status, setStatus] = useState<string>('Semua');
  const [topic, setTopic] = useState('Semua');
  const { data, isLoading } = useQuery({
    queryKey: ['practice-history'],
    queryFn: () => apiGet<PracticeHistoryItem[]>('/exams/practice-history'),
    enabled: Boolean(membership.data?.isActive),
  });

  const rows = useMemo(() => {
    return (data ?? []).map((item) => {
      const score = roundedScore(item.score);
      const category = item.set?.subSubCategory?.subCategory?.category?.name ?? 'Latihan';
      const sub = item.set?.subSubCategory?.subCategory?.name;
      const leaf = item.set?.subSubCategory?.name;
      const path = [sub, leaf].filter(Boolean).join(' • ');
      const icon = topicByName(category)?.icon ?? topicByName(item.set?.title)?.icon ?? '/covers/cover-notes.jpg';
      const facts = [
        { label: 'Tanggal', value: formatHistoryDate(item.completedAt ?? item.createdAt) },
        { label: 'Kategori', value: category },
        { label: 'Jumlah soal', value: String(item.set?.totalQuestions ?? 0) },
        { label: 'Durasi', value: item.set?.durationMinutes ? `${item.set.durationMinutes} menit` : 'Tanpa batas waktu' },
      ];
      return {
        score,
        category,
        passed: score != null && score >= 70,
        entry: {
          id: item.id,
          title: item.set?.title || 'Paket latihan',
          subtitle: path ? `${category} • ${path}` : category,
          meta: facts.map((fact) => fact.value).join(' '),
          facts,
          icon,
          score,
          href: `/app/latihan-soal/review/${item.id}`,
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

  if (membership.isLoading || (membership.data?.isActive && (isLoading || !data))) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  if (membership.data?.allowPractice === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan soal. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Riwayat Latihan"
        description="Semua paket soal yang sudah dikerjakan, diurutkan dari sesi terbaru."
        searchPlaceholder="Cari judul atau topik latihan..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <HistoryStatGrid
          items={[
            { icon: <BookOpen className="h-5 w-5" />, tone: 'bg-rose-50 text-rose-600', label: 'Paket Selesai', value: String(rows.length), hint: rows.length ? 'Paket dikerjakan' : 'Belum ada paket' },
            { icon: <Target className="h-5 w-5" />, tone: 'bg-sky-50 text-sky-600', label: 'Rata-rata Skor', value: String(averageScore(scores) ?? 0), hint: rows.length ? 'Dari seluruh paket' : 'Menunggu latihan pertama' },
            { icon: <Trophy className="h-5 w-5" />, tone: 'bg-amber-50 text-amber-600', label: 'Skor Tertinggi', value: String(best?.score ?? 0), hint: best?.entry.title ?? 'Belum ada nilai' },
            { icon: <Award className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600', label: 'Paket Lulus', value: String(rows.filter((row) => row.passed).length), hint: 'Ambang skor 70' },
          ]}
        />
        <BestScoreCard
          label="Paket terbaik"
          name={best?.entry.title}
          score={best?.score ?? null}
          note="Skor 70 ke atas dihitung lulus. Ulangi paket di bawah ambang untuk menaikkan rata-rata."
        />
      </div>

      <div className="space-y-2">
        <FilterPills items={STATUS_FILTERS} value={status} onChange={setStatus} />
        {topics.length > 2 ? <FilterPills items={topics} value={topic} onChange={setTopic} /> : null}
      </div>

      <HistoryResults
        layout={layout}
        entries={filtered.map((row) => row.entry)}
        emptyTitle={rows.length ? 'Tidak ada latihan yang cocok' : 'Belum ada riwayat latihan'}
        emptyText={
          rows.length
            ? 'Ubah kata kunci atau filter untuk melihat paket lain.'
            : 'Kerjakan satu paket latihan soal supaya skor dan pembahasannya tersimpan di sini.'
        }
        emptyHref="/app/latihan-soal"
        emptyAction="Mulai Latihan"
      />
    </div>
  );
}
