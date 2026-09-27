import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Search } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { Tryout } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { buildTryoutDisplayItems } from '@/utils/tryoutPackage';
import { cn } from '@/utils/cn';

const COVERS = ['bg-[#FDEAE2]', 'bg-[#E1F7F3]', 'bg-[#F0EAFB]', 'bg-[#FCF5E3]', 'bg-[#F1F9F0]', 'bg-[#EDF3FC]'];

export function TryoutListPage() {
  const navigate = useNavigate();
  const { categoryId, subCategoryId } = useParams<{ categoryId: string; subCategoryId: string }>();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const { data: tryouts, isLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => apiGet<Tryout[]>('/exams/tryouts'),
  });
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const listing = useMemo(() => {
    if (!tryouts || !categoryId || !subCategoryId) return null;
    const items = tryouts.filter((item) => item.subCategory.id === subCategoryId);
    const displayItems = buildTryoutDisplayItems(items);
    const categoryName = items[0]?.subCategory.category.name ?? '';
    const subCategoryName = items[0]?.subCategory.name ?? '';
    return { items: displayItems, categoryName, subCategoryName };
  }, [categoryId, subCategoryId, tryouts]);

  const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('id-ID') : null);
  const getScheduleText = (tryout: { openAt?: string | null; closeAt?: string | null }) => {
    const start = formatDateTime(tryout.openAt);
    const end = formatDateTime(tryout.closeAt);
    if (!start && !end) {
      return 'Tersedia sepanjang waktu';
    }
    return `${start ?? 'Segera'} - ${end ?? 'Tanpa batas'}`;
  };
  const getScheduleStatus = (tryout: { openAt?: string | null; closeAt?: string | null }) => {
    const now = nowTs;
    if (tryout.openAt && new Date(tryout.openAt).getTime() > now) {
      return { active: false, label: `Dibuka ${formatDateTime(tryout.openAt)}` };
    }
    if (tryout.closeAt && new Date(tryout.closeAt).getTime() < now) {
      return { active: false, label: 'Periode tryout berakhir' };
    }
    return { active: true, label: 'Sedang dibuka' };
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (membership.isLoading) {
    return <Skeleton className="h-72" />;
  }

  const visibleItems = (listing?.items ?? []).filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (hasActiveMembership && membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (isLoading || !tryouts) {
    return <Skeleton className="h-72" />;
  }

  if (!listing) {
    return <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Sub kategori tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{listing.subCategoryName}</h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{listing.categoryName}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tryout"
              className="w-full rounded-lg border-0 bg-slate-100/80 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none ring-member-600 placeholder:text-slate-400 focus:bg-white focus:ring-1 dark:bg-white/5 dark:text-ink-50 dark:focus:bg-ink-800"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
            <button
              type="button"
              title="Tampilan kisi"
              onClick={() => setLayout('grid')}
              className={cn('rounded-md p-1.5', layout === 'grid' ? 'bg-[#1B3A4B] text-white shadow-sm' : 'text-slate-500')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Tampilan daftar"
              onClick={() => setLayout('list')}
              className={cn('rounded-md p-1.5', layout === 'list' ? 'bg-[#1B3A4B] text-white shadow-sm' : 'text-slate-500')}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/latihan/tryout/kategori/${categoryId}`)}
            className="inline-flex items-center rounded-full bg-member-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-member-700 active:scale-95"
          >
            Kembali
          </button>
        </div>
      </div>

      {!hasActiveMembership ? (
        <p className="text-xs font-semibold text-slate-500">
          Kamu belum memiliki paket aktif. Daftar tryout tetap bisa dilihat, tetapi hanya tryout gratis yang bisa dikerjakan.
        </p>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Belum ada tryout di sub kategori ini.</div>
      ) : (
        <div className={cn('grid gap-5', layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
          {visibleItems.map((item, index) => {
            const status = getScheduleStatus(item);
            const cover = getAssetUrl(item.coverImageUrl) || getAssetUrl(item.subCategory.imageUrl);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/app/latihan/tryout/detail/${item.sessions[0]?.slug ?? item.slug}`)}
                className={cn(
                  'member-card group overflow-hidden text-left transition hover:shadow-md',
                  layout === 'list' && 'flex items-stretch',
                )}
              >
                <div className={cn('relative overflow-hidden', layout === 'grid' ? 'h-32' : 'h-24 w-36 shrink-0', !cover && COVERS[index % COVERS.length])}>
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-16 w-16 rounded-xl bg-white/80 shadow-sm" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="p-4 pb-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      {item.subCategory.category.name} / {item.subCategory.name}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-ink-50">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 pb-3.5 text-[11px] font-semibold text-slate-400">
                    <span className={status.active ? 'text-emerald-600' : 'text-rose-500'}>{status.label}</span>
                    <span>{item.isFree ? 'Gratis' : item.isPackage ? 'Paket' : getScheduleText(item)}</span>
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
