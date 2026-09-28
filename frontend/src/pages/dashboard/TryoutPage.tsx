import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import type { Tryout, TryoutDetail } from '@/types/exam';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isDocumentFullscreen, useFullscreenExam } from '@/hooks/useFullscreenExam';
import { useExamBlocks } from '@/hooks/useExamBlocks';
import { useExamBlockConfig } from '@/hooks/useExamBlockConfig';
import { ExamCountdownModal } from '@/components/dashboard/ExamCountdownModal';
import { ExamFullscreenGateModal } from '@/components/dashboard/ExamFullscreenGateModal';
import { ConfirmFinishModal } from '@/components/dashboard/ConfirmFinishModal';
import { ExamTakingOverlay, ExamQuestionPanel } from '@/components/dashboard/ExamTakingOverlay';
import { ExamQuestionOptions } from '@/components/dashboard/ExamQuestionOptions';
import { buildExamSubmitPayload, setSingleAnswer, toggleMultiAnswer } from '@/lib/examAnswers';

type TryoutSession = {
  detail: TryoutDetail;
  resultId: string;
  durationMinutes: number;
};

type ApiErrorResponse = {
  message?: string;
  details?: { code?: string };
};

function formatTimeLeft(value: number | null) {
  if (value === null) return '--:--:--';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function TryoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: blocks, refetch: refetchBlocks } = useExamBlocks(true);
  const { data: blockConfig } = useExamBlockConfig(true);
  const tryoutBlock = blocks?.find((block) => block.type === 'TRYOUT');
  const blockEnabled = blockConfig?.tryoutEnabled ?? true;
  const [session, setSession] = useState<TryoutSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [countdownToken, setCountdownToken] = useState(0);
  const [fullscreenGateOpen, setFullscreenGateOpen] = useState(false);
  const [pendingTryout, setPendingTryout] = useState<Tryout | null>(null);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const returnToRef = useRef('/app/latihan/tryout');
  const autoStartRef = useRef(false);
  const countdownStartRef = useRef(false);
  const endTimeRef = useRef<number | null>(null);
  const autoSubmitRef = useRef(false);

  const { request: requestFullscreen, exit: exitFullscreen, setViolationHandler, isSupported: fullscreenSupported } =
    useFullscreenExam({ active: Boolean(session) && blockEnabled });

  const violationMutation = useMutation({
    mutationFn: (reason: string) => apiPost('/exams/blocks', { type: 'TRYOUT', reason }),
    onSuccess: () => refetchBlocks(),
  });

  const unlockMutation = useMutation({
    mutationFn: (code: string) => apiPost('/exams/blocks/unlock', { type: 'TRYOUT', code }),
    onSuccess: () => {
      toast.success('Blokir tryout berhasil dibuka');
      setUnlockCode('');
      refetchBlocks();
    },
    onError: () => toast.error('Kode buka blokir tidak valid'),
  });

  const goBack = useCallback(() => {
    navigate(returnToRef.current || '/app/latihan/tryout');
  }, [navigate]);

  useEffect(() => {
    if (!blockEnabled) {
      setViolationHandler(null);
      return undefined;
    }
    setViolationHandler((reason) => {
      violationMutation.mutate(reason ?? 'Keluar dari layar penuh');
      setSession(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setFinishConfirmOpen(false);
      endTimeRef.current = null;
      setTimeLeft(null);
      exitFullscreen();
      toast.error('Tryout diblokir karena kamu meninggalkan layar penuh.');
    });
    return () => setViolationHandler(null);
  }, [blockEnabled, exitFullscreen, setViolationHandler, violationMutation]);

  const startMutation = useMutation({
    mutationFn: async (tryout: Tryout) => {
      const start = await apiPost<{ resultId: string; durationMinutes: number }>(`/exams/tryouts/${tryout.slug}/start`);
      const detail = await apiGet<TryoutDetail>(`/exams/tryouts/${tryout.slug}`);
      return { detail, resultId: start.resultId, durationMinutes: start.durationMinutes } satisfies TryoutSession;
    },
    onSuccess: (payload) => {
      autoSubmitRef.current = false;
      endTimeRef.current = Date.now() + payload.durationMinutes * 60 * 1000;
      setTimeLeft(payload.durationMinutes * 60);
      setSession(payload);
      setAnswers({});
      setCurrentQuestionIndex(0);
    },
    onError: (error) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const serverMessage = apiError.response?.data?.message?.trim();
      if (apiError.response?.status === 423) {
        refetchBlocks();
      }
      toast.error(serverMessage || 'Gagal memulai tryout');
      exitFullscreen();
      goBack();
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!session) throw new Error('No session');
      return apiPost<{ resultId: string; score: number; correct: number; total: number }>(
        `/exams/tryouts/${session.detail.slug}/submit`,
        { resultId: session.resultId, answers: buildExamSubmitPayload(answers) },
      );
    },
    onSuccess: (payload) => {
      setSession(null);
      endTimeRef.current = null;
      setTimeLeft(null);
      exitFullscreen();
      toast.success(`Tryout selesai. Skor kamu ${Math.round(payload.score)}`);
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      if (payload.resultId) {
        navigate(`/app/latihan/tryout/review/${payload.resultId}`, { replace: true });
      }
    },
    onError: () => toast.error('Gagal mengirim jawaban'),
  });

  const submitRef = useRef(submitMutation);
  submitRef.current = submitMutation;

  useEffect(() => {
    if (!session || !endTimeRef.current) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        toast.error('Waktu tryout habis. Jawaban otomatis dikumpulkan.');
        submitRef.current.mutate();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const beginAfterCountdown = useCallback(
    (tryout: Tryout) => {
      if (!fullscreenSupported) {
        toast.error('Layar penuh wajib didukung browser ini untuk memulai tryout.');
        goBack();
        return;
      }
      if (!isDocumentFullscreen()) {
        setPendingTryout(tryout);
        setCountdownOpen(false);
        setFullscreenGateOpen(true);
        return;
      }
      countdownStartRef.current = true;
      startMutation.mutate(tryout, {
        onSettled: () => {
          countdownStartRef.current = false;
          setCountdownOpen(false);
          setPendingTryout(null);
        },
      });
    },
    [fullscreenSupported, goBack, startMutation],
  );

  const openCountdown = useCallback((tryout: Tryout) => {
    setPendingTryout(tryout);
    setCountdownToken((value) => value + 1);
    setCountdownOpen(true);
  }, []);

  useEffect(() => {
    const state = location.state as { startTryoutSlug?: string; returnTo?: string } | null;
    const slug = state?.startTryoutSlug ?? sessionStorage.getItem('tryout_start_slug');
    if (!slug || autoStartRef.current) return;
    if (tryoutBlock) return;
    autoStartRef.current = true;
    if (state?.returnTo) returnToRef.current = state.returnTo;
    sessionStorage.removeItem('tryout_start_slug');
    navigate(location.pathname, { replace: true, state: null });
    apiGet<Tryout>(`/exams/tryouts/${slug}/info`)
      .then((tryout) => {
        if (!returnToRef.current || returnToRef.current === '/app/latihan/tryout') {
          returnToRef.current = `/app/latihan/tryout/detail/${tryout.slug}`;
        }
        openCountdown(tryout);
      })
      .catch(() => {
        toast.error('Tryout tidak ditemukan.');
        goBack();
      });
  }, [goBack, location.pathname, location.state, navigate, openCountdown, tryoutBlock]);

  const handleCountdownComplete = useCallback(() => {
    if (!pendingTryout || countdownStartRef.current) {
      setCountdownOpen(false);
      return;
    }
    beginAfterCountdown(pendingTryout);
  }, [beginAfterCountdown, pendingTryout]);

  const handleFullscreenGate = useCallback(async () => {
    if (!pendingTryout) {
      setFullscreenGateOpen(false);
      return;
    }
    try {
      await requestFullscreen();
      if (!isDocumentFullscreen()) throw new Error('Fullscreen tidak aktif');
    } catch {
      toast.error('Mode layar penuh wajib diaktifkan untuk memulai tryout.');
      setFullscreenGateOpen(false);
      setPendingTryout(null);
      goBack();
      return;
    }
    setFullscreenGateOpen(false);
    countdownStartRef.current = true;
    startMutation.mutate(pendingTryout, {
      onSettled: () => {
        countdownStartRef.current = false;
        setPendingTryout(null);
      },
    });
  }, [goBack, pendingTryout, requestFullscreen, startMutation]);

  const questionList = useMemo(() => session?.detail.questions ?? [], [session]);
  const currentQuestion = questionList[currentQuestionIndex];

  if (tryoutBlock && !session) {
    return (
      <section className="member-card space-y-4 p-6">
        <p className="text-sm font-extrabold text-rose-600">Akses tryout diblokir.</p>
        <p className="text-sm text-slate-600">
          Kamu meninggalkan layar penuh atau berpindah jendela. Masukkan kode buka blokir dari admin untuk mengerjakan lagi.
        </p>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Kode 6 digit"
            value={unlockCode}
            onChange={(event) => setUnlockCode(event.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => unlockMutation.mutate(unlockCode)} disabled={unlockMutation.isPending || unlockCode.trim().length < 4}>
            Buka blokir
          </Button>
          <Button variant="outline" onClick={goBack}>
            Kembali
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-[50vh]">
      <ExamCountdownModal
        open={countdownOpen}
        resetKey={countdownToken}
        title="Mulai Tryout"
        subtitle="Hitung mundur selesai, lalu tryout hanya bisa dikerjakan dalam layar penuh."
        warning="Keluar dari layar penuh, berpindah tab, atau membuka jendela lain akan memblokir tryout."
        onComplete={handleCountdownComplete}
        onCancel={() => {
          setCountdownOpen(false);
          setPendingTryout(null);
          exitFullscreen();
          goBack();
        }}
      />
      <ExamFullscreenGateModal
        open={fullscreenGateOpen}
        eyebrow="Latihan Tryout"
        description="Tryout wajib dikerjakan dalam layar penuh. Setelah masuk, jangan keluar sampai selesai."
        loading={startMutation.isPending}
        onConfirm={handleFullscreenGate}
        onCancel={() => {
          setFullscreenGateOpen(false);
          setPendingTryout(null);
          goBack();
        }}
      />
      <ExamTakingOverlay
        open={Boolean(session)}
        eyebrow="Tryout Berlangsung"
        title={session?.detail.name ?? 'Tryout'}
        subtitle={session ? `${session.detail.subCategory.category.name} / ${session.detail.subCategory.name}` : undefined}
        timeLeftLabel={session ? formatTimeLeft(timeLeft) : null}
        questions={questionList}
        answers={answers}
        activeIndex={currentQuestionIndex}
        onJump={setCurrentQuestionIndex}
        onPrev={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
        onNext={() => setCurrentQuestionIndex((index) => Math.min(index + 1, Math.max(questionList.length - 1, 0)))}
        onFinish={() => setFinishConfirmOpen(true)}
        onCancel={() => {
          setSession(null);
          endTimeRef.current = null;
          exitFullscreen();
          toast.error('Tryout dibatalkan.');
          goBack();
        }}
        submitPending={submitMutation.isPending}
        finishLabel="Akhiri Tryout"
        cancelLabel="Batalkan"
      >
        {currentQuestion ? (
          <ExamQuestionPanel
            index={currentQuestionIndex}
            prompt={currentQuestion.prompt}
            imageUrl={getAssetUrl(currentQuestion.imageUrl)}
            multipleCorrect={Boolean(currentQuestion.multipleCorrect)}
          >
            <ExamQuestionOptions
              questionId={currentQuestion.id}
              options={currentQuestion.options}
              multipleCorrect={Boolean(currentQuestion.multipleCorrect)}
              selectedIds={answers[currentQuestion.id] ?? []}
              onSelectSingle={(optionId) => setAnswers((prev) => setSingleAnswer(prev, currentQuestion.id, optionId))}
              onToggleMulti={(optionId) => setAnswers((prev) => toggleMultiAnswer(prev, currentQuestion.id, optionId))}
            />
          </ExamQuestionPanel>
        ) : null}
      </ExamTakingOverlay>
      <ConfirmFinishModal
        open={finishConfirmOpen}
        title="Akhiri tryout?"
        description="Jawaban yang sudah dipilih akan dikumpulkan."
        confirmText="Kumpulkan"
        loading={submitMutation.isPending}
        onConfirm={() => submitMutation.mutate(undefined, { onSettled: () => setFinishConfirmOpen(false) })}
        onCancel={() => setFinishConfirmOpen(false)}
      />
    </div>
  );
}
