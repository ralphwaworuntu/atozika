import { cn } from '@/utils/cn';
import { LOGO_DARK_SRC, LOGO_LIGHT_SRC } from '@/lib/brand';

type AtozikaMascotProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function AtozikaMascot({ className, size = 'md' }: AtozikaMascotProps) {
  const box = size === 'lg' ? 'h-[4.25rem] w-[4.25rem]' : size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <div className={cn('relative flex shrink-0 items-center justify-center', box, className)} aria-hidden>
      <img src={LOGO_LIGHT_SRC} alt="" className="h-full w-full object-contain object-center dark:hidden" />
      <img src={LOGO_DARK_SRC} alt="" className="hidden h-full w-full object-contain object-center dark:block" />
    </div>
  );
}
