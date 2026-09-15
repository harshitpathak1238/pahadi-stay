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
export function FeaturedStaysRail({ stays }: { stays: Listing[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('[data-featured-stay]');
    rail.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 20), behavior: 'smooth' });
  };
  if (!stays.length) return null;
  return (
    <div className="relative mt-10">
      <div ref={railRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 md:-mx-2 md:px-2">
        {stays.map((stay) => {
          const discount = discountPercent(stay.price, stay.basePrice);
          const fullyBooked = Boolean(stay.fullyBooked);
          return (
            <Link key={stay.slug} href={`/stays/${stay.slug}`} data-featured-stay aria-disabled={fullyBooked || undefined} className={`group grid w-[86vw] max-w-[420px] shrink-0 snap-start grid-cols-[126px_minmax(0,1fr)] overflow-hidden rounded-[1.1rem] bg-white text-left ring-1 ring-[#e4e3da] transition duration-300 ${fullyBooked ? 'opacity-75 grayscale-[45%]' : 'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(23,63,53,.14)]'} sm:w-[400px] sm:grid-cols-[150px_minmax(0,1fr)]`}>
              <div className="relative min-h-[186px] overflow-hidden bg-[#eef3f0] sm:min-h-[198px]">
                {stay.image ? (<img src={stay.image} alt={stay.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />) : (<div className="absolute inset-0 grid place-items-center text-[#173f35]"><Star size={28} /></div>)}
                {fullyBooked ? (
                  <span className="sans absolute left-2 top-2 rounded-[0.55rem] bg-[#171717]/85 px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm">Fully booked</span>
                ) : discount !== null && (<span className="sans absolute left-2 top-2 rounded-[0.55rem] bg-[#c46a3a] px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm">{discount}% off</span>)}
                {!fullyBooked && <span className="sans absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-[3px] text-[11px] font-bold text-[#173f35] shadow-sm"><Star size={11} fill="currentColor" /> {stay.rating}</span>}
              </div>
              <div className="flex min-w-0 flex-col px-4 py-3.5 sm:px-5 sm:py-4">
                <h3 className="truncate text-[16px] font-bold leading-snug text-[#3d2b1f] sm:text-[17px]">{stay.title}</h3>
                <p className="sans mt-1 flex min-w-0 items-center gap-1 text-[13px] text-[#6b5f55]"><MapPin size={13} className="shrink-0 text-[#c46a3a]" /><span className="truncate">{stay.location}</span></p>
                <p className="sans mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8a948c]">{stay.accommodations?.length ? `${stay.accommodations.length} private ${stay.accommodations.length === 1 ? 'space' : 'spaces'}` : stay.amenities?.slice(0, 4).join(' · ') || 'Kumaon stay'}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <p className="sans min-w-0"><span className="block text-[10px] uppercase tracking-[0.16em] text-[#9aa39f]">Starting from</span><span className="mt-0.5 block whitespace-nowrap">{stay.basePrice !== undefined && stay.basePrice > stay.price && (<span className="mr-1.5 text-[12px] text-[#9aa39f] line-through">{inr(stay.basePrice)}</span>)}<span className="text-[17px] font-extrabold text-[#c46a3a]">{inr(stay.price)}</span><span className="text-[12px] font-normal text-[#6c7770]"> / night</span></span></p>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d6d9d1] text-[#173f35] transition group-hover:border-[#173f35] group-hover:bg-[#173f35] group-hover:text-white"><ArrowRight size={15} /></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {stays.length > 3 && (
        <>
          <button type="button" aria-label="Show previous stays" onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow ring-1 ring-[#e4e3da] hover:bg-[#f7f4ec] md:grid"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Show more stays" onClick={() => scroll(1)} className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow ring-1 ring-[#e4e3da] hover:bg-[#f7f4ec] md:grid"><ChevronRight size={18} /></button>
        </>
      )}
      <p className="sans mt-3 text-center text-xs text-[#8a948c] md:hidden">Swipe to explore more stays →</p>
    </div>
  );
}
