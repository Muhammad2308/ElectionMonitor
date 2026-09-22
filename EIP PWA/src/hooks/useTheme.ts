import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const storageKey = 'eip-theme';

const preferredTheme = (): Theme => {
  const saved = localStorage.getItem(storageKey);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(preferredTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(storageKey, theme); }, [theme]);
  const toggleTheme = useCallback(() => setTheme((current) => current === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggleTheme };
}
