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
import { ArrowRight, BarChart3, Clock3, FileText, ScanEye, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LearningPageHeader, StatItem, type LearningLayout } from '@/components/dashboard/member/LearningPageHeader';
import { DEFAULT_CERMAT_CONFIG, type CermatConfig, type CermatMode } from '@/types/cermat';

type CermatCard = {
  key: string;
  mode: CermatMode | null;
  badge: string;
  title: string;
  description: string;
  image: string;
  tint: string;
  badgeTone: string;
  buttonTone: string;
};

const CERMAT_CARDS: CermatCard[] = [
  {
    key: 'IMAGE',
    mode: 'IMAGE',
    badge: 'Gambar Hilang',
    title: 'Gambar Hilang',
    description: 'Temukan gambar yang hilang dari 5 pilihan referensi.',
    image: '/illustrations/cermat-gambar-hilang.jpg',
    tint: 'bg-[#FBF1DF]',
    badgeTone: 'bg-[#8C6A1C]',
    buttonTone: 'bg-[#8C6A1C] hover:bg-[#735614]',
  },
  {
    key: 'LETTER',
    mode: 'LETTER',
    badge: 'Huruf Hilang',
    title: 'Huruf Hilang',
    description: 'Tentukan huruf yang tidak tampil dari 5 pilihan.',
    image: '/illustrations/cermat-huruf-hilang.jpg',
    tint: 'bg-[#F1EAFD]',
    badgeTone: 'bg-violet-600',
    buttonTone: 'bg-violet-600 hover:bg-violet-700',
  },
  {
    key: 'NUMBER',
    mode: 'NUMBER',
    badge: 'Angka Hilang',
    title: 'Angka Hilang',
    description: 'Tentukan angka yang tidak tampil dari 5 pilihan.',
    image: '/illustrations/cermat-angka-hilang.jpg',
    tint: 'bg-[#E7F5EC]',
    badgeTone: 'bg-[#1F7A4D]',
    buttonTone: 'bg-[#1F7A4D] hover:bg-[#18623d]',
  },
  {
    key: 'SAME',
    mode: null,
    badge: 'Gambar Sama',
    title: 'Gambar Sama',
    description: 'Cari gambar yang sama dalam waktu cepat.',
    image: '/illustrations/cermat-gambar-sama.jpg',
    tint: 'bg-[#E6F0FD]',
    badgeTone: 'bg-blue-600',
    buttonTone: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    key: 'COMPARE',
    mode: null,
    badge: 'Perbandingan',
    title: 'Perbandingan',
    description: 'Temukan perbedaan atau persamaan dengan cepat.',
    image: '/illustrations/cermat-perbandingan.jpg',
    tint: 'bg-[#FDECEC]',
    badgeTone: 'bg-rose-500',
    buttonTone: 'bg-rose-500 hover:bg-rose-600',
  },
];

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

function modeEnabled(config: CermatConfig, mode: CermatMode) {
  const modes = config.modes;
  if (!modes) return true;
  if (mode === 'IMAGE') return modes.imageEnabled !== false;
  if (mode === 'LETTER') return modes.letterEnabled !== false;
  return modes.numberEnabled !== false;
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
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LearningLayout>('grid');
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

  const term = query.trim().toLowerCase();
  const cards = CERMAT_CARDS.filter((card) => {
    if (card.mode && !modeEnabled(cermatConfig, card.mode)) return false;
    if (forcedMode && card.mode !== forcedMode) return false;
    return !term || card.title.toLowerCase().includes(term);
  });
  const metaLine = `${cermatConfig.totalSessions} sesi • ${cermatConfig.questionCount} soal • ${cermatConfig.durationSeconds} detik`;

  const startCard = (card: CermatCard) => {
    const mode = card.mode;
    if (!mode) {
      toast.message(`Tes Kecermatan ${card.title} segera tersedia.`);
      return;
    }
    if (fullscreenSupported) {
      requestFullscreen()
        .then(() => startMutation.mutate(mode))
        .catch(() => toast.error('Izinkan mode layar penuh untuk mulai tes.'));
      return;
    }
    startMutation.mutate(mode);
  };

  return (
    <div className="space-y-5">
      <LearningPageHeader
        title="Tes Kecermatan"
        description="Latih fokus, ketelitian, dan kecepatan dengan berbagai variasi tes kecermatan."
        searchPlaceholder="Cari jenis tes..."
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section className="member-card grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <StatItem icon={<ScanEye className="h-5 w-5" />} tone="bg-violet-50 text-violet-600" value={String(CERMAT_CARDS.length)} label="Jenis Tes" />
          <StatItem icon={<FileText className="h-5 w-5" />} tone="bg-blue-50 text-blue-600" value="200" label="Total Soal" />
          <StatItem icon={<Clock3 className="h-5 w-5" />} tone="bg-rose-50 text-rose-600" value={`± ${cermatConfig.durationSeconds} detik`} label="Durasi per soal" />
          <StatItem icon={<Zap className="h-5 w-5" />} tone="bg-amber-50 text-amber-500" value={`${cermatConfig.breakSeconds} detik`} label="Jeda antar sesi" />
        </section>
        <section className="member-card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Rata-rata Skor</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-ink-50">82</p>
          </div>
        </section>
      </div>

      {cards.length === 0 ? (
        <div className="member-card p-8 text-center text-sm font-semibold text-slate-400">Jenis tes tidak ditemukan.</div>
      ) : (
        <div className={cn('grid gap-4', layout === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1')}>
          {cards.map((card) => {
            const loading = startMutation.isPending && card.mode !== null && pendingMode === card.mode;
            return (
              <article
                key={card.key}
                className={cn(
                  'flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-ink-800',
                  layout === 'grid' ? 'flex-col' : 'flex-row items-stretch',
                )}
              >
                <div className={cn('flex flex-col items-center gap-2 px-4 pb-3 pt-4', card.tint, layout === 'list' && 'w-48 shrink-0 justify-center')}>
                  <span className={cn('rounded-md px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white', card.badgeTone)}>
                    {card.badge}
                  </span>
                  <img src={card.image} alt="" className="h-20 w-28 object-contain mix-blend-multiply" />
                </div>
                <div className="flex flex-1 flex-col items-center px-4 pb-4 pt-3 text-center">
                  <h3 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-ink-50">
                    Tes Kecermatan
                    <br />
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-ink-200">{card.description}</p>
                  <p className="mt-2 text-[10px] font-medium text-slate-400">{metaLine}</p>
                  <button
                    type="button"
                    onClick={() => startCard(card)}
                    disabled={startMutation.isPending}
                    className={cn(
                      'mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-60',
                      card.buttonTone,
                    )}
                  >
                    {loading ? 'Memulai...' : 'Mulai Tes'} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
