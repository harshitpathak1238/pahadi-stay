'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The site ships light-only: `enableSystem` is intentionally off so a device
  // set to dark never flips the first paint, and `defaultTheme` is light for
  // anyone without a saved preference. The header toggle still lets a visitor
  // opt into dark, which is why we don't lock the class off entirely.
  return <NextThemesProvider attribute="class" defaultTheme="light" storageKey="kainchi-theme">{children}</NextThemesProvider>;
}
