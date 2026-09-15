import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { SiteNavigation } from '@/components/ui/SiteNavigation';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { auth } from '@/lib/auth';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { TripCartProvider, TripSummary } from '@/components/trip/TripCart';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const display = { variable: '' };
const sans = { variable: '' };

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: { default: 'KainchiDarshan | See Kumaon differently', template: '%s | KainchiDarshan' }, description: 'Thoughtfully chosen stays, rides and experiences around Bhimtal and Kainchi Dham.', metadataBase: new URL('http://localhost:3000'), icons: { icon: [{ url: '/images/Logo.png', type: 'image/png' }], shortcut: [{ url: '/images/Logo.png', type: 'image/png' }], apple: [{ url: '/images/Logo.png', type: 'image/png' }] } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = headers().get('x-pathname') || '';
  if (pathname.startsWith('/admin')) {
    return <html lang="en"><body>{children}</body></html>;
  }
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  const isAdmin = Boolean(session?.user?.email && adminEmails.includes(session.user.email.toLowerCase()));
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body><ThemeProvider><TripCartProvider>
        <SiteHeader initialHero={pathname === '/'}>
            <Link href="/" aria-label="KainchiDarshan home" className="shrink-0"><Image src="/images/Logo.png" alt="Kainchi Darshan" width={210} height={80} priority className="h-8 w-auto object-contain sm:h-9 md:h-11" /></Link>
            <SiteNavigation />
            <div className="flex items-center gap-1.5 text-sm sm:gap-2 md:gap-3">
              <span className="hidden md:block"><ThemeToggle /></span>
              <Link href="/partner/login" className="hidden items-center gap-1.5 rounded-full border border-[#dfe3d8] px-3.5 py-1.5 text-sm font-semibold text-[#526057] transition hover:border-[#cbd5cf] hover:text-[#173f35] md:inline-flex">List your place</Link>
              {isAdmin && <Link href="/admin" className="hidden rounded-full bg-[#173f35] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#24584a] md:block">Admin</Link>}
              <span className="shrink-0 [&_summary]:!grid [&_summary]:!h-10 [&_summary]:!w-10">{session?.user ? <AccountMenu name={session.user.name} email={session.user.email} isAdmin={isAdmin} /> : <Link href="/login" className="shrink-0 rounded-full bg-[#173f35] px-4 py-2 text-sm font-bold text-white transition active:scale-95 md:border md:border-[#d6d9d1] md:bg-transparent md:font-semibold md:text-[#173f35] md:hover:border-[#173f35] md:hover:bg-[#f4f6f1] md:dark:border-white/15 md:dark:text-[#e8e8e8] md:dark:hover:bg-white/10">Sign in</Link>}</span>
              <MobileMenu isAdmin={isAdmin} isSignedIn={Boolean(session?.user)} />
            </div>
        </SiteHeader>
        <main className={`pb-24 lg:pb-0${pathname === '/' ? '' : ' site-header-padding'}`}>{children}</main>
        <TripSummary />
        <SiteFooter />
      </TripCartProvider></ThemeProvider></body>
    </html>
  );
}
