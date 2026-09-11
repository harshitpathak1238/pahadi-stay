'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, MapPin, Search, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { Listing } from '@/lib/mock-data';

type StaysSearchBarProps = {
  stays: Listing[];
  initialLocation: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  onLocationChange: (value: string) => void;
  onPriceChange: (minPrice?: number, maxPrice?: number) => void;
  onSearch: (values: { location: string; checkIn: string; checkOut: string; guests: number }) => void;
};

type PriceBucket = {
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function getPriceBuckets(prices: number[]): PriceBucket[] {
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
    return [{ label: 'All prices' }];
  }

  const step = Math.max(500, Math.ceil((maximum - minimum) / 3 / 500) * 500);
  const firstMax = Math.min(maximum, minimum + step);
  const secondMax = Math.min(maximum, firstMax + step);
  const buckets: PriceBucket[] = [
    { label: `${formatPrice(minimum)} - ${formatPrice(firstMax)}`, minPrice: minimum, maxPrice: firstMax },
  ];

  if (secondMax > firstMax) {
    buckets.push({ label: `${formatPrice(firstMax + 1)} - ${formatPrice(secondMax)}`, minPrice: firstMax + 1, maxPrice: secondMax });
  }
  if (maximum > secondMax) {
    buckets.push({ label: `${formatPrice(secondMax + 1)}+`, minPrice: secondMax + 1 });
  }
  return [{ label: 'All prices' }, ...buckets];
}

export function StaysSearchBar({
  stays,
  initialLocation,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialMinPrice,
  initialMaxPrice,
  onLocationChange,
  onPriceChange,
  onSearch,
}: StaysSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [guestMenu, setGuestMenu] = useState(false);
  const [priceKey, setPriceKey] = useState('');

  const prices = useMemo(() => stays.map((stay) => stay.price).filter((price) => Number.isFinite(price)), [stays]);
  const priceBuckets = useMemo(() => getPriceBuckets(prices), [prices]);
  const selectedBucket = priceBuckets.find((bucket) => bucket.minPrice === initialMinPrice && bucket.maxPrice === initialMaxPrice);
  const activePriceKey = selectedBucket ? `${selectedBucket.minPrice ?? ''}-${selectedBucket.maxPrice ?? ''}` : priceKey || `${priceBuckets[0]?.minPrice ?? ''}-${priceBuckets[0]?.maxPrice ?? ''}`;

  useEffect(() => {
    setLocation(initialLocation);
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setGuests(initialGuests);
  }, [initialCheckIn, initialCheckOut, initialGuests, initialLocation]);

  useEffect(() => {
    const timeout = window.setTimeout(() => onLocationChange(location.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [location, onLocationChange]);

  useEffect(() => {
    if (initialMinPrice === undefined && initialMaxPrice === undefined) setPriceKey('');
  }, [initialMaxPrice, initialMinPrice]);

  const selectPriceBucket = (bucket: PriceBucket) => {
    const key = `${bucket.minPrice ?? ''}-${bucket.maxPrice ?? ''}`;
    setPriceKey(key);
    onPriceChange(bucket.minPrice, bucket.maxPrice);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('guests', String(guests));
    const bucket = priceBuckets.find((item) => `${item.minPrice ?? ''}-${item.maxPrice ?? ''}` === activePriceKey);
    if (bucket?.minPrice !== undefined) params.set('minPrice', String(bucket.minPrice));
    if (bucket?.maxPrice !== undefined) params.set('maxPrice', String(bucket.maxPrice));
    onSearch({ location: location.trim(), checkIn, checkOut, guests });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#d6a06d]/60 bg-[#f7f4ec] p-2 shadow-[0_12px_30px_rgba(23,63,53,.12)]">
      <div className="grid gap-2 md:grid-cols-[1.25fr_1fr_1fr_1fr_auto]">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe3d8] bg-white px-4 py-3 text-sm text-[#23332e] focus-within:border-[#24584a] focus-within:ring-2 focus-within:ring-[#24584a]/10">
          <MapPin size={18} className="shrink-0 text-[#b66b45]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6c7770]">Where</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, property, or location" className="mt-1 w-full min-w-0 bg-transparent outline-none" aria-label="City, property, or location" />
          </span>
        </label>

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe3d8] bg-white px-4 py-3 text-sm text-[#23332e] focus-within:border-[#24584a] focus-within:ring-2 focus-within:ring-[#24584a]/10">
          <CalendarDays size={18} className="shrink-0 text-[#b66b45]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6c7770]">Check-in</span>
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none" aria-label="Check-in date" />
          </span>
        </label>

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe3d8] bg-white px-4 py-3 text-sm text-[#23332e] focus-within:border-[#24584a] focus-within:ring-2 focus-within:ring-[#24584a]/10">
          <CalendarDays size={18} className="shrink-0 text-[#b66b45]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6c7770]">Check-out</span>
            <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none" aria-label="Check-out date" />
          </span>
        </label>

        <div className="relative flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe3d8] bg-white px-4 py-3 text-sm text-[#23332e]">
          <Users size={18} className="shrink-0 text-[#b66b45]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6c7770]">Guests</span>
            <button type="button" aria-haspopup="listbox" aria-expanded={guestMenu} onClick={() => setGuestMenu((open) => !open)} className="mt-1 flex w-full items-center justify-between gap-2 text-left outline-none">
              <span>{guests} {guests === 1 ? 'guest' : 'guests'}</span>
              <ChevronDown size={15} className={`transition ${guestMenu ? 'rotate-180' : ''}`} />
            </button>
          </span>
          {guestMenu && <div role="listbox" aria-label="Number of guests" className="absolute inset-x-2 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-[#d6d9d1] bg-white p-1 shadow-xl">{Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <button type="button" role="option" aria-selected={guests === count} key={count} onClick={() => { setGuests(count); setGuestMenu(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${guests === count ? 'bg-[#e7eadf] font-bold text-[#173f35]' : 'text-[#526057] hover:bg-[#f2f4ed]'}`}>{count} {count === 1 ? 'guest' : 'guests'}</button>)}</div>}
        </div>

        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#dfe3d8] bg-white px-3 py-2 text-sm text-[#23332e] md:max-w-[180px]">
          <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6c7770]">Price / night</span><select value={activePriceKey} onChange={(event) => { const bucket = priceBuckets.find((item) => `${item.minPrice ?? ''}-${item.maxPrice ?? ''}` === event.target.value); if (bucket) selectPriceBucket(bucket); }} className="mt-1 w-full min-w-0 bg-transparent text-sm font-semibold outline-none" aria-label="Price per night">{priceBuckets.map((bucket) => <option key={`${bucket.minPrice ?? ''}-${bucket.maxPrice ?? ''}`} value={`${bucket.minPrice ?? ''}-${bucket.maxPrice ?? ''}`}>{bucket.label}</option>)}</select></span>
        </label>

        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-6 py-3 font-bold text-white transition hover:bg-[#24584a] md:px-5" aria-label="Search stays"><Search size={18} /> <span className="md:hidden">Search stays</span></button>
      </div>
      <p className="px-2 pt-2 text-[11px] text-[#6c7770]">Dates are captured for your trip search. Availability filtering will activate when the public availability endpoint is implemented.</p>
    </form>
  );
}
