'use client';

import { useState } from 'react';
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
    <form onSubmit={submit} role="search" className="sans flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 shadow-sm ring-1 ring-[#e4e3da]">
      <MapPin size={15} className="shrink-0 text-[#b66b45]" />
      <input
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Bhimtal or Kainchi Dham"
        aria-label="Where to"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#23332e] outline-none placeholder:text-[#9aa39c]"
      />
      <button type="submit" aria-label="Search rides" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#173f35] text-white transition hover:bg-[#24584a]">
        <Search size={15} />
      </button>
    </form>
  );
}
