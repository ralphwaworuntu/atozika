import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { PracticeSetInfo } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { exampleCover } from '@/lib/exampleCovers';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('id-ID') : '-';
}

function getScheduleStatus(openAt?: string | null, closeAt?: string | null) {
  const now = Date.now();
  if (openAt && new Date(openAt).getTime() > now) {
    return { canStart: false, label: `Dibuka ${formatDateTime(openAt)}` };
  }
  if (closeAt && new Date(closeAt).getTime() < now) {
    return { canStart: false, label: 'Periode latihan berakhir' };
  }
  return { canStart: true, label: 'Sedang dibuka' };
}

export function PracticeDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const { data, isLoading } = useQuery({
    queryKey: ['practice-detail', slug],
    queryFn: () => apiGet<PracticeSetInfo>(`/exams/practice/${slug}/info`),
    enabled: Boolean(slug),
  });
  const returnTo = data
    ? `/app/latihan-soal/kategori/${data.subSubCategory.subCategory.category.slug}/sub/${data.subSubCategory.subCategory.id}/subsub/${data.subSubCategory.id}`
    : '/app/latihan-soal';

  const status = useMemo(() => getScheduleStatus(data?.openAt, data?.closeAt), [data?.closeAt, data?.openAt]);

  if (membership.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowPractice === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan soal. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-72" />;
  }

  const infoItems = [
    { label: 'Peminatan', value: data.subSubCategory.subCategory.category.name },
    { label: 'Kategori Mata Pelajaran', value: data.subSubCategory.subCategory.name },
    { label: 'Mata Pelajaran', value: data.subSubCategory.name },
    { label: 'Judul Latihan Soal', value: data.title },
    { label: 'Jumlah Soal', value: String(data.totalQuestions) },
    { label: 'Durasi', value: `${data.durationMinutes} menit` },
    { label: 'Akses Gratis', value: data.isFree ? 'Ya' : 'Tidak' },
    { label: 'Waktu Akses Mulai Latihan', value: formatDateTime(data.openAt) },
    { label: 'Waktu Akses Berakhir Latihan', value: formatDateTime(data.closeAt) },
  ];

  const handleStart = () => {
    if (!hasActiveMembership && !data.isFree) {
      toast.error('Aktifkan paket untuk mulai latihan.');
      return;
    }
    sessionStorage.setItem('practice_start_slug', data.slug);
    navigate('/app/latihan-soal/mulai', {
      state: { startPractice: { slug: data.slug }, returnTo },
    });
  };

  const cover = getAssetUrl(data.coverImageUrl);
  const canStart = status.canStart && (hasActiveMembership || data.isFree);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{data.title}</h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {data.subSubCategory.subCategory.category.name} / {data.subSubCategory.subCategory.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="inline-flex items-center rounded-full bg-member-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-member-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.canStart ? 'Mulai Latihan' : status.label}
          </button>
        </div>
      </div>

      <article className="member-card overflow-hidden">
        <div className="relative h-40 overflow-hidden sm:h-52">
          <img src={cover || exampleCover(1)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="space-y-4 p-5">
          <p className={cn('text-[11px] font-semibold', status.canStart ? 'text-emerald-600' : 'text-rose-500')}>{status.label}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infoItems.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-ink-50">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
