import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Search } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { PracticeCategory } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/utils/cn';
import { exampleCover } from '@/lib/exampleCovers';

export function PracticeSetsPage() {
  const navigate = useNavigate();
  const { categorySlug, subCategoryId, subSubId } = useParams<{
    categorySlug: string;
    subCategoryId: string;
    subSubId: string;
  }>();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { data: categories, isLoading } = useQuery({
    queryKey: ['practice-categories'],
    queryFn: () => apiGet<PracticeCategory[]>('/exams/practice/categories'),
  });

  const selection = useMemo(() => {
    const category = categories?.find((item) => item.slug === categorySlug) ?? null;
    const subCategory = category?.subCategories.find((sub) => sub.id === subCategoryId) ?? null;
    const subSub = subCategory?.subSubs.find((item) => item.id === subSubId) ?? null;
    return { category, subCategory, subSub };
  }, [categories, categorySlug, subCategoryId, subSubId]);

  const visible = useMemo(() => {
    const items = selection.subSub?.sets ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.title.toLowerCase().includes(term));
  }, [query, selection.subSub]);

  if (membership.isLoading || isLoading || !categories) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowPractice === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan soal. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (!selection.category || !selection.subCategory || !selection.subSub) {
    return <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Paket soal tidak ditemukan.</div>;
  }

  const { category, subCategory, subSub } = selection;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{subSub.name}</h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{category.name} / {subCategory.name}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari latihan"
              className="w-full rounded-lg border-0 bg-slate-100/80 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none ring-member-600 placeholder:text-slate-400 focus:bg-white focus:ring-1 dark:bg-white/5 dark:text-ink-50 dark:focus:bg-ink-800"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
            <button type="button" title="Tampilan kisi" onClick={() => setLayout('grid')} className={cn('rounded-md p-1.5', layout === 'grid' ? 'bg-[#1B3A4B] text-white shadow-sm' : 'text-slate-500')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="Tampilan daftar" onClick={() => setLayout('list')} className={cn('rounded-md p-1.5', layout === 'list' ? 'bg-[#1B3A4B] text-white shadow-sm' : 'text-slate-500')}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/latihan-soal/kategori/${category.slug}/sub/${subCategory.id}`)}
            className="inline-flex items-center rounded-full bg-member-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-member-700 active:scale-95"
          >
            Kembali
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Belum ada paket soal di kategori ini.</div>
      ) : (
        <div className={cn('grid gap-5', layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
          {visible.map((set, index) => {
            const cover = getAssetUrl(set.coverImageUrl) || getAssetUrl(subSub.imageUrl);
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => navigate(`/app/latihan-soal/detail/${set.slug}`)}
                className={cn('member-card group overflow-hidden text-left transition hover:shadow-md', layout === 'list' && 'flex items-stretch')}
              >
                <div className={cn('relative overflow-hidden', layout === 'grid' ? 'h-32' : 'h-24 w-36 shrink-0')}>
                  <img src={cover || exampleCover(index)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="p-4 pb-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{subCategory.name}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-ink-50">{set.title}</h3>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 pb-3.5 text-[11px] font-semibold text-slate-400">
                    <span>{set.totalQuestions} soal • {set.durationMinutes} menit</span>
                    <span className={set.isFree ? 'text-emerald-600' : 'text-slate-400'}>{set.isFree ? 'Gratis' : 'Paket'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
