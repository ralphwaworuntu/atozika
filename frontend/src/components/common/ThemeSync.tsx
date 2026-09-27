import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { applyTheme } from '@/lib/theme';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { useThemeStore } from '@/store/theme';

export function ThemeSync() {
  const mode = useThemeStore((state) => state.mode);
  const resolved = useResolvedTheme();

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(useThemeStore.getState().mode);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <Toaster
      theme={resolved}
      richColors
      position="top-center"
      closeButton
    />
  );
}
