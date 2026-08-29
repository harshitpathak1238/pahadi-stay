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
    className="theme-toggle relative h-7 w-[52px] shrink-0 rounded-full bg-[#e2e5df] transition-colors duration-[400ms] ease-out dark:bg-slate-700"
  >
    <Sun size={12} strokeWidth={2.5} aria-hidden="true" className="absolute left-[7px] top-[7px] text-[#8a6a3e] dark:text-slate-300" />
    <Moon size={12} strokeWidth={2.5} aria-hidden="true" className="absolute right-[7px] top-[7px] text-[#526057] dark:text-[#d6a06d]" />
    <span className={`theme-toggle-thumb absolute left-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-full bg-white text-[#b66b45] shadow-[0_2px_6px_rgba(22,35,29,.25)] transition-transform duration-[400ms] ease-out dark:bg-[#e8e8e8] ${isDark ? 'translate-x-6 rotate-12' : 'translate-x-0 -rotate-12'}`}>
      <span className="relative grid h-4 w-4 place-items-center" aria-hidden="true"><Sun size={13} className={`absolute transition-all duration-[400ms] ease-out ${isDark ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`} /><Moon size={13} className={`absolute transition-all duration-[400ms] ease-out ${isDark ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} /></span>
    </span>
  </button>;
}
