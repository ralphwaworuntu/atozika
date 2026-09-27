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
  'rounded-2xl border-2 border-[#3c82ce] bg-gradient-to-b from-[#2b6cb0] to-[#1e528d] p-3 px-4 text-left text-white shadow-[0_5px_0_#12345e] transition active:translate-y-[3px] active:shadow-[0_2px_0_#12345e]';
const optionSelected =
  'border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] shadow-[0_5px_0_#065f46]';

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
      className="fixed inset-0 z-[9999] overflow-y-auto p-4 text-white md:p-6 lg:p-8"
      style={{
        backgroundColor: '#1a2536',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 28%), radial-gradient(circle at 90% 85%, rgba(59, 130, 246, 0.09) 0%, transparent 32%), radial-gradient(rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px)',
        backgroundSize: '100% 100%, 100% 100%, 28px 28px',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="grid w-full grid-cols-1 items-center gap-4 md:grid-cols-3">
          <div className="flex items-center justify-center md:justify-start">
            <div className="inline-flex items-center gap-2.5 rounded-full border-[3px] border-emerald-400 bg-emerald-950/80 px-5 py-2.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <span className="animate-pulse text-xl leading-none">⏰</span>
              <span className="text-xl font-black tracking-wider">{timeLeftLabel ?? '--:--'}</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-xs items-center gap-3 rounded-full border-[3px] border-[#2c476c] bg-[#152338] px-3 py-2">
              <div className="h-4 w-24 overflow-hidden rounded-full border border-[#1f3757] bg-[#0a1320] p-0.5">
                <div className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-extrabold">
                <span className="text-base text-amber-400">⭐</span>
                <span>Soal {current} / {total || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#1f736c] bg-[#112d3b] px-5 py-2.5 shadow-[0_4px_12px_rgba(15,118,110,0.3)]">
              <span className="text-lg leading-none">🏳️</span>
              <span className="text-sm font-black tracking-wide text-emerald-300">{category}</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <section className="flex flex-col gap-5 lg:col-span-8">
            <article className="flex min-h-[460px] flex-col justify-between rounded-[28px] border-4 border-slate-200/90 bg-white p-6 text-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:p-8 md:p-9">
              {children}
            </article>
            <nav className="flex flex-wrap items-center justify-between gap-3 pt-2" aria-label="Navigasi soal">
              <button
                type="button"
                onClick={onPrev}
                disabled={isFirst}
                className="flex items-center gap-2 rounded-2xl border-2 border-[#60a5fa] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-6 py-3.5 text-base font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-[3px] active:shadow-[0_2px_0_#1e3a8a] disabled:opacity-40"
              >
                <span>❮</span>
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activeId) return;
                  setFlagged((currentFlags) => ({ ...currentFlags, [activeId]: !currentFlags[activeId] }));
                }}
                className="flex items-center gap-2 rounded-2xl border-2 border-[#fbbf24] bg-gradient-to-b from-[#f59e0b] to-[#d97706] px-6 py-3.5 text-base font-black text-white shadow-[0_5px_0_#92400e] active:translate-y-[3px] active:shadow-[0_2px_0_#92400e]"
              >
                <span>🚩</span>
                <span>Ragu-Ragu</span>
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={isLast}
                className="flex items-center gap-2 rounded-2xl border-2 border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] px-7 py-3.5 text-base font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-[3px] active:shadow-[0_2px_0_#065f46] disabled:opacity-40"
              >
                <span>Selanjutnya</span>
                <span>❯</span>
              </button>
            </nav>
          </section>

          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-4 rounded-[28px] border-[3px] border-[#293d59] bg-[#192638] p-5 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between border-b border-slate-700/50 px-1 pb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Nomor Soal</span>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {answeredCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {flaggedCount}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> {emptyCount}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onFinish}
                  disabled={submitPending}
                  className="flex-1 rounded-2xl border-2 border-[#34d399] bg-gradient-to-b from-[#10b981] to-[#059669] px-4 py-3 text-sm font-black text-white shadow-[0_5px_0_#065f46] disabled:opacity-50"
                >
                  {finishLabel}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-2xl border-2 border-[#60a5fa] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] px-4 py-3 text-sm font-black text-white shadow-[0_5px_0_#1e3a8a]"
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
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Pertanyaan {index + 1}:</h2>
        <div className="space-y-2 text-base font-bold leading-relaxed text-slate-700 sm:text-lg md:text-xl">
          <p className="whitespace-pre-wrap break-words">{prompt}</p>
          {multipleCorrect ? <p className="text-sm font-semibold text-slate-500">Pilih semua jawaban yang benar.</p> : null}
        </div>
        {imageUrl ? <img src={imageUrl} alt="" className="max-h-64 w-full rounded-2xl object-contain" /> : null}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">{children}</div>
    </>
  );
}

export const examOptionClass = (active: boolean) => cn(optionBtn, 'flex items-center gap-3.5', active && optionSelected);
export const examOptionSelectedClass = optionSelected;
