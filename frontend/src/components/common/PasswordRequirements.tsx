import { Check, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { passwordRules } from '@/lib/password';

type PasswordRequirementsProps = {
  value: string;
  className?: string;
};

export function PasswordRequirements({ value, className }: PasswordRequirementsProps) {
  return (
    <ul className={cn('mt-2 grid gap-1.5 sm:grid-cols-2', className)} aria-live="polite">
      {passwordRules.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-medium sm:text-xs',
              passed ? 'text-success-500' : 'text-slate-400 dark:text-ink-200/70',
            )}
          >
            {passed ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
