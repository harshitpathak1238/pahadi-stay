'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Heart, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function AccountMenu({ name, email, isAdmin = false }: { name?: string | null; email?: string | null; isAdmin?: boolean }) {
  const initials = (name || email || 'A').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.removeAttribute('open');
    };
    document.addEventListener('pointerdown', closeWhenOutside);
    return () => document.removeEventListener('pointerdown', closeWhenOutside);
  }, []);

  return (
    <details ref={menuRef} className="account-menu relative">
      <summary
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-[#d6d9d1] bg-white text-xs font-bold text-[#24584a] shadow-[0_2px_10px_rgba(23,63,53,.06)] transition hover:border-[#24584a] hover:bg-[#f2f5ef] dark:border-white/15 dark:hover:bg-white/10"
        aria-label="Open account menu"
      >
        {initials}
      </summary>
      <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-[#dfe3d8] bg-white text-[#173f35] shadow-[0_18px_44px_rgba(23,63,53,.16),0_2px_10px_rgba(23,63,53,.06)]">
        <div className="flex items-center gap-3 border-b border-[#eef1ec] px-3.5 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7eadf] text-sm font-bold text-[#24584a]">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{name || 'Your account'}</p>
            <p className="truncate sans text-xs text-[#6c7770]">{email}</p>
          </div>
        </div>
        <div className="grid gap-0.5 p-1.5">
          <Link href="/account" className="flex items-center gap-3 rounded-xl px-3 py-2.5 sans text-sm font-semibold transition hover:bg-[#f2f5ef] dark:hover:bg-white/10"><UserRound size={16} className="shrink-0 text-[#24584a]" /> My account</Link>
          <Link href="/account/wishlist" className="flex items-center gap-3 rounded-xl px-3 py-2.5 sans text-sm font-semibold transition hover:bg-[#f2f5ef] dark:hover:bg-white/10"><Heart size={16} className="shrink-0 text-[#b66b45]" /> My wishlist</Link>
          {isAdmin && <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 sans text-sm font-semibold transition hover:bg-[#f2f5ef] dark:hover:bg-white/10"><LayoutDashboard size={16} className="shrink-0 text-[#24584a]" /> Admin dashboard</Link>}
        </div>
        <div className="border-t border-[#eef1ec] p-1.5">
          <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 sans text-left text-sm font-semibold text-[#9f5938] transition hover:bg-[#fdf1e6] dark:hover:bg-white/10"><LogOut size={16} className="shrink-0" /> Sign out</button>
        </div>
      </div>
    </details>
  );
}
