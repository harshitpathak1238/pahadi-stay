'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, IndianRupee, MapPin, Search, Users } from 'lucide-react';
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
    <form onSubmit={submit} className="rounded-2xl bg-white p-1.5 shadow-[0_10px_28px_rgba(23,63,53,.10)] ring-1 ring-[#e4e8e2] md:rounded-full md:p-1">
      <div className="grid grid-cols-6 gap-1 md:grid-cols-[1.35fr_1fr_1fr_0.8fr_1fr_auto] md:items-center md:gap-0">
        <label className="col-span-6 flex min-w-0 items-center gap-2.5 rounded-xl bg-[#faf9f4] px-3 py-2 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] md:col-span-1 md:rounded-full md:bg-transparent md:px-4 md:py-2 md:focus-within:bg-[#f6f8f5]">
          <MapPin size={16} className="shrink-0 text-[#b66b45]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Where</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, property, or location" className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#9aa39c] md:text-sm" aria-label="City, property, or location" />
          </span>
        </label>

        <label className="col-span-3 flex min-w-0 items-center gap-2 rounded-xl bg-[#faf9f4] px-2.5 py-2 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] md:col-span-1 md:rounded-none md:bg-transparent md:px-4 md:py-2 md:focus-within:bg-[#f6f8f5] md:hover:bg-[#f6f8f5] md:border-l md:border-[#eceae1]">
          <CalendarDays size={15} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-in</span>
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="w-full min-w-0 bg-transparent text-[12px] outline-none sm:text-[13px] md:text-sm" aria-label="Check-in date" />
          </span>
        </label>

        <label className="col-span-3 flex min-w-0 items-center gap-2 rounded-xl bg-[#faf9f4] px-2.5 py-2 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] md:col-span-1 md:rounded-none md:bg-transparent md:px-4 md:py-2 md:focus-within:bg-[#f6f8f5] md:hover:bg-[#f6f8f5] md:border-l md:border-[#eceae1]">
          <CalendarDays size={15} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-out</span>
            <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="w-full min-w-0 bg-transparent text-[12px] outline-none sm:text-[13px] md:text-sm" aria-label="Check-out date" />
          </span>
        </label>

        <div className="relative col-span-2 flex min-w-0 items-center gap-2 rounded-xl bg-[#faf9f4] px-2.5 py-2 text-sm text-[#23332e] transition md:col-span-1 md:rounded-none md:bg-transparent md:px-4 md:py-2 md:hover:bg-[#f6f8f5] md:border-l md:border-[#eceae1]">
          <Users size={15} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Guests</span>
            <button type="button" aria-haspopup="listbox" aria-expanded={guestMenu} onClick={() => setGuestMenu((open) => !open)} className="flex w-full items-center justify-between gap-1 text-left text-[12px] font-semibold outline-none sm:text-[13px] md:text-sm">
              <span className="truncate">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
              <ChevronDown size={13} className={`shrink-0 text-[#6c7770] transition ${guestMenu ? 'rotate-180' : ''}`} />
            </button>
          </span>
          {guestMenu && <div role="listbox" aria-label="Number of guests" className="absolute inset-x-2 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-[#e4e8e2] bg-white p-1 shadow-[0_16px_36px_rgba(23,63,53,.16)]">{Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <button type="button" role="option" aria-selected={guests === count} key={count} onClick={() => { setGuests(count); setGuestMenu(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${guests === count ? 'bg-[#e7eadf] font-bold text-[#173f35]' : 'text-[#526057] hover:bg-[#f2f4ed]'}`}>{count} {count === 1 ? 'guest' : 'guests'}</button>)}</div>}
        </div>

        <label className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl bg-[#faf9f4] px-2.5 py-2 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] md:col-span-1 md:rounded-none md:bg-transparent md:px-4 md:py-2 md:focus-within:bg-[#f6f8f5] md:hover:bg-[#f6f8f5] md:border-l md:border-[#eceae1]">
          <span className="hidden shrink-0 text-[#b66b45] sm:block"><IndianRupee size={15} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Price / night</span>
            <span className="relative block">
              <select value={activePriceKey} onChange={(event) => { const bucket = priceBuckets.find((item) => `${item.minPrice ?? ''}-${item.maxPrice ?? ''}` === event.target.value); if (bucket) selectPriceBucket(bucket); }} className="w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-4 text-[12px] font-semibold outline-none sm:text-[13px] md:text-sm" aria-label="Price per night">{priceBuckets.map((bucket) => <option key={`${bucket.minPrice ?? ''}-${bucket.maxPrice ?? ''}`} value={`${bucket.minPrice ?? ''}-${bucket.maxPrice ?? ''}`}>{bucket.label}</option>)}</select>
              <ChevronDown size={13} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#6c7770]" />
            </span>
          </span>
        </label>

        <button type="submit" aria-label="Search stays" className="col-span-2 inline-flex h-10 items-center justify-center gap-2 self-stretch rounded-full bg-[#173f35] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,63,53,.28)] transition hover:bg-[#24584a] focus:outline-none focus:ring-2 focus:ring-[#24584a]/40 focus:ring-offset-2 md:col-span-1 md:ml-1.5 md:h-10 md:w-10 md:self-center md:px-0">
          <Search size={16} />
          <span className="md:hidden">Search</span>
        </button>
      </div>
    </form>
  );
}
