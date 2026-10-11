import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CircleCheck, ClipboardList, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import type { PracticeCategory } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/utils/cn';
import { LEARNING_TOPICS, topicByName } from '@/constants/learningCatalog';
import { FilterPills, LearningPageHeader, StatItem, type LearningLayout } from '@/components/dashboard/member/LearningPageHeader';

const FILTERS = ['Semua', 'TNI', 'POLRI', 'Kedinasan', 'BUMN', 'Umum'] as const;

export function PracticeCategoriesPage() {
  const navigate = useNavigate();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
  const [filter, setFilter] = useState<string>('Semua');
  const { data: categories, isLoading } = useQuery({
    queryKey: ['practice-categories'],
    queryFn: () => apiGet<PracticeCategory[]>('/exams/practice/categories'),
  });

  const cards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return LEARNING_TOPICS.map((topic) => {
      const real = categories?.find((category) => topicByName(category.name)?.key === topic.key);
      const sets = real?.subCategories.flatMap((sub) => sub.subSubs.flatMap((subSub) => subSub.sets)) ?? [];
      return {
        topic,
        slug: real?.slug,
        soal: sets.length ? sets.reduce((sum, set) => sum + set.totalQuestions, 0) : topic.practice.soal,
        paket: sets.length || topic.practice.paket,
      };
    }).filter(({ topic }) => {
      if (filter !== 'Semua' && !topic.practice.groups.includes(filter)) return false;
      return !term || topic.name.toLowerCase().includes(term);
    });
  }, [categories, filter, query]);

  if (membership.isLoading || isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowPractice === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan soal. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Latihan Soal"
        description="Pilih kategori latihan sesuai targetmu dan tingkatkan kemampuan dengan ribuan soal."
        searchPlaceholder="Cari kategori latihan..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section className="member-card grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <StatItem icon={<FileText className="h-5 w-5" />} tone="bg-blue-50 text-blue-600" value="1.248" label="Total Soal Tersedia" />
          <StatItem icon={<ClipboardList className="h-5 w-5" />} tone="bg-sky-50 text-sky-600" value="5" label="Kategori Latihan" />
          <StatItem icon={<Package className="h-5 w-5" />} tone="bg-rose-50 text-rose-600" value="12" label="Paket Soal" />
          <StatItem icon={<CircleCheck className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-600" value="78%" label="Rata-rata Skor" />
        </section>
        <section className="member-card flex flex-col justify-center p-4">
          <p className="text-[11px] font-medium text-slate-500">Target Mingguan</p>
          <p className="mt-0.5 text-sm font-extrabold text-member-600">6 dari 10 sesi</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full w-[60%] rounded-full bg-member-600" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-ink-100">60%</span>
          </div>
        </section>
      </div>

      <FilterPills items={FILTERS} value={filter} onChange={setFilter} />

      {cards.length === 0 ? (
        <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Kategori latihan tidak ditemukan.</div>
      ) : (
        <div className={cn('grid gap-4', layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1')}>
          {cards.map(({ topic, slug, soal, paket }) => (
            <article
              key={topic.key}
              className={cn(
                'overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-white/5 dark:to-white/5',
                topic.tint,
                layout === 'list' && 'flex items-center',
              )}
            >
              <div className={cn('p-4 pb-3', layout === 'list' && 'w-56 shrink-0')}>
                <img src={topic.icon} alt="" className="h-14 w-14 rounded-full object-contain mix-blend-multiply" />
                <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-ink-50">{topic.name}</h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-ink-200">
                  {soal} soal <span className="mx-1">•</span> {paket} paket
                </p>
              </div>
              <div className={cn('space-y-3 bg-white/70 p-4 pt-3 dark:bg-transparent', layout === 'list' && 'flex flex-1 items-center gap-4 space-y-0')}>
                <p className="min-h-[2.25rem] flex-1 text-xs font-medium text-slate-600 dark:text-ink-200">{topic.practice.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (slug) navigate(`/app/latihan-soal/kategori/${slug}`);
                    else toast.message(`Latihan ${topic.name} segera tersedia.`);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-member-600 transition hover:bg-blue-100 dark:bg-white/10',
                    layout === 'grid' ? 'w-full' : 'shrink-0',
                  )}
                >
                  Mulai Latihan <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
