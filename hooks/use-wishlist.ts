'use client';

import { useCallback, useEffect, useState } from 'react';

// Module-level cache: every component using useWishlist on the page shares one
// fetch and stays in sync instantly (optimistic toggle + shared state).
let sharedSlugs: string[] | null = null;
let inflight: Promise<void> | null = null;
const subscribers = new Set<(slugs: string[]) => void>();

/**
 * A save is celebrated once, for the whole page, rather than once per button.
 * `SaveButton` renders inside every card of a results grid, so the overlay is
 * driven from here and mounted a single time by `WishlistCelebrationHost`.
 */
export type WishlistCelebration = { slug: string; title: string } | null;
let celebration: WishlistCelebration = null;
const celebrationSubscribers = new Set<(value: WishlistCelebration) => void>();

function publishCelebration(value: WishlistCelebration) {
  celebration = value;
  celebrationSubscribers.forEach((notify) => notify(celebration));
}

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

  const toggle = useCallback(async (slug: string, title?: string) => {
    const current = sharedSlugs ?? [];
    const isSaved = current.includes(slug);
    publish(isSaved ? current.filter((item) => item !== slug) : [...current, slug]);
    // Only a save is celebrated. Removing is already answered by the heart
    // going flat again, which needs no interruption.
    if (!isSaved && title) publishCelebration({ slug, title });
    try {
      // DELETE takes the slug as a query param (API contract, same as WishlistWorkspace).
      // Sending a bodyless DELETE used to hit the API's 400 "Invalid stay reference." guard.
      const response = await fetch(
        isSaved ? `/api/wishlist?slug=${encodeURIComponent(slug)}` : '/api/wishlist',
        isSaved
          ? { method: 'DELETE' }
          : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) },
      );
      if (response.status === 401) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!response.ok) await load(true); // revert to server truth on failure
    } catch {
      await load(true); // network error — revert to server truth too
    }
  }, []);

  return {
    slugs,
    hydrated: sharedSlugs !== null,
    isWishlisted: (slug: string) => slugs.includes(slug),
    toggle,
  };
}

/**
 * Subscribes to the page-wide save celebration.
 *
 * Mounted once per page (see `WishlistCelebrationHost`) so a grid of twenty
 * cards still produces exactly one overlay.
 */
export function useWishlistCelebration() {
  const [current, setCurrent] = useState<WishlistCelebration>(celebration);

  useEffect(() => {
    celebrationSubscribers.add(setCurrent);
    if (celebration) setCurrent(celebration);
    return () => { celebrationSubscribers.delete(setCurrent); };
  }, []);

  const dismiss = useCallback(() => publishCelebration(null), []);

  return { celebration: current, dismiss };
}
