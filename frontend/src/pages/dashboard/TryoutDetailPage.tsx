import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { Tryout } from '@/types/exam';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { getPsikoSequenceBySubCategory, isPolriPsikoTryout } from '@/utils/tryoutPackage';
import { cn } from '@/utils/cn';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('id-ID') : '-';
}

function getScheduleStatus(openAt?: string | null, closeAt?: string | null) {
  const now = Date.now();
  if (openAt && new Date(openAt).getTime() > now) {
    return { canStart: false, label: `Dibuka ${formatDateTime(openAt)}` };
  }
  if (closeAt && new Date(closeAt).getTime() < now) {
    return { canStart: false, label: 'Periode tryout berakhir' };
  }
  return { canStart: true, label: 'Sedang dibuka' };
}

export function TryoutDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const membership = useMembershipStatus();
  const hasActiveMembership = Boolean(membership.data?.isActive);
  const { data, isLoading } = useQuery({
    queryKey: ['tryout-detail', slug],
    queryFn: () => apiGet<Tryout>(`/exams/tryouts/${slug}/info`),
    enabled: Boolean(slug),
  });
  const { data: allTryouts } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => apiGet<Tryout[]>('/exams/tryouts'),
    enabled: Boolean(slug),
  });
  const psikoSessions = useMemo(() => {
    if (!data || !allTryouts || !isPolriPsikoTryout(data)) return [];
    return getPsikoSequenceBySubCategory(allTryouts, data.subCategory.id);
  }, [allTryouts, data]);
  const isPsikoPackage = Boolean(data && isPolriPsikoTryout(data));
  const packageHeadTryout = psikoSessions[0] ?? data ?? null;
  const packageIsFree = isPsikoPackage
    ? (psikoSessions.length ? psikoSessions.every((item) => Boolean(item.isFree)) : Boolean(data?.isFree))
    : Boolean(data?.isFree);
  const status = useMemo(
    () => getScheduleStatus(packageHeadTryout?.openAt, packageHeadTryout?.closeAt),
    [packageHeadTryout?.closeAt, packageHeadTryout?.openAt],
  );

  if (membership.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (hasActiveMembership && membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-72" />;
  }

  const infoItems = [
    { label: 'Peminatan', value: data.subCategory.category.name },
    { label: 'Kategori Mata Pelajaran', value: data.subCategory.name },
    { label: 'Judul Tryout', value: isPsikoPackage ? 'PAKET SOAL PSIKO' : data.name },
    { label: isPsikoPackage ? 'Jumlah Sesi' : 'Jumlah Soal', value: isPsikoPackage ? String(psikoSessions.length) : String(data.totalQuestions) },
    {
      label: isPsikoPackage ? 'Total Soal Paket' : 'Durasi',
      value: isPsikoPackage
        ? String(psikoSessions.reduce((acc, item) => acc + item.totalQuestions, 0))
        : `${data.durationMinutes} menit`,
    },
    {
      label: isPsikoPackage ? 'Total Durasi Paket' : 'Akses Gratis',
      value: isPsikoPackage
        ? `${psikoSessions.reduce((acc, item) => acc + item.durationMinutes, 0)} menit`
        : data.isFree
          ? 'Ya'
          : 'Tidak',
    },
    {
      label: isPsikoPackage ? 'Akses Gratis Paket' : 'Waktu Akses Mulai Tryout',
      value: isPsikoPackage
        ? packageIsFree
          ? 'Ya'
          : 'Tidak'
        : formatDateTime(data.openAt),
    },
    {
      label: isPsikoPackage ? 'Waktu Akses Mulai Paket' : 'Waktu Akses Berakhir Tryout',
      value: isPsikoPackage ? formatDateTime(packageHeadTryout?.openAt) : formatDateTime(data.closeAt),
    },
    ...(isPsikoPackage ? [{ label: 'Waktu Akses Berakhir Paket', value: formatDateTime(packageHeadTryout?.closeAt) }] : []),
  ];

  const handleStart = () => {
    if (!packageHeadTryout || !status.canStart) return;
    if (!hasActiveMembership && !packageIsFree) {
      toast.error('Aktifkan paket untuk mulai tryout.');
      return;
    }
    navigate('/app/latihan/tryout/mulai', {
      state: {
        startTryoutSlug: packageHeadTryout.slug,
        returnTo: `/app/latihan/tryout/kategori/${data.subCategory.category.id}/sub/${data.subCategory.id}`,
      },
    });
  };

  const cover = getAssetUrl(data.coverImageUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">
            {isPsikoPackage ? 'PAKET SOAL PSIKO' : data.name}
          </h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {data.subCategory.category.name} / {data.subCategory.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/app/latihan/tryout/kategori/${data.subCategory.category.id}/sub/${data.subCategory.id}`)}
            className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!status.canStart}
            className="inline-flex items-center rounded-full bg-member-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-member-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.canStart ? (isPsikoPackage ? 'Mulai Paket Soal' : 'Mulai Tryout') : status.label}
          </button>
        </div>
      </div>

      <article className="member-card overflow-hidden">
        <div className={cn('relative h-40 overflow-hidden sm:h-52', !cover && 'bg-[#E1F7F3]')}>
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-16 w-16 rounded-xl bg-white/80 shadow-sm" />
            </div>
          )}
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

      {isPsikoPackage && psikoSessions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Detail Sesi Paket</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {psikoSessions.map((session) => (
              <article key={session.id} className="member-card overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-[#F0EAFB]">
                  <div className="h-16 w-16 rounded-xl bg-white/80 shadow-sm" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Sesi {session.sessionOrder}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-ink-50">{session.name}</h3>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    {session.totalQuestions} soal • {session.durationMinutes} menit
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
