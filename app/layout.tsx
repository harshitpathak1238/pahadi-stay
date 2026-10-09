import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { SiteNavigation } from '@/components/ui/SiteNavigation';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { SessionMenu } from '@/components/auth/SessionMenu';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { TripCartProvider, TripSummary } from '@/components/trip/TripCart';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RouteProgressLoader } from '@/components/ui/RouteProgressLoader';

// Self-hosted via next/font so the browser never waits on a render-blocking
// Google Fonts stylesheet (the old `@import` in globals.css showed up in
// PageSpeed as a render-blocking request with FCP/LCP chained behind it).
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

const display = { variable: '' };
const sans = { variable: '' };

// Public pages are safe to prerender and revalidate: every catalogue read goes
// through the Redis/memory cache in `@/lib/cache`, and admin mutations call
// `revalidatePath` + `cacheDeletePrefix` to invalidate. The previous
// `force-dynamic` disabled prerendering for the entire site, which meant a
// database round-trip on every single request.
//
// Auth is deliberately NOT read here. Calling `auth()` used `cookies()` and
// forced dynamic rendering again; `SessionMenu` now reads the session on the
// client so the shell stays cacheable.
export const revalidate = 60;

export const metadata: Metadata = { title: { default: 'KainchiDarshan | See Kumaon differently', template: '%s | KainchiDarshan' }, description: 'Thoughtfully chosen stays, rides and experiences around Bhimtal and Kainchi Dham.', metadataBase: new URL('http://localhost:3000'), icons: { icon: [{ url: '/images/Logo.png', type: 'image/png' }], shortcut: [{ url: '/images/Logo.png', type: 'image/png' }], apple: [{ url: '/images/Logo.png', type: 'image/png' }] } };

// Keeps the browser's own chrome (scrollbars, form controls, autofill) light
// even on a device configured for dark, matching the site's light default.
export const viewport: Viewport = { colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${inter.variable}`}>
      <head>
        {/* Early connection to the image CDN: the LCP hero photo lives on
            Unsplash, so resolving DNS/TLS before the <img> keeps it off the
            critical path (PageSpeed "render-blocking requests"). */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body><ThemeProvider><AuthProvider><TripCartProvider>
        <SiteHeader>
            <Link href="/" aria-label="KainchiDarshan home" className="shrink-0"><Image src="/images/Logo.png" alt="Kainchi Darshan" width={210} height={80} priority className="h-8 w-auto object-contain sm:h-9 md:h-11" /></Link>
            <SiteNavigation />
            <div className="flex items-center gap-1.5 text-sm sm:gap-2 md:gap-3">
              <span className="hidden md:block"><ThemeToggle /></span>
              <Link href="/partner/login" className="hidden items-center gap-1.5 rounded-full border border-[#dfe3d8] px-3.5 py-2 text-sm font-semibold text-[#526057] transition hover:border-[#cbd5cf] hover:text-[#173f35] md:inline-flex">List your place</Link>
              {/* Session-aware chrome lives in client components so this layout
                  never reads cookies and can be prerendered + cached. */}
              <SessionMenu />
              <Suspense fallback={null}><MobileMenu /></Suspense>
              <Suspense fallback={null}><RouteProgressLoader /></Suspense>
            </div>
        </SiteHeader>
        <MainRegion>{children}</MainRegion>
        <TripSummary />
        <SiteFooter />
      </TripCartProvider></AuthProvider></ThemeProvider></body>
    </html>
  );
}

/**
 * Applies the fixed-header offset to every page except the home hero.
 *
 * This previously read `x-pathname` from the request headers, which opted the
 * whole site into dynamic rendering. Deciding in CSS removes the request
 * dependency entirely: the home page is the only one with a `.hero-wash`
 * element, so a parent selector can give it no padding and pad everything else.
 */
function MainRegion({ children }: { children: React.ReactNode }) {
  return <main className="main-region">{children}</main>;
}
