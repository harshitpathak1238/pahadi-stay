import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { SiteNavigation } from '@/components/ui/SiteNavigation';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { auth } from '@/lib/auth';
import { WhatsAppButton, defaultWhatsAppMessage } from '@/components/ui/WhatsAppButton';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { TripCartProvider, TripSummary } from '@/components/trip/TripCart';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CategoryRail } from '@/components/ui/CategoryRail';

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
        <header className="site-header sans">
          <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 py-2 md:min-h-[82px] md:px-5">
            <Link href="/" aria-label="KainchiDarshan home" className="shrink-0"><Image src="/images/Logo.png" alt="Kainchi Darshan" width={210} height={80} priority className="h-12 w-auto object-contain md:h-14" /></Link>
            <SiteNavigation />
            <div className="flex items-center gap-2 text-sm md:gap-3">
              <ThemeToggle />
              <Link href="/partner/login" className="hidden font-semibold text-[#526057] dark:text-[#b8c8bd] md:block">List your place</Link>
              {isAdmin && <Link href="/admin" className="hidden rounded-full bg-[#173f35] px-3 py-2 font-bold text-white transition hover:bg-[#24584a] md:block">Admin</Link>}
              {session?.user ? <AccountMenu name={session.user.name} email={session.user.email} isAdmin={isAdmin} /> : <Link href="/login" className="shrink-0 rounded-full border border-[#d6d9d1] px-3 py-2 font-semibold text-[#173f35] transition hover:bg-[#f1f3ed] dark:border-white/15 dark:text-[#e8e8e8] dark:hover:bg-white/10 md:px-4">Sign in</Link>}
              <MobileMenu isAdmin={isAdmin} />
            </div>
          </div>
        </header><CategoryRail />
        <main>{children}</main>
        <TripSummary /><WhatsAppButton message={defaultWhatsAppMessage} children={<span className="hidden sm:inline">Chat with us on WhatsApp</span>} className="whatsapp-float fixed bottom-5 left-5 z-50 h-14 w-14 rounded-full border-0 !bg-[#25D366] p-0 !text-white shadow-[0_4px_14px_rgba(18,120,64,.28)] hover:!bg-[#128C7E] sm:h-auto sm:w-auto sm:px-4 sm:py-3" />
        <footer className="sans mt-20 bg-[#173f35] px-5 py-14 text-[#f7f4ec]">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
            <div><Image src="/images/Logo.png" alt="Kainchi Darshan" width={210} height={80} className="h-14 w-auto object-contain" /><p className="mt-3 max-w-xs text-sm leading-6 text-white/60">A slower, more thoughtful way to see Kumaon.</p></div>
            <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#d6a06d]">Explore</p><div className="grid gap-2 text-sm text-white/75"><Link href="/stays">Stays around Bhimtal</Link><Link href="/packages">Curated packages</Link><Link href="/about">Our story</Link></div></div>
            <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#d6a06d]">Need a hand?</p><p className="text-sm leading-6 text-white/75">hello@pahadi.stay<br/>+91 98765 43210</p></div>
          </div>
        </footer>
      </TripCartProvider></ThemeProvider></body>
    </html>
  );
}
