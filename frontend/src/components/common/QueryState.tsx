import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  skeletonClassName = 'h-72',
  error = 'Gagal memuat data. Coba muat ulang halaman.',
  empty = 'Belum ada data.',
  children,
}: {
  isLoading: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  skeletonClassName?: string;
  error?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) {
    return <Skeleton className={skeletonClassName} />;
  }
  if (isError) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-rose-600 dark:text-rose-300">
        {error}
      </section>
    );
  }
  if (isEmpty) {
    return <section className="member-card p-6 text-sm font-semibold text-slate-400">{empty}</section>;
  }
  return children;
}
