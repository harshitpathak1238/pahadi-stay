import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is below the `md` breakpoint (768px).
 * Starts as `false` on the server (no window), syncs to `true`/`false` in the
 * browser via a resize/matchMedia listener.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
