'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { UserRound, LogOut } from 'lucide-react';

export function AccountMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const initials = (name || email || 'A').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return <details className="account-menu relative">
    <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-[#d6d9d1] bg-white px-2 text-[#173f35] shadow-sm" aria-label="Open account menu">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7eadf] text-xs font-bold text-[#24584a]">{initials}</span>
      <span className="hidden max-w-24 truncate text-xs font-bold sm:block">{name || 'Account'}</span>
    </summary>
    <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-[#dfe3d8] bg-white p-2 text-[#173f35] shadow-2xl">
      <div className="border-b border-[#e7e9e3] px-3 py-2"><p className="truncate text-sm font-bold">{name || 'Your account'}</p><p className="truncate sans text-xs text-[#6c7770]">{email}</p></div>
      <Link href="/account" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 sans text-sm hover:bg-[#f1f3ed]"><UserRound size={16} /> My account</Link>
      <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 sans text-left text-sm text-[#9f5938] hover:bg-[#fff0e8]"><LogOut size={16} /> Sign out</button>
    </div>
  </details>;
}
