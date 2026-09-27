export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'atozika-theme';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#070b12' : '#f4efe4');
  }
}

export function readStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw) as { state?: { mode?: ThemeMode } };
    const mode = parsed.state?.mode;
    if (mode === 'light' || mode === 'dark' || mode === 'system') return mode;
  } catch {
    /* ignore */
  }
  return 'dark';
}
