'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, X } from 'lucide-react';
import { SUGGESTED_PLACES } from '@/lib/search-params';

/**
 * Place search for the rentals page.
 *
 * The hero search box routes a "Rentals" search here, so the page needs its own
 * field - previously it ignored the query entirely and showed every vehicle.
 */
export function RentalSearch({ query }: { query: string }) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  // Keep the box in step when the URL changes (clear link, back button, hero).
  useEffect(() => setValue(query), [query]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    router.push(next ? `/rentals?where=${encodeURIComponent(next)}` : '/rentals');
  };

  return (
    <form onSubmit={submit} role="search" aria-label="Search rentals by pickup area" className="sans mt-6 flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-2 shadow-[0_10px_28px_rgba(6,95,70,.10)] ring-1 ring-[#dfe3d8] transition focus-within:ring-2 focus-within:ring-[#047857]/30">
      <MapPin size={16} className="shrink-0 text-[#b66b45]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        list="rental-places"
        autoComplete="off"
        placeholder="Search by pickup area, e.g. Bhimtal"
        aria-label="Search rentals by pickup area"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#23332e] outline-none placeholder:text-[#9aa39c]"
      />
      <datalist id="rental-places">
        {SUGGESTED_PLACES.map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>
      {value && (
        <button type="button" onClick={() => { setValue(''); router.push('/rentals'); }} aria-label="Clear rental search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6c7770] transition hover:bg-[#f2f4ed] hover:text-[#065f46]">
          <X size={15} />
        </button>
      )}
      <button type="submit" aria-label="Search rentals" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#1e5044] to-[#065f46] text-white shadow-[0_8px_18px_rgba(6,95,70,.35)] ring-1 ring-white/15 transition hover:from-[#266254] hover:to-[#1e5044] active:scale-95">
        <Search size={15} />
      </button>
    </form>
  );
}