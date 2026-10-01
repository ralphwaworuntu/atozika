import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

type ExamTakingOverlayProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  subtitle?: string;
  timeLeftLabel?: string | null;
  questions: Array<{ id: string }>;
  answers: Record<string, string[]>;
  activeIndex: number;
  onJump: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onCancel: () => void;
  submitPending?: boolean;
  finishLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
};

const optionBtn =
  'rounded-xl border-2 border-[#3c82ce] bg-gradient-to-b from-[#2b6cb0] to-[#1e528d] p-2.5 px-3 text-left text-white shadow-[0_4px_0_#12345e] transition active:translate-y-[2px] active:shadow-[0_1px_0_#12345e] sm:rounded-2xl sm:p-3 sm:px-4 sm:shadow-[0_5px_0_#12345e]';
const optionSelected =
  'border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] shadow-[0_4px_0_#065f46] sm:shadow-[0_5px_0_#065f46]';

export function ExamTakingOverlay({
  open,
  eyebrow,
  title,
  subtitle,
  timeLeftLabel,
  questions,
  answers,
  activeIndex,
  onJump,
  onPrev,
  onNext,
  onFinish,
  onCancel,
  submitPending = false,
  finishLabel = 'Akhiri sesi',
  cancelLabel = 'Batalkan',
  children,
}: ExamTakingOverlayProps) {
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const total = questions.length;
  const current = Math.min(activeIndex + 1, total);
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= total - 1;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length,
    [answers, questions],
  );
  const flaggedCount = questions.filter((q) => flagged[q.id]).length;
  const emptyCount = Math.max(0, total - answeredCount);
  const progress = total ? Math.round((current / total) * 100) : 0;
  const activeId = questions[activeIndex]?.id;
  const category = subtitle || title || eyebrow;

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col overflow-hidden text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#1a2536',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 28%), radial-gradient(circle at 90% 85%, rgba(59, 130, 246, 0.09) 0%, transparent 32%), radial-gradient(rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px)',
        backgroundSize: '100% 100%, 100% 100%, 28px 28px',
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-6">
        <header className="grid w-full shrink-0 grid-cols-1 items-center gap-2 sm:gap-3 md:grid-cols-3">
          <div className="flex items-center justify-center md:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border-[3px] border-emerald-400 bg-emerald-950/80 px-4 py-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] sm:px-5 sm:py-2">
              <span className="animate-pulse text-lg leading-none sm:text-xl">⏰</span>
              <span className="text-lg font-black tracking-wider sm:text-xl">{timeLeftLabel ?? '--:--'}</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-xs items-center gap-2 rounded-full border-[3px] border-[#2c476c] bg-[#152338] px-3 py-1.5 sm:gap-3 sm:py-2">
              <div className="h-3.5 w-20 overflow-hidden rounded-full border border-[#1f3757] bg-[#0a1320] p-0.5 sm:h-4 sm:w-24">
                <div className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold sm:text-sm">
                <span className="text-sm text-amber-400 sm:text-base">⭐</span>
                <span>Soal {current} / {total || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border-[3px] border-[#1f736c] bg-[#112d3b] px-4 py-1.5 shadow-[0_4px_12px_rgba(15,118,110,0.3)] sm:px-5 sm:py-2">
              <span className="text-base leading-none sm:text-lg">🏳️</span>
              <span className="truncate text-xs font-black tracking-wide text-emerald-300 sm:text-sm">{category}</span>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
          <section className="flex min-h-0 flex-col gap-2.5 lg:col-span-8 lg:gap-3">
            <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border-4 border-slate-200/90 bg-white text-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:rounded-[28px]">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6">
                {children}
              </div>
            </article>
            <nav className="flex shrink-0 flex-wrap items-center justify-between gap-2" aria-label="Navigasi soal">
              <button
                type="button"
                onClick={onPrev}
                disabled={isFirst}
                className="flex items-center gap-2 rounded-xl border-2 border-[#60a5fa] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#1e3a8a] active:translate-y-[2px] active:shadow-[0_1px_0_#1e3a8a] disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
              >
                <span>❮</span>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activeId) return;
                  setFlagged((currentFlags) => ({ ...currentFlags, [activeId]: !currentFlags[activeId] }));
                }}
                className="flex items-center gap-2 rounded-xl border-2 border-[#fbbf24] bg-gradient-to-b from-[#f59e0b] to-[#d97706] px-4 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#92400e] active:translate-y-[2px] active:shadow-[0_1px_0_#92400e] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
              >
                <span>🚩</span>
                <span>Ragu-Ragu</span>
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={isLast}
                className="flex items-center gap-2 rounded-xl border-2 border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] px-4 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#065f46] active:translate-y-[2px] active:shadow-[0_1px_0_#065f46] disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <span>❯</span>
              </button>
            </nav>

            <div className="flex shrink-0 flex-col gap-2 rounded-[18px] border-[3px] border-[#293d59] bg-[#192638] p-2.5 lg:hidden">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nomor Soal</span>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {answeredCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> {flaggedCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> {emptyCount}</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto overscroll-contain pb-0.5">
                {questions.map((question, index) => {
                  const answered = (answers[question.id]?.length ?? 0) > 0;
                  const active = index === activeIndex;
                  const marked = Boolean(flagged[question.id]);
                  return (
                    <button
                      key={`mobile-${question.id}`}
                      type="button"
                      onClick={() => onJump(index)}
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white',
                        active && 'border-2 border-dashed border-[#fbbf24] bg-[#334155] text-amber-300',
                        !active && marked && 'bg-[#f59e0b]',
                        !active && !marked && answered && 'bg-[#10b981]',
                        !active && !marked && !answered && 'bg-[#64748b]',
                      )}
                    >
                      {marked && !active ? '🚩' : answered && !active ? '✓' : index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onFinish}
                  disabled={submitPending}
                  className="flex-1 rounded-xl border-2 border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] px-3 py-2 text-xs font-black text-white shadow-[0_3px_0_#065f46] disabled:opacity-50"
                >
                  {finishLabel}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl border-2 border-[#60a5fa] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-3 py-2 text-xs font-black text-white shadow-[0_3px_0_#1e3a8a]"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </section>

          <aside className="hidden min-h-0 lg:col-span-4 lg:flex">
            <div className="flex min-h-0 w-full flex-col gap-3 rounded-[28px] border-[3px] border-[#293d59] bg-[#192638] p-5 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 px-1 pb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Nomor Soal</span>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {answeredCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {flaggedCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> {emptyCount}</span>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((question, index) => {
                    const answered = (answers[question.id]?.length ?? 0) > 0;
                    const active = index === activeIndex;
                    const marked = Boolean(flagged[question.id]);
                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => onJump(index)}
                        className={cn(
                          'flex h-10 items-center justify-center rounded-xl text-sm font-black text-white active:translate-y-0.5',
                          active && 'animate-pulse border-2 border-dashed border-[#fbbf24] bg-[#334155] text-amber-300 shadow-[0_0_0_3px_#fbbf24]',
                          !active && marked && 'bg-[#f59e0b] shadow-[0_3px_0_#b45309]',
                          !active && !marked && answered && 'bg-[#10b981] shadow-[0_3px_0_#047857]',
                          !active && !marked && !answered && 'bg-[#64748b] text-white/90 shadow-[0_3px_0_#334155]',
                        )}
                      >
                        {marked && !active ? '🚩' : answered && !active ? '✓' : index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={onFinish}
                  disabled={submitPending}
                  className="flex-1 rounded-2xl border-2 border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#065f46] disabled:opacity-50"
                >
                  {finishLabel}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-2xl border-2 border-[#60a5fa] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#1e3a8a]"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>,
    document.body,
  );
}

type ExamQuestionPanelProps = {
  index: number;
  prompt: string;
  imageUrl?: string | null;
  multipleCorrect?: boolean;
  children: ReactNode;
};

export function ExamQuestionPanel({ index, prompt, imageUrl, multipleCorrect, children }: ExamQuestionPanelProps) {
  return (
    <div className="flex min-h-full flex-col justify-between gap-4">
      <div className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Pertanyaan {index + 1}:</h2>
        <div className="space-y-2 text-sm font-bold leading-relaxed text-slate-700 sm:text-base md:text-lg">
          <p className="whitespace-pre-wrap break-words">{prompt}</p>
          {multipleCorrect ? <p className="text-sm font-semibold text-slate-500">Pilih semua jawaban yang benar.</p> : null}
        </div>
        {imageUrl ? <img src={imageUrl} alt="" className="max-h-40 w-full rounded-2xl object-contain sm:max-h-48" /> : null}
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">{children}</div>
    </div>
  );
}

export const examOptionClass = (active: boolean) => cn(optionBtn, 'flex items-center gap-3', active && optionSelected);
export const examOptionSelectedClass = optionSelected;
