'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function MobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.removeAttribute('open');
    };
    document.addEventListener('pointerdown', closeWhenOutside);
    return () => document.removeEventListener('pointerdown', closeWhenOutside);
  }, []);

  return <details ref={menuRef} className="mobile-menu relative md:hidden">
    <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#d6d9d1] text-lg text-[#173f35]" aria-label="Open navigation"><span aria-hidden="true">☰</span></summary>
    <nav className="absolute right-0 top-12 z-30 grid min-w-48 gap-1 rounded-2xl border border-[#dfe3d8] bg-white p-2 text-sm text-[#173f35] shadow-2xl">
      <Link href="/stays">Stays</Link><Link href="/rides">Rides</Link><Link href="/rentals">Rentals</Link><Link href="/packages">Packages</Link><Link href="/blog">Journal</Link><Link href="/activities">Experiences</Link><Link href="/partner/login">List your place</Link>{isAdmin && <Link href="/admin">Admin workspace</Link>}
    </nav>
  </details>;
}
