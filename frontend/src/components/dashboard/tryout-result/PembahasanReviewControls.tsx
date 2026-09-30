import { useState, type FormEvent, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { ExamReviewQuestionItem } from '@/components/dashboard/ExamReviewQuestions';
import { getUserSelectedIds } from '@/lib/examAnswers';
import { cn } from '@/utils/cn';

export type PembahasanFilterKey = 'all' | 'correct' | 'wrong' | 'doubt';

const FILTER_OPTIONS: Array<{ key: PembahasanFilterKey; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'correct', label: 'Benar' },
  { key: 'wrong', label: 'Salah' },
  { key: 'doubt', label: 'Ragu-ragu' },
];

export function isDoubtfulQuestion(question: ExamReviewQuestionItem) {
  return getUserSelectedIds(question).length === 0;
}

export function filterPembahasanQuestions(
  questions: ExamReviewQuestionItem[],
  filters: Set<PembahasanFilterKey>,
) {
  if (filters.has('all') || filters.size === 0) return questions;
  return questions.filter((question) => {
    const correct = question.isCorrect || question.gradeStatus === 'correct';
    const doubt = isDoubtfulQuestion(question);
    if (filters.has('correct') && correct) return true;
    if (filters.has('wrong') && !correct && !doubt) return true;
    if (filters.has('doubt') && doubt) return true;
    return false;
  });
}

export function PembahasanReviewToolbar({
  filters,
  onChangeFilters,
  hideExplanation,
  onToggleHideExplanation,
  counts,
}: {
  filters: Set<PembahasanFilterKey>;
  onChangeFilters: (next: Set<PembahasanFilterKey>) => void;
  hideExplanation: boolean;
  onToggleHideExplanation: (value: boolean) => void;
  counts: { all: number; correct: number; wrong: number; doubt: number };
}) {
  const toggleFilter = (key: PembahasanFilterKey) => {
    const next = new Set(filters);
    if (key === 'all') {
      onChangeFilters(new Set(['all']));
      return;
    }
    next.delete('all');
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (next.size === 0) next.add('all');
    onChangeFilters(next);
  };

  return (
    <div className="member-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Filter</p>
        {FILTER_OPTIONS.map((option) => {
          const checked = filters.has(option.key);
          const count =
            option.key === 'all'
              ? counts.all
              : option.key === 'correct'
                ? counts.correct
                : option.key === 'wrong'
                  ? counts.wrong
                  : counts.doubt;
          return (
            <label
              key={option.key}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition',
                checked
                  ? 'border-member-500 bg-member-50 text-member-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-ink-200',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleFilter(option.key)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-member-600 focus:ring-member-500"
              />
              <span>
                {option.label}
                <span className="ml-1 tabular-nums text-slate-400">({count})</span>
              </span>
            </label>
          );
        })}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-ink-100">
        <span>Hide explanation</span>
        <span
          className={cn(
            'relative h-5 w-9 rounded-full transition',
            hideExplanation ? 'bg-member-600' : 'bg-slate-300 dark:bg-slate-600',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
              hideExplanation ? 'left-4' : 'left-0.5',
            )}
          />
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={hideExplanation}
          onChange={(event) => onToggleHideExplanation(event.target.checked)}
        />
      </label>
    </div>
  );
}

export function ReportQuestionModal({
  open,
  question,
  tryoutName,
  onClose,
}: {
  open: boolean;
  question: ExamReviewQuestionItem | null;
  tryoutName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState('Soal / opsi bermasalah');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const defaults = useMemo(
    () => ({
      name: user?.name?.trim() || 'Member ATOZIKA',
      email: user?.email?.trim() || 'member@atozika.id',
    }),
    [user?.email, user?.name],
  );

  if (!open || !question || typeof document === 'undefined') return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const detail = note.trim();
    if (detail.length < 5) {
      toast.error('Tuliskan detail minimal 5 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/contact', {
        name: defaults.name,
        email: defaults.email,
        phone: '',
        message: `[Laporan Soal Tryout]\nTryout: ${tryoutName}\nSoal #${question.order} (${question.id})\nAlasan: ${reason}\nDetail: ${detail}\nPrompt: ${question.prompt.slice(0, 180)}`,
      });
      toast.success('Laporan soal terkirim ke admin');
      setNote('');
      onClose();
    } catch {
      toast.error('Gagal mengirim laporan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-ink-50">Laporkan soal ke admin</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-500">
            Soal #{question.order} · {question.prompt.slice(0, 90)}
            {question.prompt.length > 90 ? '…' : ''}
          </p>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Alasan</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-member-500 dark:border-white/10 dark:bg-ink-800 dark:text-ink-50"
            >
              <option>Soal / opsi bermasalah</option>
              <option>Kunci jawaban diduga salah</option>
              <option>Pembahasan kurang jelas</option>
              <option>Gambar / media rusak</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Detail singkat</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Jelaskan masalahnya secara singkat…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-member-500 dark:border-white/10 dark:bg-ink-800 dark:text-ink-50"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-ink-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-member-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-member-700 disabled:opacity-60"
            >
              {submitting ? 'Mengirim…' : 'Kirim laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
