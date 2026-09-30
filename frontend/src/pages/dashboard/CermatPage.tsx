import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPost, getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { MembershipRequired } from '@/components/dashboard/MembershipRequired';
import { Skeleton } from '@/components/ui/skeleton';
import { useFullscreenExam } from '@/hooks/useFullscreenExam';
import { useExamBlocks } from '@/hooks/useExamBlocks';
import { useExamBlockConfig } from '@/hooks/useExamBlockConfig';
import { ExamCountdownModal } from '@/components/dashboard/ExamCountdownModal';
import { CermatExamOverlay } from '@/components/dashboard/CermatExamOverlay';
import { CERMAT_MODE_ACCENT, CermatModePreview } from '@/components/dashboard/CermatModePreview';
import { PageHeader } from '@/components/common/PageHeader';
import {
  CERMAT_MODE_LABELS,
  DEFAULT_CERMAT_CONFIG,
  formatCermatConfigSummary,
  type CermatConfig,
  type CermatMode,
} from '@/types/cermat';

type CermatSession = {
  attemptId: string;
  sessionId: string;
  timerSeconds: number;
  baseSet: string[];
  mode: CermatMode;
  questions: Array<{ order: number; sequence: string[] }>;
  sessionIndex: number;
  totalSessions: number;
  breakSeconds: number;
  questionCount: number;
};

const MODE_LABELS: Record<CermatMode, { reference: string; prompt: string; button: string }> = {
  NUMBER: {
    reference: 'Angka Referensi',
    prompt: 'Pilih angka referensi yang tidak muncul pada deret di atas.',
    button: 'Mulai Tes Angka',
  },
  LETTER: {
    reference: 'Huruf Referensi',
    prompt: 'Pilih huruf referensi yang tidak muncul pada deret di atas.',
    button: 'Mulai Tes Huruf',
  },
  IMAGE: {
    reference: 'Gambar Referensi',
    prompt: 'Pilih huruf gambar referensi yang tidak muncul pada deret di atas.',
    button: 'Mulai Tes Gambar',
  },
};

function getTestVariants(config: CermatConfig): Array<{ mode: CermatMode; title: string; description: string }> {
  const { totalSessions, questionCount, durationSeconds, breakSeconds } = config;
  const sessionInfo = `${totalSessions} sesi, masing-masing ${questionCount} soal selama ${durationSeconds} detik, dengan jeda ${breakSeconds} detik antar sesi`;

  return [
    {
      mode: 'IMAGE',
      title: 'Tes Kecermatan Gambar Hilang',
      description:
        `5 gambar referensi ditampilkan dengan label A-E. Tiap soal menampilkan 4 gambar — tentukan huruf gambar yang hilang. Total ${sessionInfo}.`,
    },
    {
      mode: 'LETTER',
      title: 'Tes Kecermatan Huruf Hilang',
      description:
        `Dengan 5 huruf referensi yang diacak dari A-Z, kamu harus menentukan huruf mana yang tidak tampil. Total ${sessionInfo}.`,
    },
    {
      mode: 'NUMBER',
      title: 'Tes Kecermatan Angka Hilang',
      description:
        `Sistem membangkitkan 5 angka acak sebagai referensi. Kerjakan ${sessionInfo}.`,
    },
  ];
}

export function CermatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const membership = useMembershipStatus();
  const { data: blocks, refetch: refetchBlocks } = useExamBlocks(Boolean(membership.data?.isActive));
  const { data: blockConfig } = useExamBlockConfig(Boolean(membership.data?.isActive));
  const cermatBlock = blocks?.find((block) => block.type === 'CERMAT');
  const cermatBlockEnabled = blockConfig?.cermatEnabled ?? true;
  const [unlockCode, setUnlockCode] = useState('');
  const { data: cermatConfig = DEFAULT_CERMAT_CONFIG } = useQuery({
    queryKey: ['cermat-config'],
    queryFn: () => apiGet<CermatConfig>('/exams/cermat/config'),
    enabled: membership.data?.isActive === true && membership.data?.allowCermat !== false,
  });
  const testVariants = useMemo(() => {
    const modes = cermatConfig.modes;
    return getTestVariants(cermatConfig).filter((item) => {
      if (!modes) return true;
      if (item.mode === 'IMAGE') return modes.imageEnabled !== false;
      if (item.mode === 'LETTER') return modes.letterEnabled !== false;
      return modes.numberEnabled !== false;
    });
  }, [cermatConfig]);
  const configSummary = useMemo(() => formatCermatConfigSummary(cermatConfig), [cermatConfig]);
  const [session, setSession] = useState<CermatSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [pendingMode, setPendingMode] = useState<CermatMode | null>(null);
  const [pendingNext, setPendingNext] = useState<CermatSession | null>(null);
  const [breakLeft, setBreakLeft] = useState(0);
  const [isBreaking, setIsBreaking] = useState(false);
  const [pendingSession, setPendingSession] = useState<CermatSession | null>(null);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [countdownToken, setCountdownToken] = useState(0);
  const autoSubmitRef = useRef<string>('');
  const autoStartOnceRef = useRef(false);
  const answersRef = useRef<Record<number, string | null>>({});
  const questionIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const isBreakingRef = useRef(false);

  const { request: requestFullscreen, exit: exitFullscreen, setViolationHandler, isSupported: fullscreenSupported } = useFullscreenExam({
    active: Boolean(session || isBreaking || pendingNext) && cermatBlockEnabled,
  });

  const violationMutation = useMutation({
    mutationFn: (reason: string) => apiPost('/exams/blocks', { type: 'CERMAT', reason }),
    onSuccess: () => refetchBlocks(),
  });

  const unlockMutation = useMutation({
    mutationFn: (code: string) => apiPost('/exams/blocks/unlock', { type: 'CERMAT', code }),
    onSuccess: () => {
      toast.success('Blokir kecermatan terbuka kembali');
      setUnlockCode('');
      refetchBlocks();
    },
    onError: () => toast.error('Kode buka blokir tidak valid'),
  });

  const currentQuestion = useMemo(() => session?.questions[currentIndex], [session, currentIndex]);
  const forcedMode = useMemo(() => {
    const mode = new URLSearchParams(location.search).get('mode');
    if (mode === 'LETTER' || mode === 'NUMBER' || mode === 'IMAGE') return mode as CermatMode;
    return null;
  }, [location.search]);
  const autoStartRequested = useMemo(() => new URLSearchParams(location.search).get('autoStart') === '1', [location.search]);

  const submitMutation = useMutation({
    mutationFn: ({ sessionId, answerMap }: { sessionId: string; answerMap: Record<number, string | null> }) => {
      const payload = Object.entries(answerMap).map(([order, value]) => ({
        order: Number(order),
        value: typeof value === 'string' ? value : null,
      }));
      return apiPost<{
        completed: boolean;
        sessionSummary?: { sessionIndex: number; score: number; correct: number; total: number };
        nextSession?: CermatSession;
        summary?: {
          attemptId: string;
          mode?: CermatMode;
          averageScore: number;
          totalCorrect: number;
          totalQuestions: number;
          sessions: Array<{ sessionIndex: number; score: number; correct: number; total: number }>;
        };
      }>(
        `/exams/cermat/session/${sessionId}/submit`,
        { answers: payload },
      );
    },
    onSuccess: (payload) => {
      if (payload.completed && payload.summary?.attemptId) {
        isBreakingRef.current = false;
        setSession(null);
        questionIndexRef.current = 0;
        answersRef.current = {};
        setCurrentIndex(0);
        setTimeLeft(60);
        setAnswers({});
        setPendingNext(null);
        setBreakLeft(0);
        setIsBreaking(false);
        endTimeRef.current = null;
        exitFullscreen();
        toast.success(`Tes selesai. Rata-rata ${payload.summary.averageScore}%`);
        navigate(`/app/tes-kecermatan/hasil/${payload.summary.attemptId}`);
        return;
      }
      if (payload.nextSession) {
        const next = payload.nextSession;
        const configuredBreak = Number(next.breakSeconds ?? cermatConfig.breakSeconds ?? 5);
        const pause = Number.isFinite(configuredBreak) ? Math.max(0, configuredBreak) : 5;
        isBreakingRef.current = true;
        if (session?.sessionId) {
          autoSubmitRef.current = session.sessionId;
        }
        endTimeRef.current = null;
        setPendingNext(next);
        if (pause <= 0) {
          isBreakingRef.current = false;
          setSession(next);
          setPendingNext(null);
          answersRef.current = {};
          questionIndexRef.current = 0;
          setAnswers({});
          setCurrentIndex(0);
          setIsBreaking(false);
          setBreakLeft(0);
          autoSubmitRef.current = '';
          endTimeRef.current = Date.now() + (next.timerSeconds ?? 60) * 1000;
          setTimeLeft(next.timerSeconds ?? 60);
          return;
        }
        setIsBreaking(true);
        setBreakLeft(pause);
        return;
      }
    },
    onError: () => toast.error('Gagal mengirim jawaban'),
  });

  const startMutation = useMutation({
    mutationFn: (mode: CermatMode) => apiPost<CermatSession>('/exams/cermat/session', { mode }),
    onMutate: (mode) => {
      setPendingMode(mode);
    },
    onSuccess: (payload) => {
      setPendingSession(payload);
      setCountdownToken((prev) => prev + 1);
      setCountdownOpen(true);
      void queryClient.invalidateQueries({ queryKey: ['membership-status'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Gagal memulai sesi'));
      exitFullscreen();
    },
    onSettled: () => setPendingMode(null),
  });

  const handleAdvance = useCallback(
    (value?: string | null) => {
      if (!session || submitMutation.isPending) return;
      const index = questionIndexRef.current;
      const question = session.questions[index];
      if (!question) return;

      const nextAnswers = {
        ...answersRef.current,
        [question.order]: typeof value === 'string' ? value : null,
      };
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);

      if (index + 1 >= session.questions.length) return;
      const nextIndex = index + 1;
      questionIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    },
    [session, submitMutation],
  );

  const handleFinishSession = useCallback(() => {
    if (!session || submitMutation.isPending) return;
    submitMutation.mutate({ sessionId: session.sessionId, answerMap: answersRef.current });
  }, [session, submitMutation]);

  const allQuestionsAnswered = useMemo(() => {
    if (!session) return false;
    return session.questions.every((question) => answers[question.order] !== undefined);
  }, [answers, session]);

  useEffect(() => {
    autoSubmitRef.current = '';
  }, [session?.sessionId]);

  useEffect(() => {
    if (!session && !countdownOpen && !isBreaking) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [session, countdownOpen, isBreaking]);

  useEffect(() => {
    if (!session || isBreaking) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    if (timerRef.current !== null) {
      return undefined;
    }
    timerRef.current = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const next = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(next);
    }, 250);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session, isBreaking]);

  useEffect(() => {
    if (!session || isBreaking || isBreakingRef.current) return;
    if (timeLeft > 0) return;
    if (!submitMutation.isPending && autoSubmitRef.current !== session.sessionId) {
      autoSubmitRef.current = session.sessionId;
      submitMutation.mutate({ sessionId: session.sessionId, answerMap: answersRef.current });
    }
  }, [isBreaking, session, submitMutation, timeLeft]);

  const startPendingNextSession = useCallback(() => {
    if (!pendingNext) return;
    const next = pendingNext;
    isBreakingRef.current = false;
    setSession(next);
    setPendingNext(null);
    answersRef.current = {};
    questionIndexRef.current = 0;
    setAnswers({});
    setCurrentIndex(0);
    setIsBreaking(false);
    setBreakLeft(0);
    autoSubmitRef.current = '';
    endTimeRef.current = Date.now() + (next.timerSeconds ?? 60) * 1000;
    setTimeLeft(next.timerSeconds ?? 60);
  }, [pendingNext]);

  useEffect(() => {
    if (!pendingNext || !isBreaking) return undefined;
    const timer = window.setInterval(() => {
      setBreakLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pendingNext?.sessionId, isBreaking]);

  useEffect(() => {
    if (!(pendingNext && isBreaking && breakLeft === 0)) return;
    startPendingNextSession();
  }, [breakLeft, pendingNext, isBreaking, startPendingNextSession]);

  const handleForceStop = useCallback(
    (reason?: string) => {
      if (reason) {
        toast.error(`Tes dihentikan: ${reason}`);
      }
      isBreakingRef.current = false;
      setSession(null);
      answersRef.current = {};
      questionIndexRef.current = 0;
      setCurrentIndex(0);
      setTimeLeft(60);
      setAnswers({});
      setPendingSession(null);
      setPendingNext(null);
      setBreakLeft(0);
      setIsBreaking(false);
      endTimeRef.current = null;
      exitFullscreen();
      if (cermatBlockEnabled && reason) {
        violationMutation.mutate(reason);
      }
    },
    [cermatBlockEnabled, exitFullscreen, violationMutation],
  );

  useEffect(() => {
    if (!cermatBlockEnabled) {
      setViolationHandler(null);
      return undefined;
    }
    setViolationHandler((reason) => handleForceStop(reason));
    return () => setViolationHandler(null);
  }, [cermatBlockEnabled, handleForceStop, setViolationHandler]);

  useEffect(() => {
    if (!forcedMode || !autoStartRequested) return;
    if (autoStartOnceRef.current) return;
    if (!membership.data?.isActive || membership.data?.allowCermat === false) return;
    if (cermatBlock) return;
    if (session || pendingSession || countdownOpen || startMutation.isPending) return;

    let cancelled = false;
    const startForcedMode = async () => {
      if (fullscreenSupported) {
        try {
          await requestFullscreen();
        } catch {
          if (!cancelled) {
            toast.error('Izinkan mode layar penuh untuk mulai tes.');
          }
          return;
        }
      }
      if (cancelled || autoStartOnceRef.current) return;
      autoStartOnceRef.current = true;
      startMutation.mutate(forcedMode);
      navigate(`/app/tes-kecermatan?mode=${forcedMode}`, { replace: true });
    };

    void startForcedMode();
    return () => {
      cancelled = true;
    };
  }, [
    autoStartRequested,
    cermatBlock,
    countdownOpen,
    forcedMode,
    fullscreenSupported,
    membership.data?.allowCermat,
    membership.data?.isActive,
    navigate,
    pendingSession,
    requestFullscreen,
    session,
    startMutation,
  ]);

  if (membership.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (!membership.data?.isActive) {
    return <MembershipRequired status={membership.data} />;
  }

  if (membership.data?.allowCermat === false) {
    return (
      <section className="rounded-3xl border border-brand-200 bg-brand-50 p-6 text-sm text-brand-800">
        Paket membership kamu tidak mencakup akses tes kecermatan. Hubungi admin untuk upgrade paket.
      </section>
    );
  }

  if (cermatBlock) {
    return (
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <section className="member-card space-y-4 p-6">
          <p className="text-sm font-extrabold text-rose-600">Akses tes kecermatan kamu sedang diblokir.</p>
          <p className="text-sm text-slate-600">
            Sistem mendeteksi kamu meninggalkan halaman pengerjaan. Masukkan kode buka blokir untuk mengerjakan lagi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Kode 6 digit"
              value={unlockCode}
              onChange={(event) => setUnlockCode(event.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={() => unlockMutation.mutate(unlockCode)}
              disabled={unlockMutation.isPending || unlockCode.trim().length < 4}
            >
              {unlockMutation.isPending ? 'Membuka...' : 'Buka Blokir'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Terakhir pelanggaran: {new Date(cermatBlock.blockedAt).toLocaleString('id-ID')}
          </p>
        </section>
        <aside className="member-card flex flex-col justify-center p-6">
          <p className="text-[10px] font-bold uppercase text-slate-400">Kode buka blokir</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Ditampilkan hanya untuk masa testing.</p>
          <p className="mt-3 text-3xl font-extrabold tracking-widest text-member-600">{cermatBlock.code || '—'}</p>
        </aside>
      </div>
    );
  }

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Tes Kecermatan"
        title="Latihan Fokus dan Ketelitian"
        description="Pilih varian tes dan lihat riwayat per sesi setelah selesai."
        action={
          <Button variant="outline" onClick={() => navigate('/app/tes-kecermatan/riwayat')}>
            Lihat Riwayat
          </Button>
        }
      />
      {(forcedMode ? testVariants.filter((item) => item.mode === forcedMode) : testVariants).map((variant) => {
        const isLoading = startMutation.isPending && pendingMode === variant.mode;
        const accent = CERMAT_MODE_ACCENT[variant.mode];
        return (
          <div
            key={variant.mode}
            className="surface-card overflow-hidden transition hover:shadow-md"
          >
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-8">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${accent.badge}`}
                  >
                    {CERMAT_MODE_LABELS[variant.mode]}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{configSummary}</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">{variant.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{variant.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      if (fullscreenSupported) {
                        requestFullscreen()
                          .then(() => {
                            startMutation.mutate(variant.mode);
                          })
                          .catch(() => {
                            toast.error('Izinkan mode layar penuh untuk mulai tes.');
                          });
                        return;
                      }
                      startMutation.mutate(variant.mode);
                    }}
                    disabled={startMutation.isPending}
                    isLoading={isLoading}
                  >
                    {MODE_LABELS[variant.mode].button}
                  </Button>
                  {typeof membership.data?.cermatQuota === 'number' && membership.data.cermatQuota > 0 && (
                    <span className="text-sm text-slate-500">
                      Token tersisa{' '}
                      <span className="font-semibold text-slate-800">
                        {Math.max((membership.data.cermatRemaining ?? membership.data.cermatQuota - (membership.data.cermatUsed ?? 0)), 0)}
                      </span>
                      /{membership.data.cermatQuota}
                    </span>
                  )}
                </div>
              </div>

              <CermatModePreview mode={variant.mode} className="w-full shrink-0 lg:w-[280px] xl:w-[300px]" />
            </div>
          </div>
        );
      })}

      {(session || (isBreaking && pendingNext)) && (
        <CermatExamOverlay
          mode={(pendingNext ?? session)!.mode}
          sessionIndex={(isBreaking && pendingNext ? pendingNext.sessionIndex : session?.sessionIndex) ?? 1}
          totalSessions={(pendingNext ?? session)!.totalSessions}
          currentIndex={currentIndex}
          totalQuestions={session?.questions.length ?? pendingNext?.questions.length ?? 0}
          timeLeft={timeLeft}
          baseSet={(session ?? pendingNext)!.baseSet}
          sequence={currentQuestion?.sequence ?? (session ?? pendingNext)!.baseSet.slice(0, 4)}
          questionOrder={currentQuestion?.order ?? 0}
          answers={answers}
          submitPending={submitMutation.isPending}
          allAnswered={allQuestionsAnswered}
          modeLabels={MODE_LABELS}
          isBreaking={isBreaking && Boolean(pendingNext)}
          breakSecondsLeft={isBreaking ? breakLeft : null}
          nextSessionIndex={pendingNext?.sessionIndex ?? null}
          onAnswer={handleAdvance}
          onFinish={handleFinishSession}
          onContinueBreak={startPendingNextSession}
        />
      )}

      <ExamCountdownModal
        open={countdownOpen}
        resetKey={countdownToken}
        variant="focus"
        title="Mulai Tes Kecermatan"
        subtitle="Fokus dan pastikan koneksi stabil."
        warning="Tes akan dihentikan jika Anda berpindah tab atau meninggalkan halaman."
        onComplete={() => {
          if (!pendingSession) {
            setCountdownOpen(false);
            return;
          }
          setSession(pendingSession);
          answersRef.current = {};
          questionIndexRef.current = 0;
          setAnswers({});
          setCurrentIndex(0);
          setPendingNext(null);
          setBreakLeft(0);
          setIsBreaking(false);
          endTimeRef.current = Date.now() + (pendingSession.timerSeconds ?? 60) * 1000;
          setTimeLeft(pendingSession.timerSeconds ?? 60);
          setCountdownOpen(false);
          setPendingSession(null);
          toast.success('Tes kecermatan dimulai. Fokus pada setiap soal!');
        }}
        onCancel={() => {
          setCountdownOpen(false);
          setPendingSession(null);
          exitFullscreen();
        }}
      />

    </section>
  );
}
