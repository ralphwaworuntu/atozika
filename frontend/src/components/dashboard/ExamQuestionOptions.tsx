import { getAssetUrl } from '@/lib/media';
import { examOptionClass } from '@/components/dashboard/ExamTakingOverlay';

const LETTER_TONE = [
  'bg-amber-400 text-slate-900 border-amber-300',
  'bg-orange-500 text-white border-orange-300',
  'bg-emerald-500 text-white border-emerald-300',
  'bg-purple-500 text-white border-purple-300',
  'bg-pink-500 text-white border-pink-300',
];

export type ExamOption = {
  id: string;
  label: string;
  imageUrl?: string | null;
};

type ExamQuestionOptionsProps = {
  questionId: string;
  options: ExamOption[];
  multipleCorrect: boolean;
  selectedIds: string[];
  onSelectSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
};

export function ExamQuestionOptions({
  options,
  multipleCorrect,
  selectedIds,
  onSelectSingle,
  onToggleMulti,
}: ExamQuestionOptionsProps) {
  const choices = options ?? [];
  return (
    <>
      {choices.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        const active = selectedIds.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => (multipleCorrect ? onToggleMulti(option.id) : onSelectSingle(option.id))}
            className={examOptionClass(active)}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black shadow-md ${LETTER_TONE[index % LETTER_TONE.length]}`}>
              {letter}
            </span>
            <span className="min-w-0 text-base font-bold text-white sm:text-lg">
              <span className="whitespace-pre-wrap break-words">{option.label}</span>
              {option.imageUrl ? (
                <img src={getAssetUrl(option.imageUrl)} alt="" className="mt-2 max-h-24 rounded-lg object-contain" />
              ) : null}
            </span>
          </button>
        );
      })}
    </>
  );
}
