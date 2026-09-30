import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { isAxiosError } from 'axios';
import { apiGet } from '@/lib/api';
import type { TryoutPackageReview, TryoutReview, TryoutReviewQuestion } from '@/types/exam';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import {
  ExamReviewQuestionList,
  type ExamReviewQuestionItem,
} from '@/components/dashboard/ExamReviewQuestions';
import {
  filterPembahasanQuestions,
  isDoubtfulQuestion,
  PembahasanReviewToolbar,
  ReportQuestionModal,
  type PembahasanFilterKey,
} from '@/components/dashboard/tryout-result/PembahasanReviewControls';

function buildCounts(questions: ExamReviewQuestionItem[]) {
  let correct = 0;
  let wrong = 0;
  let doubt = 0;
  questions.forEach((question) => {
    if (isDoubtfulQuestion(question)) {
      doubt += 1;
      return;
    }
    if (question.isCorrect || question.gradeStatus === 'correct') correct += 1;
    else wrong += 1;
  });
  return { all: questions.length, correct, wrong, doubt };
}

function PembahasanSection({
  title,
  subtitle,
  questions,
  tryoutName,
  hideExplanation,
  filters,
}: {
  title?: string;
  subtitle?: string;
  questions: TryoutReviewQuestion[];
  tryoutName: string;
  hideExplanation: boolean;
  filters: Set<PembahasanFilterKey>;
}) {
  const [reportQuestion, setReportQuestion] = useState<ExamReviewQuestionItem | null>(null);
  const filtered = useMemo(
    () => filterPembahasanQuestions(questions, filters),
    [questions, filters],
  );

  return (
    <div className="space-y-3">
      {title ? (
        <div className="member-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            {subtitle ? <p className="text-[10px] font-bold uppercase text-slate-400">{subtitle}</p> : null}
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-ink-50">{title}</h2>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            Menampilkan {filtered.length}/{questions.length} soal
          </p>
        </div>
      ) : null}
      <ExamReviewQuestionList
        questions={filtered}
        hideExplanation={hideExplanation}
        onReportQuestion={setReportQuestion}
      />
      <ReportQuestionModal
        open={Boolean(reportQuestion)}
        question={reportQuestion}
        tryoutName={tryoutName}
        onClose={() => setReportQuestion(null)}
      />
    </div>
  );
}

export function TryoutPembahasanPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const membership = useMembershipStatus();
  const resultHref = resultId ? `/app/latihan/tryout/review/${resultId}` : '/app/latihan/tryout';
  const [filters, setFilters] = useState<Set<PembahasanFilterKey>>(() => new Set(['all']));
  const [hideExplanation, setHideExplanation] = useState(false);

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

  const allQuestions = useMemo(() => {
    if (!data) return [] as TryoutReviewQuestion[];
    if (data.tryout.isPsikoSession && packageReviewQuery.data) {
      return packageReviewQuery.data.sections.flatMap((section) => section.questions);
    }
    return data.questions;
  }, [data, packageReviewQuery.data]);

  const counts = useMemo(() => buildCounts(allQuestions), [allQuestions]);

  if (!resultId) {
    return <Navigate to="/app/latihan/tryout" replace />;
  }

  if (membership.isLoading || isLoading || !data) {
    return <Skeleton className="h-[420px]" />;
  }

  if (membership.data?.allowTryout === false) {
    return (
      <section className="member-card p-6 text-sm font-semibold text-slate-600 dark:text-ink-200">
        Paket membership kamu tidak mencakup akses latihan tryout. Hubungi admin untuk upgrade paket.
      </section>
    );
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
          onClick={() => navigate(resultHref)}
          className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
        >
          Kembali ke hasil tryout
        </button>
      </section>
    );
  }

  if (data.tryout.isPsikoSession && packageReviewQuery.isLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  const toolbar = (
    <PembahasanReviewToolbar
      filters={filters}
      onChangeFilters={setFilters}
      hideExplanation={hideExplanation}
      onToggleHideExplanation={setHideExplanation}
      counts={counts}
    />
  );

  if (data.tryout.isPsikoSession && packageReviewQuery.data) {
    const packageData = packageReviewQuery.data;
    return (
      <div className="space-y-6">
        <div>
          <Link
            to={resultHref}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke hasil tryout
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">
            Bedah Soal & Pembahasan
          </h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {packageData.package.categoryName} / {packageData.package.subCategoryName} · {packageData.package.totalSessions}{' '}
            sesi
          </p>
        </div>

        {toolbar}

        <div className="space-y-8">
          {packageData.sections.map((section) => (
            <PembahasanSection
              key={section.resultId}
              title={section.tryout.name}
              subtitle={`Sesi ${section.sessionOrder}`}
              questions={section.questions}
              tryoutName={`${packageData.package.subCategoryName} · ${section.tryout.name}`}
              hideExplanation={hideExplanation}
              filters={filters}
            />
          ))}
        </div>
      </div>
    );
  }

  const correctCount = data.questions.filter((question) => question.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={resultHref}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-ink-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke hasil tryout
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">
            Bedah Soal & Pembahasan
          </h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {data.tryout.subCategory?.category.name} / {data.tryout.subCategory?.name} · {data.tryout.name}
          </p>
        </div>
        <div className="member-card flex items-center gap-4 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Skor</p>
            <p className="text-2xl font-extrabold tabular-nums text-member-600">{Math.round(data.score)}</p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Benar</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-800 dark:text-ink-50">
              {correctCount}/{data.questions.length}
            </p>
          </div>
        </div>
      </div>

      {toolbar}

      <PembahasanSection
        questions={data.questions}
        tryoutName={data.tryout.name}
        hideExplanation={hideExplanation}
        filters={filters}
      />
    </div>
  );
}
