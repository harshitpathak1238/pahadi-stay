'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BedDouble,
  CarFront,
  ChevronRight,
  Handshake,
  Home,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Mail,
  Moon,
  Newspaper,
  Package,
  Phone,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL, WHATSAPP_NUMBER } from '@/lib/contact';
import { isAdminUser } from '@/lib/admin-emails';
import { WhatsAppMark } from './WhatsAppButton';

/**
 * Admin visibility is decided from the session role (see `lib/admin-emails`).
 * That list only decides whether to *show* an admin link — real access is still
 * enforced server-side in `middleware.ts` and `lib/admin.ts`.
 */

const links = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/stays', label: 'Stays', Icon: BedDouble },
  { href: '/rides', label: 'Rides', Icon: CarFront },
  { href: '/rentals', label: 'Rentals', Icon: KeyRound },
  { href: '/packages', label: 'Packages', Icon: Package },
  { href: '/blog', label: 'Journal', Icon: Newspaper },
  { href: '/activities', label: 'Experiences', Icon: Sparkles },
] as const;

/**
 * Session state is resolved here on the client via `useSession` rather than
 * being passed down from the root layout. Passing it in meant the layout had to
 * call `auth()` (which reads cookies), forcing every page to render
 * dynamically and defeating prerendering.
 */
export function MobileMenu() {
  const { data: session, status } = useSession();
  const isAdmin = isAdminUser(session?.user);
  const isSignedIn = status === 'authenticated' && Boolean(session?.user);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open ]);

  const openDrawer = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('kainchi-theme', next ? 'dark' : 'light');
    } catch {
      /* theme preference is best-effort */
    }
  }, [dark]);

  const isDark = dark;

  const drawer =
    open && mounted
      ? createPortal(
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-[#0c231d]/55" />
          <aside className="mobile-drawer absolute inset-y-0 right-0 flex w-[87%] max-w-[360px] flex-col overflow-hidden rounded-l-[1.75rem] bg-[#fbfaf6] shadow-2xl dark:bg-[#1d1f1e]">
            <div className="shrink-0 px-4 pb-2 pt-3">
              <div className="mobile-drawer-handle mx-auto h-1 w-9 rounded-full bg-[#e2e4da] dark:bg-white/15" aria-hidden="true" />
              <div className="mt-2.5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#b66b45]">Explore Kumaon</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#e2e4da] text-[#065f46] transition hover:bg-[#eef2eb] dark:border-white/15 dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3">
              <nav className="mobile-drawer-links flex flex-col gap-0.5" aria-label="Mobile navigation">
                {links.map(({ href, label, Icon }) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[15px] font-semibold transition active:scale-[.99] ${
                        active
                          ? 'bg-[#065f46] text-white shadow-[0_8px_18px_rgba(6,95,70,.25)] dark:bg-[#e8e8e8] dark:text-[#065f46]'
                          : 'text-[#23332e] hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10'
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                        active ? 'bg-white/15 dark:bg-[#065f46]/10' : 'bg-[#eef2eb] text-[#047857] group-hover:bg-[#e2eae1] dark:bg-white/10 dark:text-[#d5eadb]'
                      }`}>
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      {label}
                      <ChevronRight size={15} aria-hidden="true" className={`ml-auto shrink-0 ${active ? 'opacity-70' : 'opacity-25'}`} />
                    </Link>
                  );
                })}
              </nav>
              <div className="my-2 h-px bg-[#e5e7e0] dark:bg-white/10" aria-hidden="true" />

              <div className="mobile-drawer-links flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef2eb] text-[#047857] dark:bg-white/10 dark:text-[#d5eadb]">
                    {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
                  </span>
                  {isDark ? 'Light mode' : 'Dark mode'}
                  <span aria-hidden="true" className={`relative ml-auto h-6 w-11 shrink-0 rounded-full p-0.5 transition ${isDark ? 'bg-[#047857]' : 'bg-[#d6d9d1]'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                </button>
                <Link
                  href="/partner/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef2eb] text-[#047857] dark:bg-white/10 dark:text-[#d5eadb]">
                    <Handshake size={17} aria-hidden="true" />
                  </span>
                  List your place
                </Link>
                {isSignedIn ? (
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef2eb] text-[#047857] dark:bg-white/10 dark:text-[#d5eadb]">
                      <UserRound size={17} aria-hidden="true" />
                    </span>
                    My account
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#065f46] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[.99] dark:bg-[#e8e8e8] dark:text-[#065f46]"
                  >
                    <LogIn size={16} aria-hidden="true" />
                    Sign in
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef2eb] text-[#047857] dark:bg-white/10 dark:text-[#d5eadb]">
                      <LayoutDashboard size={17} aria-hidden="true" />
                    </span>
                    Admin workspace
                  </Link>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-[#e7e9e3] bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-center gap-2">
                <p className="shrink-0 text-[10px] font-bold uppercase tracking-[.2em] text-[#b66b45]">Need a hand?</p>
                <span className="h-px flex-1 bg-[#e7e9e3] dark:bg-white/10" aria-hidden="true" />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={`mailto:${SITE_EMAIL}`}
                  aria-label="Email support"
                  title={SITE_EMAIL}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e2e4da] bg-white text-[#047857] transition hover:bg-[#eef2eb] dark:border-white/15 dark:bg-white/10 dark:text-[#d5eadb]"
                >
                  <Mail size={16} aria-hidden="true" />
                </a>
                <a
                  href={`tel:${SITE_PHONE_TEL}`}
                  aria-label={`Call ${SITE_PHONE_DISPLAY}`}
                  title={SITE_PHONE_DISPLAY}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e2e4da] bg-white text-[#047857] transition hover:bg-[#eef2eb] dark:border-white/15 dark:bg-white/10 dark:text-[#d5eadb]"
                >
                  <Phone size={16} aria-hidden="true" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Namaste! I need help planning my Kumaon trip.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-[13px] font-bold text-white transition hover:bg-[#1eb85a] active:scale-[.99]"
                >
                  <WhatsAppMark size={15} /> WhatsApp us
                </a>
              </div>
            </footer>
          </aside>
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label="Open navigation menu"
        aria-expanded={open}
        data-testid="mobile-menu-button"
        className="grid h-11 w-11 shrink-0 cursor-pointer touch-manipulation place-items-center text-[#065f46] transition hover:opacity-70 active:scale-95 dark:text-[#e8e8e8] md:hidden"
      >
        <span aria-hidden="true" className="pointer-events-none flex w-6 flex-col gap-[5px]">
          <span className="block h-[2.5px] w-full rounded-full bg-current" />
          <span className="block h-[2.5px] w-4/5 rounded-full bg-current" />
          <span className="block h-[2.5px] w-full rounded-full bg-current" />
        </span>
      </button>
      {drawer}
    </>
  );
}
