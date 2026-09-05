'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, BookOpen, ClipboardList, ExternalLink, FileImage, LayoutDashboard, Menu, Settings, Truck, UserRound, Users, WalletCards, X } from 'lucide-react';

const navigation = [
  ['Dashboard', LayoutDashboard, '/admin'],
  ['Orders', ClipboardList, '/admin/orders'],
  ['Listings', ClipboardList, '/admin/listings'],
  ['Stays', ClipboardList, '/admin/stays'],
  ['Rides', ClipboardList, '/admin/rides'],
  ['Rentals', ClipboardList, '/admin/rentals'],
  ['Activities', ClipboardList, '/admin/activities'],
  ['Packages', ClipboardList, '/admin/packages'],
  ['Blog', BookOpen, '/admin/blog'],
  ['Media Library', FileImage, '/admin/media'],
  ['Customers', Users, '/admin/customers'],
  ['Users', Users, '/admin/users'],
  ['Partners', UserRound, '/admin/partners'],
  ['Pickups & Vehicles', Truck, '/admin/pickups'],
  ['Payouts', WalletCards, '/admin/payouts'],
  ['Analytics', BarChart3, '/admin/analytics'],
  ['Settings', Settings, '/admin/settings'],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === '/admin') return <>{children}</>;
  const active = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href);
  return <div className="admin-shell admin-soft-workspace min-h-screen text-[#27302d]">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[252px] border-r border-[#e1e1e3] bg-white p-3 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-12 items-center gap-2 px-3 text-[17px] font-bold"><img src="/images/Logo.png" alt="Kainchi Darshan" className="h-8 w-auto object-contain" /> Admin Panel</div>
      <nav className="mt-5 grid gap-1">{navigation.map(([label, Icon, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex h-9 items-center gap-3 rounded-[4px] px-3 text-[13px] ${active(href) ? 'bg-[#e9e9eb] font-semibold text-[#303030]' : 'text-[#616161] hover:bg-[#f5f5f5]'}`}><Icon size={17} />{label}</Link>)}</nav>
      <Link href="/" className="absolute bottom-5 left-6 flex items-center gap-2 text-[12px] font-semibold text-[#616161] hover:text-[#303030]"><ExternalLink size={15} /> View website</Link>
    </aside>
    {open && <button aria-label="Close admin navigation" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}
    <main className="min-w-0 lg:pl-[252px]"><header className="flex h-16 items-center justify-between border-b border-[#e1e1e3] bg-white px-4 md:px-7"><div className="flex items-center gap-3"><button aria-label="Open admin navigation" className="rounded-[4px] p-2 lg:hidden" onClick={() => setOpen(true)}><Menu size={19} /></button><div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8a8a8a]">Pahadi Stay</p><p className="text-[18px] font-semibold">Admin</p></div></div><button aria-label="Close navigation" className="hidden rounded-[4px] p-2 text-[#777]" onClick={() => setOpen(false)}><X size={18} /></button></header>{children}</main>
  </div>;
}
