'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function MobileMenu({ isAdmin, isSignedIn = false }: { isAdmin: boolean; isSignedIn?: boolean }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const close = () => menuRef.current?.removeAttribute('open');

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.removeAttribute('open');
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') menuRef.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return <details ref={menuRef} className="mobile-menu relative md:hidden">
    {/* Keep link order aligned with the nth-child icon styles in globals.css. */}
    <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#d6d9d1] text-lg text-[#173f35]" aria-label="Open navigation"><span aria-hidden="true">☰</span></summary>
    <nav className="absolute right-0 top-14 z-30 grid min-w-52 gap-1 rounded-2xl border border-[#dfe3d8] bg-white p-2 text-sm text-[#173f35] shadow-2xl" aria-label="Mobile navigation">
      <Link href="/stays" onClick={close}>Stays</Link><Link href="/rides" onClick={close}>Rides</Link><Link href="/rentals" onClick={close}>Rentals</Link><Link href="/packages" onClick={close}>Packages</Link><Link href="/blog" onClick={close}>Journal</Link><Link href="/activities" onClick={close}>Experiences</Link><Link href="/" onClick={close}>Home</Link><Link href="/partner/login" onClick={close}>List your place</Link>{isSignedIn ? <Link href="/account" onClick={close}>My account</Link> : <Link href="/login" onClick={close}>Sign in</Link>}{isAdmin && <Link href="/admin" onClick={close}>Admin workspace</Link>}
    </nav>
  </details>;
}
