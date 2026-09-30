import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiGet } from '@/lib/api';
import type { TryoutPackageReview, TryoutReview } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { TryoutResultReport } from '@/components/dashboard/tryout-result/TryoutResultReport';

function tryoutListPath(categoryId?: string, subCategoryId?: string) {
  if (categoryId && subCategoryId) {
    return `/app/latihan/tryout/kategori/${categoryId}/sub/${subCategoryId}`;
  }
  if (categoryId) {
    return `/app/latihan/tryout/kategori/${categoryId}`;
  }
  return '/app/latihan/tryout';
}

export function TryoutReviewPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const membership = useMembershipStatus();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tryout-review', resultId],
    queryFn: () => apiGet<TryoutReview>(`/exams/tryouts/results/${resultId}/review`),
    enabled: Boolean(resultId),
  });
  const packageReviewQuery = useQuery({
    queryKey: ['tryout-package-review', resultId],
    queryFn: () => apiGet<TryoutPackageReview>(`/exams/tryouts/results/${resultId}/review-package`),
    enabled: Boolean(resultId && data?.tryout.isPsikoSession),
  });

  if (!resultId) {
    return <Navigate to="/app/latihan/tryout" replace />;
  }

  if (membership.isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-[420px]" />;
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 403) {
      return <MembershipRequired status={membership.data} />;
    }
    return (
      <section className="member-card space-y-4 p-6">
        <p className="text-sm font-semibold text-rose-600">Gagal memuat pembahasan. Coba kembali.</p>
        <button
          type="button"
          onClick={() => navigate('/app/latihan/tryout')}
          className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
        >
          Kembali ke Tryout
        </button>
      </section>
    );
  }

  if (data.tryout.isPsikoSession && packageReviewQuery.isLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  if (data.tryout.isPsikoSession && packageReviewQuery.data) {
    const packageData = packageReviewQuery.data;
    const packageBack = tryoutListPath(packageData.package.categoryId, packageData.package.subCategoryId);
    const flatQuestions = packageData.sections.flatMap((section) => section.questions);
    const sectionBreakdowns = packageData.sections.map((section) => ({
      label: `Sesi ${section.sessionOrder}: ${section.tryout.name}`,
      score: section.score,
      correct: section.questions.filter((question) => question.isCorrect).length,
      total: section.questions.length,
    }));
    const firstSlug = packageData.sections[0]?.tryout.slug ?? data.tryout.slug;
    const durationSeconds =
      packageData.sections.reduce((sum, section) => sum + section.tryout.durationMinutes * 60, 0) ||
      data.durationSeconds ||
      data.tryout.durationMinutes * 60;

    return (
      <TryoutResultReport
        resultId={resultId}
        title={packageData.package.subCategoryName}
        categoryName={packageData.package.categoryName}
        subCategoryName={packageData.package.subCategoryName}
        score={packageData.overall.averageScore}
        correctCount={packageData.overall.totalCorrect}
        totalQuestions={packageData.overall.totalQuestions}
        durationSeconds={durationSeconds}
        completedAtLabel={
          packageData.sections[0]?.completedAt
            ? new Date(packageData.sections[0].completedAt).toLocaleString('id-ID')
            : '-'
        }
        tryoutSlug={firstSlug}
        questions={flatQuestions}
        sectionBreakdowns={sectionBreakdowns}
        backToList={packageBack}
        onRetry={() =>
          navigate('/app/latihan/tryout/mulai', {
            state: { startTryoutSlug: firstSlug, returnTo: packageBack },
          })
        }
      />
    );
  }

  const correctCount = data.questions.filter((question) => question.isCorrect).length;
  const backToList = tryoutListPath(data.tryout.subCategory?.category.id, data.tryout.subCategory?.id);
  const completedAtLabel = data.completedAt ? new Date(data.completedAt).toLocaleString('id-ID') : '-';
  const durationSeconds = data.durationSeconds || data.tryout.durationMinutes * 60;

  return (
    <TryoutResultReport
      resultId={resultId}
      title={data.tryout.name}
      categoryName={data.tryout.subCategory?.category.name}
      subCategoryName={data.tryout.subCategory?.name}
      score={data.score}
      correctCount={correctCount}
      totalQuestions={data.questions.length}
      durationSeconds={durationSeconds}
      completedAtLabel={completedAtLabel}
      tryoutSlug={data.tryout.slug}
      questions={data.questions}
      backToList={backToList}
      onRetry={() =>
        navigate('/app/latihan/tryout/mulai', {
          state: { startTryoutSlug: data.tryout.slug, returnTo: backToList },
        })
      }
    />
  );
}
