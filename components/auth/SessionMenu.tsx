'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { isAdminUser } from '@/lib/admin-emails';

/**
 * Session-aware header controls.
 *
 * This used to be read on the server inside the root layout via `auth()`.
 * That call reads cookies, which marks every route dynamic and forced a
 * database/session round-trip on each request. Moving it to the client lets
 * the shared HTML shell be prerendered and served from cache; the account
 * button simply hydrates a moment later.
 */

export function SessionMenu() {
  const { data: session, status } = useSession();
  const isAdmin = isAdminUser(session?.user);

  // While the session is still resolving, render a same-sized placeholder so
  // the header never jumps when the real control mounts.
  if (status === 'loading') {
    return <span aria-hidden className="h-10 w-[68px] shrink-0 rounded-full bg-[#eef1ee] md:w-[76px]" />;
  }

  const user = session?.user;
  if (!user) {
    return (
      <Link href="/login" className="shrink-0 rounded-full bg-[#065f46] px-4 py-2 text-sm font-bold text-white transition active:scale-95 md:border md:border-[#d6d9d1] md:bg-transparent md:font-semibold md:text-[#065f46] md:hover:border-[#065f46] md:hover:bg-[#f4f6f1] md:dark:border-white/15 md:dark:text-[#e8e8e8] md:dark:hover:bg-white/10">
        Sign in
      </Link>
    );
  }

  return (
    <>
      {isAdmin && (
        <Link href="/admin" className="hidden rounded-full bg-[#065f46] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#047857] md:block">Admin</Link>
      )}
      <span className="shrink-0 [&_summary]:!grid [&_summary]:!h-10 [&_summary]:!w-10">
        <AccountMenu name={user.name} email={user.email} isAdmin={isAdmin} />
      </span>
    </>
  );
}
