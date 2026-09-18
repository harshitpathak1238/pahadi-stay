'use client'; import { useState } from 'react'; import { useRouter, usePathname } from 'next/navigation'; import { CalendarDays, ChevronDown, MapPin, Search, Users } from 'lucide-react'; import { CategoryTabs } from '@/components/ui/CategoryTabs';

const guestOptions = ['1 guest', '2 guests', '3 guests', '4+ guests'];
const guestValue = (option: string) => (option === '4+ guests' ? 4 : Number(option.split(' ')[0]));
const tabTarget: Record<string, string> = { stays: '/stays', rides: '/rides', rentals: '/rentals', activities: '/activities', packages: '/packages' };

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = Object.keys(tabTarget).find((key) => pathname.startsWith(`/${key}`)) || 'stays';
  const [guestMenu, setGuestMenu] = useState(false);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 guests');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const target = tabTarget[activeTab] || '/stays';
    if (target === '/rides') {
      const params = new URLSearchParams({ ...(location.trim() && { where: location.trim() }) });
      const query = params.toString();
      router.push(query ? `/rides?${query}` : '/rides');
      return;
    }
    if (target !== '/stays') { router.push(target); return; }
    const params = new URLSearchParams({ ...(location && { location }), ...(checkIn && { checkIn }), ...(checkOut && { checkOut }), guests: String(guestValue(guests)) });
    router.push(`/stays?${params.toString()}`);
  };
    return (
    <div className="sans mx-auto w-full max-w-3xl">
      <div className="mb-4"><CategoryTabs navigate /></div>
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-2 overflow-visible rounded-[1.5rem] bg-white p-2 shadow-[0_26px_60px_rgba(2,20,16,.3)] sm:rounded-[1.75rem] md:flex md:items-stretch md:gap-0 md:rounded-full md:px-3 md:py-2"
      >
        <label className="col-span-2 flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:hover:bg-[#f7f8f4]">
          <MapPin size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Where</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-0.5 w-full min-w-0 bg-transparent text-[13px] font-semibold outline-none placeholder:text-[#9aa39f] sm:text-sm" placeholder="Bhimtal or Kainchi Dham" aria-label="Where to" />
          </span>
        </label>

        <label className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <CalendarDays size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-in</span>
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-0.5 w-full bg-transparent text-[13px] font-semibold outline-none sm:text-sm" aria-label="Check-in date" />
          </span>
        </label>

        <label className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <CalendarDays size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-out</span>
            <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-0.5 w-full bg-transparent text-[13px] font-semibold outline-none sm:text-sm" aria-label="Check-out date" />
          </span>
        </label>

        <div className="relative flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <Users size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Guests</span>
            <button type="button" aria-haspopup="listbox" aria-expanded={guestMenu} onClick={() => setGuestMenu(!guestMenu)} className="flex w-full items-center justify-between gap-1 text-left text-[13px] font-semibold outline-none sm:text-sm">
              <span className="truncate">{guests}</span>
              <ChevronDown size={14} className={`shrink-0 text-[#6c7770] transition ${guestMenu ? 'rotate-180' : ''}`} />
            </button>
          </span>
          {guestMenu && (
            <div role="listbox" aria-label="Number of guests" className="absolute inset-x-1 top-[calc(100%+8px)] z-30 rounded-xl border border-[#d6d9d1] bg-white p-1 shadow-[0_20px_44px_rgba(23,63,53,.18)]">
              {guestOptions.map((option) => (
                <button type="button" role="option" aria-selected={guests === option} key={option} onClick={() => { setGuests(option); setGuestMenu(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${guests === option ? 'bg-[#e7eadf] font-bold text-[#173f35]' : 'text-[#526057] hover:bg-[#f2f4ed]'}`}>{option}</button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="col-span-2 inline-flex h-11 shrink-0 items-center justify-center gap-2 self-center rounded-full bg-[#173f35] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(23,63,53,.4)] transition hover:bg-[#24584a] active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-[#24584a]/50 focus:ring-offset-2 md:col-span-1 md:ml-3 md:h-12 md:w-12 md:self-stretch md:items-center md:justify-center md:px-0">
          <Search size={17} />
          <span className="md:hidden">Search</span>
        </button>
      </form>
    </div>
  );
}
