import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { Material } from '@/types/exam';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { PageHeader } from '@/components/common/PageHeader';
import { MATERIAL_CATEGORIES, MATERIAL_TYPE_LABELS } from '@/constants/materials';

const typeFilters = ['', 'PDF', 'VIDEO', 'LINK'] as const;

export function MaterialsPage() {
  const [category, setCategory] = useState<string>('');
  const [type, setType] = useState<(typeof typeFilters)[number]>('');
  const membership = useMembershipStatus();
  const categoriesQuery = useQuery({
    queryKey: ['material-categories'],
    queryFn: () => apiGet<{ categories: string[] }>('/materials/categories'),
    enabled: Boolean(membership.data?.isActive),
  });
  const assignedCategories = useMemo(() => {
    const allowed = new Set(categoriesQuery.data?.categories ?? []);
    return MATERIAL_CATEGORIES.filter((item) => allowed.has(item));
  }, [categoriesQuery.data?.categories]);

  useEffect(() => {
    if (category && !assignedCategories.includes(category as (typeof MATERIAL_CATEGORIES)[number])) {
      setCategory('');
    }
  }, [assignedCategories, category]);

  const { data, isLoading } = useQuery({
    queryKey: ['materials', category, type],
    queryFn: () => apiGet<Material[]>('/materials', { params: { category: category || undefined, type: type || undefined } }),
    enabled: Boolean(membership.data?.isActive) && assignedCategories.length > 0,
  });

  if (membership.isLoading || categoriesQuery.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  return (
    <section className="page-shell space-y-5">
      <PageHeader
        eyebrow="Modul & Materi"
        title="Materi Belajar"
        description="Kategori yang tampil adalah kategori yang sudah dipilih admin untuk akun ini."
      />

      {assignedCategories.length === 0 ? (
        <div className="member-card p-8 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-ink-100">Belum ada kategori materi.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-ink-200">
            Materi muncul setelah admin memilih kategori untuk akun ini.
          </p>
        </div>
      ) : (
        <>
          <div className="member-card space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-ink-200">Kategori</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant={category === '' ? 'primary' : 'outline'} size="sm" onClick={() => setCategory('')}>
                  Semua
                </Button>
                {assignedCategories.map((item) => (
                  <Button
                    key={item}
                    variant={category === item ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-ink-200">Tipe</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {typeFilters.map((filter) => (
                  <Button
                    key={filter || 'ALL'}
                    variant={type === filter ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setType(filter)}
                  >
                    {filter ? MATERIAL_TYPE_LABELS[filter] : 'Semua'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {isLoading && <Skeleton className="h-72" />}

          {!isLoading && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(data ?? []).map((material) => (
                  <article key={material.id} className="member-card flex h-full flex-col p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                        {material.category}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(material.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-ink-50">{material.title}</h2>
                    <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-ink-200">{material.description}</p>
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-ink-900 dark:text-ink-100">
                      <span>Tipe materi</span>
                      <span>{MATERIAL_TYPE_LABELS[material.type]}</span>
                    </div>
                    <Button asChild variant="outline" className="mt-4">
                      <a href={material.fileUrl} target="_blank" rel="noreferrer">
                        {material.type === 'PDF' ? 'Buka PDF' : material.type === 'VIDEO' ? 'Tonton video' : 'Buka tautan'}
                      </a>
                    </Button>
                  </article>
                ))}
              </div>
              {(data ?? []).length === 0 && (
                <div className="member-card p-8 text-center text-sm text-slate-500 dark:text-ink-200">
                  Belum ada materi pada kategori ini.
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
