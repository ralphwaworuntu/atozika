import { cn } from '@/utils/cn';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { logoSrcForTheme } from '@/lib/brand';

type LogoSize = 'sm' | 'md' | 'lg';

type BrandLogoProps = {
  className?: string;
  alt?: string;
  priority?: boolean;
  size?: LogoSize;
  forceTheme?: 'light' | 'dark';
};

const sizeStyles: Record<LogoSize, { className: string; width: number; height: number }> = {
  sm: {
    className: 'h-11 w-auto sm:h-12 lg:h-14',
    width: 56,
    height: 56,
  },
  md: {
    className: 'h-12 w-auto sm:h-14 lg:h-16',
    width: 64,
    height: 64,
  },
  lg: {
    className: 'h-14 w-auto lg:h-16 xl:h-[4.5rem]',
    width: 72,
    height: 72,
  },
};

export function BrandLogo({ className, alt = 'ATOZIKA', priority = false, size = 'md', forceTheme }: BrandLogoProps) {
  const theme = useResolvedTheme();
  const styles = sizeStyles[size];
  const src = logoSrcForTheme(forceTheme ?? theme);

  return (
    <img
      src={src}
      alt={alt}
      width={styles.width}
      height={styles.height}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('brand-logo shrink-0 object-contain', styles.className, className)}
    />
  );
}
