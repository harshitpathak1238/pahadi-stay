'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import type { PublicRide } from '@/lib/rides';
import { cardDescriptionSnippet } from '@/lib/sanitize-html';

const inr = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;

export function RideCard({ ride }: { ride: PublicRide }) {
  const subtitle = ride.type === 'TRANSFER' ? [ride.fromLocation, ride.toLocation].filter(Boolean).join(' to ') : ride.stops.slice(0, 3).map((s) => s.label).join(' · ');
  const meta = [ride.distanceKm ? `${ride.distanceKm} km` : '', ride.durationDays ? `${ride.durationDays} ${ride.durationDays === 1 ? 'day' : 'days'}` : ''].filter(Boolean).join(' · ');
  const snippet = cardDescriptionSnippet(ride.description);
  return (
    <Link href={`/rides/${ride.slug}`} className="group grid grid-cols-[124px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e3da] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(23,63,53,.12)] hover:ring-[#d6d5c9] sm:grid-cols-[180px_minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)]">
      <div className="relative min-h-[136px] bg-[#eef3f0] sm:min-h-[150px] md:min-h-[196px]">
        {ride.image ? <Image src={ride.image} alt={ride.title} fill sizes="(max-width: 640px) 124px, (max-width: 768px) 180px, 300px" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : null}
        <span className="sans absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#173f35] backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[11px]">{ride.type === 'TRANSFER' ? 'Transfer' : 'Sightseeing'}</span>
      </div>
      <div className="flex min-w-0 flex-col p-4 sm:p-5 md:p-6">
        <h3 className="text-lg font-semibold leading-snug text-[#173f35] sm:text-xl md:text-2xl">{ride.title}</h3>
        {subtitle && (
          <p className="sans mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#526057] sm:text-sm">
            <MapPin size={13} className="shrink-0 text-[#b66b45]" />
            <span className="truncate">{subtitle}</span>
          </p>
        )}
        {meta && <p className="sans mt-1.5 text-[10px] uppercase tracking-[.16em] text-[#8a948c] sm:text-[11px]">{meta}</p>}
        {snippet && <p className="sans mt-2.5 hidden line-clamp-2 text-sm leading-6 text-[#6c7770] sm:block">{snippet}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3 sm:pt-4">
          <p className="sans min-w-0">
            {ride.minFare === null ? (
              <span className="text-sm text-[#8a948c]">Pricing coming soon</span>
            ) : (
              <>
                <span className="block text-[10px] uppercase tracking-[.16em] text-[#8a948c]">Starting from</span>
                <span className="text-base font-bold text-[#173f35] sm:text-lg">{inr(ride.minFare)}</span>
              </>
            )}
          </p>
          <span className="sans inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#b66b45] transition-all duration-300 group-hover:gap-2.5">
            View ride
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function RideCardList({ rides }: { rides: PublicRide[] }) {
  return <div className="grid gap-5">{rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>;
}

type CategoryKey = 'sightseeing' | 'transfers';

const sections: { id: string; key: CategoryKey; label: string }[] = [
  { id: 'rides-sightseeing', key: 'sightseeing', label: 'Sightseeing' },
  { id: 'rides-transfers', key: 'transfers', label: 'Pickup / Drop' },
];

// Segmented quick-jump control: both categories stay on the page; the toggle
// smooth-scrolls to them and highlights whichever section is in view.
export function RideCategoryToggle({ sightseeingCount, transfersCount }: { sightseeingCount: number; transfersCount: number }) {
  const [active, setActive] = useState<CategoryKey>('sightseeing');
  const counts: Record<CategoryKey, number> = { sightseeing: sightseeingCount, transfers: transfersCount };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id === 'rides-transfers' ? 'transfers' : 'sightseeing');
        });
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (section: { id: string; key: CategoryKey }) => {
    setActive(section.key);
    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="inline-flex max-w-full rounded-full bg-[#eceae1]/70 p-1 ring-1 ring-[#e4e3da]" role="tablist" aria-label="Ride categories">
      {sections.map((section) => {
        const isActive = active === section.key;
        return (
          <button
            key={section.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => go(section)}
            className={`sans inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-300 sm:px-5 ${isActive ? 'bg-[#173f35] text-white shadow-[0_6px_16px_rgba(23,63,53,.24)]' : 'text-[#526057] hover:text-[#173f35]'}`}
          >
            <span className="truncate">{section.label}</span>
            <span className={`shrink-0 rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-white/15 text-white' : 'bg-[#e2dfd4] text-[#6c7770]'}`}>{counts[section.key]}</span>
          </button>
        );
      })}
    </div>
  );
}