import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Panel style for admin pages only — keeps member/public headers unchanged. */
  variant?: 'default' | 'panel';
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  variant = 'default',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4',
        variant === 'panel' && 'admin-page-intro',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow-label">{eyebrow}</p>}
        <h1 className={cn('type-h1 text-slate-900 dark:text-ink-50', eyebrow && 'mt-2')}>{title}</h1>
        {description && (
          <p className="type-body mt-2 max-w-2xl text-slate-600 dark:text-ink-200">{description}</p>
        )}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-command text-brand-500">{eyebrow}</p>
        )}
        <h2 className={cn('mt-2 text-slate-900 dark:text-ink-50', titleClassName ?? 'type-h1')}>
          {title}
        </h2>
        {description && <p className="type-body mt-2 text-slate-600 dark:text-ink-200">{description}</p>}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
