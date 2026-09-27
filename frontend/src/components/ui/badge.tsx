import { cn } from '@/utils/cn';

type BadgeVariant = 'brand' | 'outline' | 'success' | 'muted';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    brand: 'bg-brand-50 text-brand-700 border border-brand-200',
    outline: 'border border-slate-200 text-slate-600 bg-white dark:border-brand-400/25 dark:bg-ink-800 dark:text-ink-200',
    success: 'bg-success-50 text-success-700 border border-success-100',
    muted: 'border border-slate-200 bg-slate-50 text-[#718096]',
  };

  return (
    <span
      className={cn('type-caption inline-flex items-center rounded-full px-3 py-1 not-italic', variants[variant], className)}
    >
      {children}
    </span>
  );
}
