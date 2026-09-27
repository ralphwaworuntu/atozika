import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Search } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { Tryout } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/utils/cn';

const COVERS = ['bg-[#FDEAE2]', 'bg-[#E1F7F3]', 'bg-[#F0EAFB]', 'bg-[#FCF5E3]', 'bg-[#F1F9F0]', 'bg-[#EDF3FC]', 'bg-[#FDF0EE]', 'bg-[#FFF8E6]'];

const EXAMPLE_CATEGORIES = [
  { name: 'Tes Masuk TNI', subs: 2, packs: 4 },
  { name: 'Sekolah Kedinasan', subs: 3, packs: 6 },
  { name: 'BUMN', subs: 2, packs: 3 },
  { name: 'Psikotes', subs: 1, packs: 5 },
  { name: 'Samapta Jasmani', subs: 2, packs: 2 },
  { name: 'TWK dan TIU', subs: 4, packs: 8 },
  { name: 'Tes Kecermatan', subs: 1, packs: 3 },
];

export function TryoutCategoriesPage() {
  const navigate = useNavigate();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { data: tryouts, isLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => apiGet<Tryout[]>('/exams/tryouts'),
  });

  const categoryGroups = useMemo(() => {
    if (!tryouts) return [];
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        thumbnail?: string | null;
        subCategories: Array<{ id: string; name: string; tryouts: Tryout[] }>;
      }
    >();
    tryouts.forEach((item) => {
      const category = item.subCategory.category;
      if (!map.has(category.id)) {
        map.set(category.id, { id: category.id, name: category.name, thumbnail: category.thumbnail ?? null, subCategories: [] });
      }
      const group = map.get(category.id)!;
      let subGroup = group.subCategories.find((sub) => sub.id === item.subCategory.id);
      if (!subGroup) {
        subGroup = { id: item.subCategory.id, name: item.subCategory.name, tryouts: [] };
        group.subCategories.push(subGroup);
      }
      subGroup.tryouts.push(item);
    });
    return Array.from(map.values());
  }, [tryouts]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categoryGroups;
    return categoryGroups.filter((category) => category.name.toLowerCase().includes(term));
  }, [categoryGroups, query]);

  const examples = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return EXAMPLE_CATEGORIES;
    return EXAMPLE_CATEGORIES.filter((item) => item.name.toLowerCase().includes(term));
  }, [query]);

  if (membership.isLoading || isLoading || !tryouts) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  const remaining = membership.data?.tryoutRemaining;
  const quotaLabel =
    remaining === null || remaining === undefined ? 'Tidak terbatas' : `${remaining} kali tersisa`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Tryout</h1>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kategori tryout"
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
            onClick={() => navigate('/app/latihan/tryout/riwayat')}
            className="inline-flex items-center rounded-full bg-member-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-member-700 active:scale-95"
          >
            Riwayat Tryout
          </button>
        </div>
      </div>

      {!hasActiveMembership ? (
        <p className="text-xs font-semibold text-slate-500">
          Kamu belum memiliki paket aktif. Daftar tryout tetap bisa dilihat, tetapi hanya tryout gratis yang bisa dikerjakan.
        </p>
      ) : null}

      <section className="grid items-stretch gap-4 md:grid-cols-2">
        <div className="member-card flex flex-col justify-center p-5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Kuota tryout</p>
          <p className="mt-1 text-xl font-extrabold text-member-600">{quotaLabel}</p>
          {typeof membership.data?.tryoutQuota === 'number' ? (
            <p className="text-[11px] font-semibold text-slate-400">
              Total {membership.data.tryoutQuota} • Terpakai {membership.data.tryoutUsed ?? 0}
            </p>
          ) : null}
        </div>
        <section className="member-card p-5 text-sm text-slate-600 dark:text-ink-200">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Aturan Anti-Cheat</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Informasi skema tryout</p>
          <ul className="mt-3 list-disc space-y-1 pl-4">
            <li>Tryout berjalan dalam mode layar penuh.</li>
            <li>Dilarang berpindah tab, mengecilkan layar, atau membuka aplikasi lain.</li>
            <li>Pelanggaran akan menghentikan sesi dan kuota tetap terhitung.</li>
          </ul>
        </section>
      </section>

      {visible.length === 0 && examples.length === 0 ? (
        <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Belum ada tryout yang tersedia.</div>
      ) : (
        <div className={cn('grid gap-5', layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
          {visible.map((category, index) => {
            const totalTryouts = category.subCategories.reduce((acc, subCategory) => acc + subCategory.tryouts.length, 0);
            const cover = getAssetUrl(category.thumbnail);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/app/latihan/tryout/kategori/${category.id}`)}
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
                  <h3 className="line-clamp-2 p-4 text-sm font-bold leading-snug text-slate-900 dark:text-ink-50">{category.name}</h3>
                  <div className="flex items-center justify-between px-4 pb-3.5 text-[11px] font-semibold text-slate-400">
                    <span>
                      {category.subCategories.length} sub kategori
                      <span className="mx-1.5 text-slate-300">•</span>
                      {totalTryouts} paket
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {examples.map((item, index) => (
            <article
              key={item.name}
              className={cn(
                'member-card group overflow-hidden text-left',
                layout === 'list' && 'flex items-stretch',
              )}
            >
              <div className={cn('relative overflow-hidden', layout === 'grid' ? 'h-32' : 'h-24 w-36 shrink-0', COVERS[(visible.length + index) % COVERS.length])}>
                <div className="flex h-full items-center justify-center">
                  <div className="h-16 w-16 rounded-xl bg-white/80 shadow-sm" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <h3 className="line-clamp-2 p-4 text-sm font-bold leading-snug text-slate-900 dark:text-ink-50">{item.name}</h3>
                <div className="flex items-center justify-between px-4 pb-3.5 text-[11px] font-semibold text-slate-400">
                  <span>
                    {item.subs} sub kategori
                    <span className="mx-1.5 text-slate-300">•</span>
                    {item.packs} paket
                  </span>
                  <span className="text-slate-300">Contoh</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
