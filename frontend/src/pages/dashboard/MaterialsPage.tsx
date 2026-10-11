import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { Material } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { cn } from '@/utils/cn';
import { MATERIAL_TYPE_LABELS } from '@/constants/materials';
import { LEARNING_TOPICS, topicByName } from '@/constants/learningCatalog';
import { FilterPills, LearningPageHeader, type LearningLayout } from '@/components/dashboard/member/LearningPageHeader';

const FILTERS = ['Semua', ...LEARNING_TOPICS.map((topic) => topic.name)] as const;

const EXAMPLE_LATEST = [
  { title: 'Pancasila dan UUD 1945', meta: 'TWK • 12 halaman', topic: 'TWK' },
  { title: 'Deret Angka', meta: 'TIU • 8 halaman', topic: 'TIU' },
  { title: 'Manajemen Waktu', meta: 'TKP • 10 halaman', topic: 'TKP' },
  { title: 'Psikotes Gambar', meta: 'Kecermatan • 6 halaman', topic: 'Tes Kecermatan' },
];

export function MaterialsPage() {
  const membership = useMembershipStatus();
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
  const [filter, setFilter] = useState<string>('Semua');
  const [showAll, setShowAll] = useState(false);
  const categorySectionRef = useRef<HTMLElement>(null);
  const latestSectionRef = useRef<HTMLElement>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', 'all'],
    queryFn: () => apiGet<Material[]>('/materials'),
    enabled: Boolean(membership.data?.isActive),
  });

  const term = query.trim().toLowerCase();

  const categoryCards = useMemo(
    () =>
      LEARNING_TOPICS.filter((topic) => (filter === 'Semua' || topic.name === filter) && (!term || topic.name.toLowerCase().includes(term))).map(
        (topic) => {
          const realCount = (materials ?? []).filter((item) => topicByName(item.category)?.key === topic.key).length;
          return { topic, count: realCount || topic.material.count };
        },
      ),
    [filter, materials, term],
  );

  const latest = useMemo(() => {
    const real = (materials ?? [])
      .filter((item) => filter === 'Semua' || topicByName(item.category)?.name === filter)
      .filter((item) => !term || item.title.toLowerCase().includes(term))
      .map((item) => ({
        key: item.id,
        title: item.title,
        meta: `${item.category} • ${MATERIAL_TYPE_LABELS[item.type]}`,
        icon: topicByName(item.category)?.icon ?? '/illustrations/icon-twk.jpg',
        href: item.fileUrl as string | undefined,
      }));
    if (real.length) return real;
    return EXAMPLE_LATEST.filter((item) => filter === 'Semua' || item.topic === filter)
      .filter((item) => !term || item.title.toLowerCase().includes(term))
      .map((item) => ({
        key: item.title,
        title: item.title,
        meta: item.meta,
        icon: topicByName(item.topic)?.icon ?? LEARNING_TOPICS[0].icon,
        href: undefined as string | undefined,
      }));
  }, [filter, materials, term]);

  if (membership.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  const visibleLatest = showAll ? latest : latest.slice(0, 4);

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Materi Belajar"
        description="Pelajari materi secara terstruktur dengan ringkasan, contoh soal, dan pembahasan lengkap."
        searchPlaceholder="Cari materi..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <FilterPills items={FILTERS} value={filter} onChange={setFilter} />

      <section className="flex flex-col items-start gap-4 rounded-2xl border border-amber-100 bg-gradient-to-r from-[#FFF3E2] via-[#FDEBD5] to-[#FBE4C8] p-4 sm:flex-row sm:items-center dark:border-amber-500/20 dark:from-amber-950/40 dark:via-ink-800 dark:to-amber-950/30">
        <img src="/covers/cover-study.jpg" alt="" className="h-20 w-36 shrink-0 rounded-xl object-cover mix-blend-multiply dark:mix-blend-normal" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-ink-50">Belajar Lebih Terstruktur</h2>
          <p className="mt-1 max-w-md text-xs font-medium text-slate-600 dark:text-ink-200">
            Materi disusun oleh tim ahli dengan pembahasan yang mudah dipahami dan update sesuai standar seleksi terbaru.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const first = latest.find((item) => item.href);
            if (first?.href) window.open(first.href, '_blank', 'noreferrer');
            else categorySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#8A5A1E] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#744a17]"
        >
          Lanjut Belajar <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      <section ref={categorySectionRef} className="member-card space-y-4 p-5">
        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Pilih Kategori Materi</h2>
        {categoryCards.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">Kategori materi tidak ditemukan.</p>
        ) : (
          <div className={cn('grid gap-3', layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1')}>
            {categoryCards.map(({ topic, count }) => (
              <article
                key={topic.key}
                className={cn('rounded-2xl border border-slate-100 bg-gradient-to-br p-3 dark:border-white/10 dark:from-white/5 dark:to-white/5', topic.tint)}
              >
                <div className="flex items-center gap-3">
                  <img src={topic.icon} alt="" className="h-12 w-12 shrink-0 rounded-full object-contain mix-blend-multiply" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-ink-50">{topic.name}</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-ink-200">{count} materi</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white dark:bg-white/10">
                    <div className={cn('h-full rounded-full', topic.bar)} style={{ width: `${topic.material.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{topic.material.progress}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilter(topic.name);
                    latestSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-member-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-ink-800"
                >
                  Lihat Materi <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section ref={latestSectionRef} className="member-card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Materi Terbaru</h2>
          {latest.length > 4 ? (
            <button type="button" onClick={() => setShowAll((value) => !value)} className="text-xs font-bold text-member-600 hover:text-member-700">
              {showAll ? 'Tampilkan Sedikit' : 'Lihat Semua'}
            </button>
          ) : (
            <span className="text-xs font-bold text-member-600">Lihat Semua</span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : visibleLatest.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">Belum ada materi pada kategori ini.</p>
        ) : (
          <div className={cn('grid gap-3', layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1')}>
            {visibleLatest.map((item) => {
              const content = (
                <>
                  <img src={item.icon} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain mix-blend-multiply" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-800 dark:text-ink-50">{item.title}</p>
                    <p className="truncate text-[10px] font-medium text-slate-400">{item.meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </>
              );
              const className =
                'flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition hover:shadow-sm dark:border-white/10 dark:bg-ink-800';
              return item.href ? (
                <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <div key={item.key} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
