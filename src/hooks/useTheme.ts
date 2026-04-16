import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'arb_theme';
const LEGACY_KEY = 'apc_theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  let stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    stored = window.localStorage.getItem(LEGACY_KEY);
    if (stored) {
      window.localStorage.setItem(STORAGE_KEY, stored);
      window.localStorage.removeItem(LEGACY_KEY);
    }
  }
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

/**
 * Theme hook with localStorage persistence. Syncs the `.dark` class on <html>.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}
