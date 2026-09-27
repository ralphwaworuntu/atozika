import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/utils/cn';

type BrandMarkSize = 'sm' | 'md' | 'lg';

type BrandMarkProps = {
  size?: BrandMarkSize;
  variant?: 'full' | 'compact' | 'icon';
  tagline?: string;
  showTagline?: boolean;
  framed?: boolean;
  href?: string;
  className?: string;
  trailing?: ReactNode;
  tone?: 'default' | 'ink';
  forceTheme?: 'light' | 'dark';
};

const taglineStyles: Record<BrandMarkSize, string> = {
  sm: 'text-[10px] font-medium',
  md: 'text-[11px] font-medium sm:text-xs',
  lg: 'text-xs font-medium',
};

export function BrandMark({
  size = 'md',
  variant = 'full',
  tagline = 'Menempa Intelektual, Mengunci Kelulusan.',
  showTagline = true,
  framed: _framed = false,
  href,
  className,
  trailing,
  tone = 'default',
  forceTheme,
}: BrandMarkProps) {
  const logoSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const ink = tone === 'ink';
  const showMeta = variant !== 'icon' && ((showTagline && variant === 'full') || Boolean(trailing));
  const logoTheme = forceTheme ?? (ink ? 'dark' : undefined);

  const content = (
    <div className={cn('flex min-w-0 items-center gap-2.5 sm:gap-3', className)}>
      <div className="flex shrink-0 items-center justify-center">
        <BrandLogo size={logoSize} priority={variant !== 'icon'} forceTheme={logoTheme} />
      </div>

      {showMeta ? (
        <div className="min-w-0 flex-1">
          {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
          {showTagline && variant === 'full' ? (
            <p className={cn(trailing ? 'mt-0.5' : '', 'truncate', taglineStyles[size], ink ? 'text-brand-300' : 'text-slate-500')}>
              {tagline}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex min-w-0 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
