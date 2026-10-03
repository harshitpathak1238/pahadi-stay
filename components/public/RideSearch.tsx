'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, X } from 'lucide-react';
import { SUGGESTED_PLACES } from '@/lib/search-params';

/**
 * Place search for the rides page, shown at every breakpoint.
 *
 * It replaces the split `RideQuickSearch` (mobile) + `SearchBox` (desktop)
 * arrangement, which meant mobile guests could not pick dates or a party size
 * and desktop guests had to scroll past the full hero to search.
 */
export function RideSearch({ query }: { query: string }) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  // Keep the box in step when the URL changes (clear link, back button, hero).
  useEffect(() => setValue(query), [query]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    router.push(next ? `/rides?where=${encodeURIComponent(next)}` : '/rides');
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search rides by pickup or destination"
      className="sans flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-2 shadow-[0_14px_34px_rgba(23,63,53,.16)] ring-1 ring-[#e4e3da] transition focus-within:ring-2 focus-within:ring-[#24584a]/35"
    >
      <MapPin size={16} className="shrink-0 text-[#c47a4e]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        list="ride-places"
        autoComplete="off"
        placeholder="Bhimtal or Kainchi Dham"
        aria-label="Search rides by pickup or destination"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#23332e] outline-none placeholder:text-[#9aa39c]"
      />
      <datalist id="ride-places">
        {SUGGESTED_PLACES.map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            router.push('/rides');
          }}
          aria-label="Clear ride search"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6c7770] transition hover:bg-[#f2f4ed] hover:text-[#173f35]"
        >
          <X size={15} />
        </button>
      )}
      <button
        type="submit"
        aria-label="Search rides"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#1e5044] to-[#173f35] text-white shadow-[0_8px_18px_rgba(23,63,53,.35)] ring-1 ring-white/15 transition hover:from-[#266254] hover:to-[#1e5044] active:scale-95"
      >
        <Search size={15} />
      </button>
    </form>
  );
}