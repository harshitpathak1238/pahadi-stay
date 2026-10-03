'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Global "slow moment" loader.
 *
 * A progress bar that only appears once a navigation has actually stalled, so
 * quick clicks never flash a loader. It also covers the slow first render of a
 * statically generated page, which route `loading.tsx` files do not cover —
 * those only apply to Suspense boundaries, not to a static chunk still arriving.
 *
 * How it knows a navigation started: an internal link activation arms a timer.
 * If the route has not changed by the time it fires, the click was slow, so the
 * bar appears. A route change disarms it, so instant navigations show nothing.
 */

const SHOW_AFTER_MS = 300;
// Once shown, hold briefly so a fast-but-not-instant load does not flicker.
const MIN_VISIBLE_MS = 500;

function isInternalNavigation(target: EventTarget | null) {
  const anchor = target instanceof Element ? target.closest('a[href]') : null;
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  // New tab / download / same-page anchors do not trigger a route change.
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    return `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
  } catch {
    return false;
  }
}

export function RouteProgressLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = `${pathname}?${searchParams.toString()}`;
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A completed navigation means the page is ready: disarm and fade out.
  useEffect(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (!visible) return;
    const hide = setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [route]);

  useEffect(() => {
    const arm = () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    };
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event.target)) arm();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (isInternalNavigation(event.target)) arm();
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="route-progress" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

