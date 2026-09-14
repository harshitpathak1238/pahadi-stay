import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, CarFront, KeyRound, Mail, MapPin, Newspaper, Package, Phone, Sparkles } from 'lucide-react';
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL, WHATSAPP_NUMBER } from '@/lib/contact';
import { WhatsAppMark } from './WhatsAppButton';

const explore = [
  { href: '/stays', label: 'Stays around Bhimtal', Icon: BedDouble },
  { href: '/packages', label: 'Curated packages', Icon: Package },
  { href: '/rides', label: 'Rides & transfers', Icon: CarFront },
  { href: '/rentals', label: 'Bike & scooty rentals', Icon: KeyRound },
  { href: '/activities', label: 'Experiences', Icon: Sparkles },
  { href: '/blog', label: 'Journal', Icon: Newspaper },
];

const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Namaste! I am planning a trip to Kumaon and would like help with stays and packages.')}`;

export function SiteFooter() {
  return (
    <footer className="sans relative mt-20 overflow-hidden bg-[#0e2b23] text-[#f4f1e7]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#24584a]/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-[#b66b45]/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-8 md:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_.9fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white/95 p-1 shadow-lg">
                <Image src="/images/Logo.png" alt="Kainchi Darshan" width={96} height={96} className="h-full w-full object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold tracking-wide text-[#f0c28f]">KAINCHI</span>
                <span className="block text-[11px] font-bold uppercase tracking-[.34em] text-white/70">Darshan</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              A slower, more thoughtful way to see Kumaon — handpicked stays, local drivers and honest pricing around
              Bhimtal &amp; Kainchi Dham.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-white/45">
              <MapPin size={14} className="text-[#d6a06d]" /> Bhimtal · Kainchi Dham · Nainital
            </p>
          </div>
          <nav aria-label="Explore">
            <p className="text-[11px] font-extrabold uppercase tracking-[.28em] text-[#e2a76f]">Explore</p>
            <ul className="mt-4 grid gap-1">
              {explore.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#e2a76f] ring-1 ring-white/10 transition group-hover:bg-[#b66b45] group-hover:text-white">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.28em] text-[#e2a76f]">Need a hand?</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <a href={`mailto:${SITE_EMAIL}`} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#b66b45] text-white">
                  <Mail size={16} aria-hidden="true" />
                </span>
                <span className="break-all">{SITE_EMAIL}</span>
              </a>
              <a href={`tel:${SITE_PHONE_TEL}`} className="mt-1 flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f0c28f] ring-1 ring-white/15">
                  <Phone size={16} aria-hidden="true" />
                </span>
                {SITE_PHONE_DISPLAY}
              </a>
              <a href={waHref} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,211,102,.35)] transition hover:bg-[#1eb85a] active:scale-[.99]">
                <WhatsAppMark size={17} /> Chat on WhatsApp
              </a>
              <p className="mt-3 text-center text-[11px] leading-5 text-white/50">Replies within a few hours, 8am – 9pm IST</p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Kainchi Darshan. Crafted in the hills of Kumaon.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="transition hover:text-white">Our story</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
