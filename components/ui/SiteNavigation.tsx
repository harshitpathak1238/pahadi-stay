'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';

const links = [
  ['/', 'Home'],
  ['/stays', 'Stays'],
  ['/rides', 'Rides'],
  ['/rentals', 'Rentals'],
  ['/packages', 'Packages'],
  ['/blog', 'Journal'],
  ['/activities', 'Experiences'],
] as const;

export function SiteNavigation() {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const navigation = navigationRef.current;
      const activeLink = activeRef.current;
      if (!navigation || !activeLink) return;
      const navigationBounds = navigation.getBoundingClientRect();
      const linkBounds = activeLink.getBoundingClientRect();
      setIndicator({ left: linkBounds.left - navigationBounds.left, width: linkBounds.width });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [pathname]);

  return <nav ref={navigationRef} className="nav-shell hidden items-center gap-7 text-sm font-semibold text-[#526057] md:flex" aria-label="Primary navigation">{links.map(([href, label]) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return <Link key={href} href={href} ref={active ? activeRef : undefined} className={`nav-link ${active ? 'nav-link-active' : ''}`}>{label}</Link>;
  })}<span aria-hidden="true" className="nav-indicator" style={{ left: indicator.left, width: indicator.width }} /></nav>;
}
