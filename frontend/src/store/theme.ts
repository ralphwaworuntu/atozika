import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme, THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const cycle: ThemeMode[] = ['light', 'dark', 'system'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
      cycleMode: () => {
        const current = get().mode;
        const next = cycle[(cycle.indexOf(current) + 1) % cycle.length] ?? 'dark';
        applyTheme(next);
        set({ mode: next });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.mode ?? 'dark');
      },
    },
  ),
);
