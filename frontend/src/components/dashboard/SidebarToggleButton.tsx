import { Menu } from 'lucide-react';
import { cn } from '@/utils/cn';

type SidebarToggleButtonProps = {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
  tone?: 'default' | 'navy';
};

export function SidebarToggleButton({
  onClick,
  className,
  ariaLabel = 'Buka menu sidebar',
  tone = 'default',
}: SidebarToggleButtonProps) {
  const navy = tone === 'navy';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'group relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-all duration-200 active:scale-[0.97]',
        navy
          ? 'border-brand-400/40 bg-white/5 text-brand-300 hover:border-brand-400 hover:bg-white/10 hover:text-brand-200'
          : 'border-brand-200/90 bg-brand-50 text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-100 hover:text-brand-800',
        className,
      )}
    >
      <Menu className="relative h-[1.125rem] w-[1.125rem] stroke-[2.5px]" />
    </button>
  );
}
