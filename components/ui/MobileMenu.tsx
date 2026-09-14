'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BedDouble,
  CarFront,
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
import { WhatsAppMark } from './WhatsAppButton';

const links = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/stays', label: 'Stays', Icon: BedDouble },
  { href: '/rides', label: 'Rides', Icon: CarFront },
  { href: '/rentals', label: 'Rentals', Icon: KeyRound },
  { href: '/packages', label: 'Packages', Icon: Package },
  { href: '/blog', label: 'Journal', Icon: Newspaper },
  { href: '/activities', label: 'Experiences', Icon: Sparkles },
] as const;

export function MobileMenu({ isAdmin, isSignedIn = false }: { isAdmin: boolean; isSignedIn?: boolean }) {
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
          <aside className="mobile-drawer absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-hidden rounded-l-[1.75rem] bg-[#fbfaf6] shadow-2xl dark:bg-[#1d1f1e]">
            <div className="mobile-drawer-handle mx-auto mt-2.5 h-1 w-10 rounded-full bg-[#e2e4da] dark:bg-white/15" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pb-3 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#b66b45]">Explore Kumaon</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e2e4da] text-[#173f35] dark:border-white/15 dark:text-[#e8e8e8]"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <nav className="mobile-drawer-links flex-1 overflow-y-auto px-3 pb-3" aria-label="Mobile navigation">
              {links.map(({ href, label, Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[15px] font-semibold transition active:scale-[.99] ${
                      active
                        ? 'bg-[#173f35] text-white shadow-[0_10px_24px_rgba(23,63,53,.28)] dark:bg-[#e8e8e8] dark:text-[#173f35]'
                        : 'text-[#23332e] hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10'
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                      active ? 'bg-white/15 dark:bg-[#173f35]/10' : 'bg-[#eef2eb] text-[#24584a] group-hover:bg-[#e2eae1] dark:bg-white/10 dark:text-[#d5eadb]'
                    }`}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    {label}
                    <span aria-hidden="true" className={`ml-auto text-lg leading-none ${active ? 'opacity-70' : 'opacity-30'}`}>›</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[#e7e9e3] bg-white/60 px-3 pb-5 pt-3 dark:border-white/10 dark:bg-white/[.02]">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#24584a] dark:bg-white/10 dark:text-[#d5eadb]">
                  {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
                </span>
                {isDark ? 'Light mode' : 'Dark mode'}
                <span aria-hidden="true" className={`relative ml-auto h-6 w-11 shrink-0 rounded-full p-0.5 transition ${isDark ? 'bg-[#24584a]' : 'bg-[#d6d9d1]'}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>
              <Link
                href="/partner/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#24584a] dark:bg-white/10 dark:text-[#d5eadb]">
                  <Handshake size={19} aria-hidden="true" />
                </span>
                List your place
              </Link>
              {isSignedIn ? (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#24584a] dark:bg-white/10 dark:text-[#d5eadb]">
                    <UserRound size={19} aria-hidden="true" />
                  </span>
                  My account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[#173f35] px-3.5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,63,53,.28)] transition active:scale-[.99] dark:bg-[#e8e8e8] dark:text-[#173f35]"
                >
                  <LogIn size={17} aria-hidden="true" />
                  Sign in
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#23332e] transition hover:bg-[#eef2eb] dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#24584a] dark:bg-white/10 dark:text-[#d5eadb]">
                    <LayoutDashboard size={19} aria-hidden="true" />
                  </span>
                  Admin workspace
                </Link>
              )}
              <div className="mt-2 rounded-2xl border border-[#e4e3da] bg-[#f4f6f1] p-3.5 dark:border-white/10 dark:bg-white/5">
                <p className="px-1 text-[11px] font-bold uppercase tracking-[.22em] text-[#b66b45]">Need a hand?</p>
                <a
                  href={`mailto:${SITE_EMAIL}`}
                  className="mt-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-white dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173f35] text-white dark:bg-[#e8e8e8] dark:text-[#173f35]">
                    <Mail size={16} aria-hidden="true" />
                  </span>
                  <span className="break-all text-[13px]">{SITE_EMAIL}</span>
                </a>
                <a
                  href={`tel:${SITE_PHONE_TEL}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-[#23332e] transition hover:bg-white dark:text-[#e8e8e8] dark:hover:bg-white/10"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#24584a] ring-1 ring-[#e4e3da] dark:bg-white/10 dark:text-[#d5eadb] dark:ring-white/10">
                    <Phone size={16} aria-hidden="true" />
                  </span>
                  {SITE_PHONE_DISPLAY}
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Namaste! I need help planning my Kumaon trip.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1eb85a] active:scale-[.99]"
                >
                  <WhatsAppMark size={16} /> WhatsApp us
                </a>
              </div>
            </div>
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
        className="grid h-11 w-11 shrink-0 cursor-pointer touch-manipulation place-items-center text-[#173f35] transition hover:opacity-70 active:scale-95 dark:text-[#e8e8e8] md:hidden"
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
