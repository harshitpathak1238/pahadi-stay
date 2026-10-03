'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Supplies `useSession` to the header chrome.
 *
 * `SessionProvider` is a client boundary by design: it fetches the session
 * over HTTP after mount rather than receiving it from the server render. That
 * is what allows the root layout to stay prerenderable — a server-side
 * `auth()` would read cookies and opt every page out of static rendering.
 *
 * The placeholder reserves the same footprint as the real control so the
 * header does not shift when the session resolves.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
