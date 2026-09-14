'use client';

import { useCallback, useEffect, useState } from 'react';

// Module-level cache: every component using useWishlist on the page shares one
// fetch and stays in sync instantly (optimistic toggle + shared state).
let sharedSlugs: string[] | null = null;
let inflight: Promise<void> | null = null;
const subscribers = new Set<(slugs: string[]) => void>();

function publish(slugs: string[]) {
  sharedSlugs = slugs;
  subscribers.forEach((notify) => notify(slugs));
}

async function load(force = false) {
  if (sharedSlugs && !force) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const response = await fetch('/api/wishlist', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        publish(Array.isArray(data.slugs) ? data.slugs : []);
      }
    } catch { /* offline or unauthenticated — hearts stay neutral */ } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useWishlist() {
  const [slugs, setSlugs] = useState<string[]>(sharedSlugs ?? []);

  useEffect(() => {
    subscribers.add(setSlugs);
    if (sharedSlugs) setSlugs(sharedSlugs);
    else load();
    return () => { subscribers.delete(setSlugs); };
  }, []);

  const toggle = useCallback(async (slug: string) => {
    const current = sharedSlugs ?? [];
    const isSaved = current.includes(slug);
    publish(isSaved ? current.filter((item) => item !== slug) : [...current, slug]);
    const response = await fetch('/api/wishlist', {
      method: isSaved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(isSaved ? {} : { body: JSON.stringify({ slug }) }),
    });
    if (response.status === 401) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    if (!response.ok) await load(true); // revert to server truth on failure
  }, []);

  return {
    slugs,
    hydrated: sharedSlugs !== null,
    isWishlisted: (slug: string) => slugs.includes(slug),
    toggle,
  };
}
