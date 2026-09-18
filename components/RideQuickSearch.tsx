'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';

export function RideQuickSearch() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(location.trim() ? `/rides?where=${encodeURIComponent(location.trim())}` : '/rides');
  };
  return (
    <form
      onSubmit={submit}
      role="search"
      className="sans flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-2 shadow-[0_14px_34px_rgba(23,63,53,.16)] ring-1 ring-[#e4e3da] transition focus-within:ring-2 focus-within:ring-[#24584a]/35"
    >
      <MapPin size={16} className="shrink-0 text-[#c47a4e]" />
      <input
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Bhimtal or Kainchi Dham"
        aria-label="Where to"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#23332e] outline-none placeholder:text-[#9aa39c]"
      />
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
