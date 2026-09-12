'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const root = document.documentElement;
    const button = document.querySelector<HTMLButtonElement>('.theme-toggle');

    if (button) {
      const bounds = button.getBoundingClientRect();
      root.style.setProperty('--theme-toggle-x', `${bounds.left + bounds.width / 2}px`);
      root.style.setProperty('--theme-toggle-y', `${bounds.top + bounds.height / 2}px`);
    }

    root.classList.add('theme-transitioning');
    const updateTheme = () => setTheme(nextTheme);
    const transitionDocument = document as Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
    const transition = transitionDocument.startViewTransition?.(updateTheme);
    if (transition) transition.finished.finally(() => root.classList.remove('theme-transitioning'));
    else {
      updateTheme();
      window.setTimeout(() => root.classList.remove('theme-transitioning'), 400);
    }
  };

  return <button
    type="button"
    onClick={toggleTheme}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    aria-pressed={isDark}
    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    className="theme-toggle grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#526057] transition hover:bg-[#eef3ed] dark:text-[#e8e8e8] dark:hover:bg-white/10"
  >
    {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
  </button>;
}
