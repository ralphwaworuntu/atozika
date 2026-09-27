import { cn } from '@/utils/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-brand-400/20 dark:bg-ink-800', className)}>
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
};

export function CardHeader({ children, className, title, subtitle }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-slate-100 px-5 py-3 dark:border-brand-400/15', className)}>
      {title && <p className="type-h2 text-slate-900 dark:text-ink-50">{title}</p>}
      {subtitle && <p className="type-caption mt-0.5 text-slate-500">{subtitle}</p>}
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('type-h2 text-slate-900 dark:text-ink-50', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: CardProps) {
  return <p className={cn('type-body text-slate-600', className)}>{children}</p>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
