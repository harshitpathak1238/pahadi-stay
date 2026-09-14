'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';

function discountPercent(selling: number, base?: number): number | null {
  if (!base || base <= 0 || base <= selling) return null;
  return Math.round(((base - selling) / base) * 100);
}

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export function StaysCarousel({ stays }: { stays: Listing[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('[data-stay-card]');
    const cardWidth = card ? card.offsetWidth : 300;
    rail.scrollBy({ left: direction * (cardWidth + 20), behavior: 'smooth' });
  };

  return (
    <div className="relative mt-10">
      <div ref={railRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 md:-mx-2 md:px-2">
        {stays.slice(0, 6).map((stay) => {
          const discount = discountPercent(stay.price, stay.basePrice);
          return (
            <Link
              key={stay.slug}
              href={`/stays/${stay.slug}`}
              data-stay-card
              className="group w-[260px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[#e4e3da] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(23,63,53,.14)] hover:ring-[#d6d5c9] sm:w-[300px] md:w-[340px]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#eef3f0]">
                {stay.image ? (
                  <img src={stay.image} alt={stay.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#173f35]"><Star size={30} /></div>
                )}
                {discount !== null && (
                  <span className="sans absolute left-3 top-3 inline-flex items-center rounded-full bg-[#b66b45] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">{discount}% off</span>
                )}
                <span className="sans absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#173f35] shadow-sm"><Star size={12} fill="currentColor" /> {stay.rating}</span>
              </div>
              <div className="flex flex-col p-5">
                <h3 className="text-lg font-bold leading-snug text-[#173f35]">{stay.title}</h3>
                <p className="sans mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#526057]">
                  <MapPin size={13} className="shrink-0 text-[#b66b45]" />
                  <span className="truncate">{stay.location}</span>
                </p>
                {stay.accommodations?.length ? (
                  <p className="sans mt-1.5 text-[10px] uppercase tracking-[.16em] text-[#8a948c]">{stay.accommodations.length} private {stay.accommodations.length === 1 ? 'space' : 'spaces'}</p>
                ) : (
                  <p className="sans mt-1.5 text-[10px] uppercase tracking-[.16em] text-[#8a948c]">{stay.amenities?.slice(0, 4).join(' · ') || 'Kumaon stay'}</p>
                )}
                <div className="mt-4 flex min-w-0 items-end justify-between gap-3 border-t border-[#eef1ec] pt-3">
                  <p className="sans min-w-0">
                    <span className="block text-[10px] uppercase tracking-[.16em] text-[#8a948c]">Starting from</span>
                    {stay.basePrice !== undefined && stay.basePrice > stay.price && (
                      <span className="mr-1.5 text-xs text-[#9aa39f] line-through">{inr(stay.basePrice)}</span>
                    )}
                    <span className="text-base font-bold text-[#173f35]">{inr(stay.price)}</span>
                    <span className="text-xs text-[#6c7770]"> / night</span>
                  </p>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d6d9d1] text-[#173f35] transition group-hover:bg-[#173f35] group-hover:text-white"><ArrowRight size={15} /></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Prev / Next arrows — hidden until the strip overflows */}
      {stays.length > 3 && (
        <>
          <button
            type="button"
            aria-label="Show previous stays"
            onClick={() => scroll(-1)}
            className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow-[0_8px_22px_rgba(23,63,53,.18)] ring-1 ring-[#e4e3da] transition hover:bg-[#f7f4ec] md:grid"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Show more stays"
            onClick={() => scroll(1)}
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow-[0_8px_22px_rgba(23,63,53,.18)] ring-1 ring-[#e4e3da] transition hover:bg-[#f7f4ec] md:grid"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}