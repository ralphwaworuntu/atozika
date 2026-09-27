import { useEffect, useState } from 'react';
import { resolveTheme, type ResolvedTheme } from '@/lib/theme';
import { useThemeStore } from '@/store/theme';

export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemeStore((state) => state.mode);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    const sync = () => setResolved(resolveTheme(useThemeStore.getState().mode));
    sync();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [mode]);

  return resolved;
}
