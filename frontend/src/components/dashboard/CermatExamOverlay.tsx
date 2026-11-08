import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CermatIcon } from '@/components/dashboard/CermatIcon';
import { BrandMark } from '@/components/common/BrandMark';
import { CERMAT_MODE_LABELS, type CermatMode } from '@/types/cermat';
import { cn } from '@/utils/cn';

type CermatExamOverlayProps = {
  mode: CermatMode;
  sessionIndex: number;
  totalSessions: number;
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
  baseSet: string[];
  sequence: string[];
  questionOrder: number;
  answers: Record<number, string | null>;
  submitPending: boolean;
  allAnswered: boolean;
  modeLabels: Record<CermatMode, { reference: string; prompt: string; button: string }>;
  breakSecondsLeft?: number | null;
  breakSecondsTotal?: number | null;
  nextSessionIndex?: number | null;
  isBreaking?: boolean;
  onAnswer: (value?: string | null) => void;
  onFinish: () => void;
  onContinueBreak?: () => void;
};

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function StatPill({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-2 py-2 text-center sm:px-3 sm:py-2.5 lg:px-4 lg:py-3',
        urgent ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs lg:text-sm">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-lg font-bold tabular-nums sm:text-xl lg:text-2xl xl:text-3xl',
          urgent ? 'text-red-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CermatExamHeader({
  mode,
  sessionIndex,
  totalSessions,
  currentIndex,
  totalQuestions,
  timeLeft,
}: {
  mode: CermatMode;
  sessionIndex: number;
  totalSessions: number;
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
}) {
  const isImage = mode === 'IMAGE';

  return (
    <header className="chrome-navy shrink-0 border-b border-brand-400/25 bg-navy text-navy-fg">
      <div className="mx-auto max-w-2xl px-4 py-3 sm:max-w-3xl sm:px-6 sm:py-3.5 lg:max-w-5xl xl:max-w-6xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <div className="min-w-0 justify-self-start">
            <BrandMark size="md" variant="icon" className="min-w-0" tone="ink" />
          </div>

          <div className="justify-self-center text-center">
            <p className="type-caption text-[11px] font-bold uppercase tracking-command text-brand-300 sm:text-xs">
              Tes Kecermatan
            </p>
            {isImage ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-command text-ink-800 sm:px-3 sm:text-xs">
                {CERMAT_MODE_LABELS.IMAGE}
              </span>
            ) : (
              <h2 className="type-h1 mt-0.5 text-base sm:text-lg">
                Sesi {sessionIndex}/{totalSessions}
              </h2>
            )}
          </div>

          <div className="justify-self-end text-right">
            {isImage ? (
              <>
                <p className="type-caption text-ink-200">Sesi</p>
                <p className="type-h2 tabular-nums text-brand-300">
                  {sessionIndex}/{totalSessions}
                </p>
              </>
            ) : (
              <div className="inline-flex flex-col items-end gap-1">
                <p className="type-caption text-ink-200">
                  Soal {currentIndex + 1}/{totalQuestions}
                </p>
                <div className="rounded-xl bg-brand-500 px-3 py-1.5 text-center text-ink-800 sm:px-4">
                  <p className="text-lg font-bold tabular-nums sm:text-xl">{timeLeft}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-brand-500" aria-hidden />
    </header>
  );
}

function SessionContinueButton({
  sessionIndex,
  totalSessions,
  submitPending,
  onFinish,
}: {
  sessionIndex: number;
  totalSessions: number;
  submitPending: boolean;
  onFinish: () => void;
}) {
  const isLast = sessionIndex >= totalSessions;
  const label = isLast ? 'Selesai' : `Sesi ${sessionIndex + 1}`;

  return (
    <Button
      type="button"
      className={cn(
        'min-w-[8.5rem] transition active:scale-95',
        isLast ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-brand-600 hover:bg-brand-500',
      )}
      onClick={onFinish}
      disabled={submitPending}
    >
      {submitPending ? 'Mengirim…' : label}
    </Button>
  );
}

function AnswerChoiceButtons({
  baseSet,
  questionOrder,
  answers,
  submitPending,
  variant,
  onAnswer,
}: {
  baseSet: string[];
  questionOrder: number;
  answers: Record<number, string | null>;
  submitPending: boolean;
  variant: 'image' | 'text';
  onAnswer: (value?: string | null) => void;
}) {
  const [pressKey, setPressKey] = useState(0);
  const [pressedOption, setPressedOption] = useState<string | null>(null);

  return (
    <div className={cn('grid grid-cols-5', variant === 'image' ? 'gap-1.5 sm:gap-2.5 lg:gap-3' : 'gap-1.5 sm:gap-2')}>
      {baseSet.map((option, index) => {
        const label = String.fromCharCode(65 + index);
        const selected = answers[questionOrder] === option;
        const isPressed = pressedOption === option;
        return (
          <button
            key={option}
            type="button"
            disabled={submitPending}
            onClick={() => {
              setPressedOption(option);
              setPressKey((prev) => prev + 1);
              onAnswer(option);
            }}
            className={cn(
              'transition will-change-transform',
              variant === 'image'
                ? 'rounded-xl border-2 py-3 text-lg font-bold sm:py-4 sm:text-xl lg:rounded-2xl lg:py-5 lg:text-2xl xl:py-6 xl:text-3xl'
                : 'rounded-xl border py-3 text-base font-semibold sm:py-3.5 sm:text-lg',
              selected
                ? variant === 'image'
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                  : 'border-brand-500 bg-brand-50 text-brand-700 shadow-inner'
                : variant === 'image'
                  ? 'border-slate-300 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50/50'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              isPressed && 'animate-cermat-answer-press',
            )}
            onAnimationEnd={() => {
              if (pressedOption === option) setPressedOption(null);
            }}
            data-press={isPressed ? pressKey : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ImageExamContent({
  currentIndex,
  timeLeft,
  answeredCount,
  totalQuestions: _totalQuestions,
  baseSet,
  sequence,
  questionOrder,
  answers,
  submitPending,
  allAnswered,
  sessionIndex,
  totalSessions,
  onAnswer,
  onFinish,
}: {
  currentIndex: number;
  timeLeft: number;
  answeredCount: number;
  totalQuestions: number;
  baseSet: string[];
  sequence: string[];
  questionOrder: number;
  answers: Record<number, string | null>;
  submitPending: boolean;
  allAnswered: boolean;
  sessionIndex: number;
  totalSessions: number;
  onAnswer: (value?: string | null) => void;
  onFinish: () => void;
}) {
  const timerUrgent = timeLeft <= 10;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:gap-5 lg:max-w-5xl lg:flex-1 lg:justify-between lg:gap-3 xl:max-w-6xl">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <StatPill label="Kolom" value={String(currentIndex + 1)} />
        <StatPill label="Durasi" value={formatTimer(timeLeft)} urgent={timerUrgent} />
        <StatPill label="Terjawab" value={String(answeredCount)} />
      </div>

      <section className="overflow-hidden rounded-2xl border-2 border-slate-800 bg-white shadow-sm lg:rounded-3xl">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-center lg:py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 lg:text-xs">Kunci Referensi</p>
        </div>
        <div className="grid grid-cols-5 divide-x divide-slate-200">
          {baseSet.map((token, index) => {
            const label = String.fromCharCode(65 + index);
            return (
              <div
                key={token}
                className={cn(
                  'flex flex-col items-center gap-2 px-0.5 py-4 sm:gap-2.5 sm:py-5 lg:gap-3 lg:py-6',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80',
                )}
              >
                <div className="flex aspect-square h-16 w-16 items-center justify-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:h-20 sm:w-20 lg:h-28 lg:w-28 xl:h-32 xl:w-32">
                  <CermatIcon name={token} strokeWidth={3.5} className="h-full w-full" />
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm lg:h-9 lg:w-9 lg:text-base xl:h-10 xl:w-10">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-3 py-5 sm:px-5 sm:py-6 lg:rounded-3xl lg:px-8 lg:py-7">
        <p className="mb-4 text-center text-xs font-medium text-slate-600 sm:mb-5 sm:text-sm lg:mb-6 lg:text-base">
          Pilih huruf gambar yang <span className="font-semibold text-brand-700">tidak muncul</span>
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-10 xl:gap-12">
          {sequence.map((token, idx) => (
            <div
              key={`${token}-${idx}`}
              className="flex aspect-square h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white p-1.5 shadow-md sm:h-24 sm:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36"
            >
              <CermatIcon name={token} strokeWidth={3.5} className="h-full w-full" />
            </div>
          ))}
        </div>
      </section>

      <AnswerChoiceButtons
        baseSet={baseSet}
        questionOrder={questionOrder}
        answers={answers}
        submitPending={submitPending}
        variant="image"
        onAnswer={onAnswer}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 lg:pb-0">
        <Button variant="ghost" size="sm" onClick={() => onAnswer(null)} disabled={submitPending}>
          Lewati soal
        </Button>
        {allAnswered ? (
          <SessionContinueButton
            sessionIndex={sessionIndex}
            totalSessions={totalSessions}
            submitPending={submitPending}
            onFinish={onFinish}
          />
        ) : null}
      </div>
    </div>
  );
}

function TextExamContent({
  mode,
  modeLabels,
  baseSet,
  sequence,
  questionOrder,
  answers,
  submitPending,
  allAnswered,
  sessionIndex,
  totalSessions,
  onAnswer,
  onFinish,
}: {
  mode: Exclude<CermatMode, 'IMAGE'>;
  modeLabels: CermatExamOverlayProps['modeLabels'];
  baseSet: string[];
  sequence: string[];
  questionOrder: number;
  answers: Record<number, string | null>;
  submitPending: boolean;
  allAnswered: boolean;
  sessionIndex: number;
  totalSessions: number;
  onAnswer: (value?: string | null) => void;
  onFinish: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{modeLabels[mode].reference}</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5 sm:mt-4 sm:gap-3">
          {baseSet.map((token, index) => {
            const label = String.fromCharCode(65 + index);
            return (
              <div key={token} className="flex flex-col items-center gap-1 sm:gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-semibold text-slate-900 shadow-inner sm:h-14 sm:w-14 sm:text-3xl">
                  {token}
                </span>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Deret Soal Aktif</p>
        <div className="mt-3 flex items-center justify-between gap-1.5 sm:mt-4 sm:gap-3">
          {sequence.map((token, idx) => (
            <span
              key={`${token}-${idx}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-900 sm:h-14 sm:w-14 sm:text-2xl"
            >
              {token}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{modeLabels[mode].prompt}</p>
      </div>

      <AnswerChoiceButtons
        baseSet={baseSet}
        questionOrder={questionOrder}
        answers={answers}
        submitPending={submitPending}
        variant="text"
        onAnswer={onAnswer}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <Button variant="ghost" size="sm" onClick={() => onAnswer(null)} disabled={submitPending}>
          Lewati soal
        </Button>
        {allAnswered ? (
          <SessionContinueButton
            sessionIndex={sessionIndex}
            totalSessions={totalSessions}
            submitPending={submitPending}
            onFinish={onFinish}
          />
        ) : null}
      </div>
    </div>
  );
}

function SessionBreakPanel({
  mode,
  nextSessionIndex,
  totalSessions,
  secondsLeft,
  totalSeconds,
  onContinue,
}: {
  mode: CermatMode;
  nextSessionIndex: number;
  totalSessions: number;
  secondsLeft: number;
  totalSeconds: number;
  onContinue: () => void;
}) {
  const safeTotalSeconds = Math.max(1, totalSeconds);
  const radius = 63;
  const circumference = 2 * Math.PI * radius;
  const countdownProgress = Math.min(1, Math.max(0, secondsLeft / safeTotalSeconds));
  const completedSessions = Math.max(0, nextSessionIndex - 1);
  const sessionProgress = Math.min(100, (completedSessions / Math.max(1, totalSessions)) * 100);

  return (
    <div className="relative mx-auto grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1424] text-white shadow-[0_30px_90px_rgba(0,0,0,0.48)] sm:rounded-[32px] lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />

      <section className="relative px-5 pb-5 pt-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <BrandMark variant="icon" size="sm" tone="ink" className="mb-6" />
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-200">
          <Check className="h-3.5 w-3.5" />
          Sesi {completedSessions} selesai
        </span>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Tarik napas.
          <br />
          <span className="text-emerald-300">Sesi {nextSessionIndex}</span> segera dimulai.
        </h2>
        <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-300">
          Gunakan jeda singkat ini untuk kembali fokus. Tetap berada di layar penuh sampai seluruh rangkaian tes selesai.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Progres rangkaian</p>
              <p className="mt-1 truncate text-sm font-extrabold text-white">{CERMAT_MODE_LABELS[mode]}</p>
            </div>
            <p className="shrink-0 text-sm font-extrabold tabular-nums text-emerald-300">
              {completedSessions}/{totalSessions} sesi
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-[width] duration-500"
              style={{ width: `${sessionProgress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="relative flex flex-col items-center justify-center border-t border-white/10 bg-white/[0.025] px-5 py-6 sm:px-8 sm:py-8 lg:border-l lg:border-t-0">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Jeda antar sesi
        </p>
        <div className="relative mt-3 flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
          <div aria-hidden="true" className="absolute inset-6 rounded-full bg-emerald-400/15 blur-2xl" />
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#34d399"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - countdownProgress)}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
            />
          </svg>
          <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/10 bg-[#0d1929]">
            <span className="text-6xl font-extrabold leading-none tracking-tight tabular-nums">{secondsLeft}</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">detik</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
          Sesi berikutnya dimulai otomatis saat waktu habis.
        </p>
        <Button
          type="button"
          className="mt-5 h-10 w-full max-w-xs rounded-full bg-emerald-500 text-xs font-extrabold text-emerald-950 hover:bg-emerald-400"
          onClick={onContinue}
        >
          Mulai Sesi {nextSessionIndex} Sekarang <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>
    </div>
  );
}

export function CermatExamOverlay({
  mode,
  sessionIndex,
  totalSessions,
  currentIndex,
  totalQuestions,
  timeLeft,
  baseSet,
  sequence,
  questionOrder,
  answers,
  submitPending,
  allAnswered,
  modeLabels,
  breakSecondsLeft = null,
  breakSecondsTotal = null,
  nextSessionIndex = null,
  isBreaking = false,
  onAnswer,
  onFinish,
  onContinueBreak,
}: CermatExamOverlayProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  const isImage = mode === 'IMAGE';
  const showBreak =
    isBreaking && typeof breakSecondsLeft === 'number' && typeof nextSessionIndex === 'number';
  const answeredCount = Object.values(answers).filter((value) => typeof value === 'string' && value.length > 0).length;
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col overflow-hidden',
        showBreak ? 'bg-[#050b16]' : isImage ? 'bg-slate-50' : 'bg-[#070b12]',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {!showBreak ? (
        <CermatExamHeader
          mode={mode}
          sessionIndex={sessionIndex}
          totalSessions={totalSessions}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          timeLeft={timeLeft}
        />
      ) : null}

      <main
        className={cn(
          'flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 sm:py-5',
          isImage && !showBreak && 'lg:flex-col lg:overflow-hidden lg:py-4',
          !isImage && !showBreak && 'text-white',
          showBreak && 'items-center justify-center sm:py-6',
        )}
      >
        {showBreak ? (
          <SessionBreakPanel
            mode={mode}
            nextSessionIndex={nextSessionIndex}
            totalSessions={totalSessions}
            secondsLeft={breakSecondsLeft}
            totalSeconds={breakSecondsTotal ?? Math.max(1, breakSecondsLeft)}
            onContinue={() => onContinueBreak?.()}
          />
        ) : (
          <div className={cn(!isImage && 'mx-auto max-w-3xl rounded-3xl bg-white/95 p-4 text-slate-900 shadow-xl sm:p-6')}>
            {isImage ? (
              <ImageExamContent
                currentIndex={currentIndex}
                timeLeft={timeLeft}
                answeredCount={answeredCount}
                totalQuestions={totalQuestions}
                baseSet={baseSet}
                sequence={sequence}
                questionOrder={questionOrder}
                answers={answers}
                submitPending={submitPending}
                allAnswered={allAnswered}
                sessionIndex={sessionIndex}
                totalSessions={totalSessions}
                onAnswer={onAnswer}
                onFinish={onFinish}
              />
            ) : (
              <TextExamContent
                mode={mode}
                modeLabels={modeLabels}
                baseSet={baseSet}
                sequence={sequence}
                questionOrder={questionOrder}
                answers={answers}
                submitPending={submitPending}
                allAnswered={allAnswered}
                sessionIndex={sessionIndex}
                totalSessions={totalSessions}
                onAnswer={onAnswer}
                onFinish={onFinish}
              />
            )}
          </div>
        )}
      </main>
    </div>,
    document.body,
  );
}
