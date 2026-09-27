import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useThemeStore } from '@/store/theme';
import type { ThemeMode } from '@/lib/theme';

const labels: Record<ThemeMode, string> = {
  light: 'Mode terang',
  dark: 'Mode gelap',
  system: 'Ikuti sistem',
};

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
  tone?: 'default' | 'navy';
};

export function ThemeToggle({ className, compact = true, tone = 'default' }: ThemeToggleProps) {
  const mode = useThemeStore((state) => state.mode);
  const cycleMode = useThemeStore((state) => state.cycleMode);
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const navy = tone === 'navy';

  return (
    <button
      type="button"
      onClick={cycleMode}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border shadow-sm transition',
        navy
          ? 'border-brand-400/40 bg-white/5 text-ink-50 hover:border-brand-400 hover:bg-white/10 hover:text-brand-300'
          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-700',
        compact ? 'h-9 w-9' : 'h-10 gap-2 px-3 text-xs font-semibold',
        className,
      )}
      aria-label={`${labels[mode]}. Klik untuk mengganti tema.`}
      title={`${labels[mode]} — klik untuk ganti`}
    >
      <Icon className="h-4 w-4" />
      {compact ? null : <span>{labels[mode]}</span>}
    </button>
  );
}
