export const LOGO_LIGHT_SRC = '/logo-green.png';
export const LOGO_DARK_SRC = '/logo-white.png';

export function logoSrcForTheme(theme: 'light' | 'dark') {
  return theme === 'dark' ? LOGO_DARK_SRC : LOGO_LIGHT_SRC;
}
