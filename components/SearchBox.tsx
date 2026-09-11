'use client'; import { useState } from 'react'; import { useRouter, usePathname } from 'next/navigation'; import { CalendarDays, ChevronDown, MapPin, Search, Users } from 'lucide-react'; import { CategoryTabs } from '@/components/ui/CategoryTabs';

const guestOptions = ['1 guest', '2 guests', '3 guests', '4+ guests'];
const guestValue = (option: string) => (option === '4+ guests' ? 4 : Number(option.split(' ')[0]));
const tabTarget: Record<string, string> = { stays: '/stays', rides: '/rides', rentals: '/rentals', activities: '/activities' };

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
    if (target !== '/stays') { router.push(target); return; }
    const params = new URLSearchParams({ ...(location && { location }), ...(checkIn && { checkIn }), ...(checkOut && { checkOut }), guests: String(guestValue(guests)) });
    router.push(`/stays?${params.toString()}`);
  };
  return <div className="sans mx-auto max-w-4xl"><div className="mb-3"><CategoryTabs navigate /></div><form onSubmit={submit} className="grid overflow-visible rounded-2xl bg-[#f7f4ec] shadow-2xl md:grid-cols-[1.5fr_1fr_1fr_auto]"><label className="border-b border-[#e4e3da] px-5 py-3 md:border-b-0 md:border-r"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]"><MapPin size={13} />Where</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 w-full bg-transparent text-base outline-none" placeholder="Bhimtal or Kainchi Dham" aria-label="Where to" /></label><label className="border-b border-[#e4e3da] px-5 py-3 md:border-b-0 md:border-r"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]"><CalendarDays size={13} />Check-in</span><input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 w-full bg-transparent text-base outline-none" aria-label="Check-in date" /></label><label className="border-b border-[#e4e3da] px-5 py-3 md:border-b-0 md:border-r"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]"><CalendarDays size={13} />Check-out</span><input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full bg-transparent text-base outline-none" aria-label="Check-out date" /></label><div className="relative px-5 py-3"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]"><Users size={13} />Guests</span><button type="button" aria-haspopup="listbox" aria-expanded={guestMenu} onClick={() => setGuestMenu(!guestMenu)} className="mt-1 flex w-full items-center justify-between gap-2 bg-transparent text-left text-base text-[#23332e] outline-none"><span>{guests}</span><ChevronDown size={16} className={`transition ${guestMenu ? 'rotate-180' : ''}`} /></button>{guestMenu && <div role="listbox" aria-label="Number of guests" className="absolute inset-x-3 top-[4.8rem] z-30 rounded-xl border border-[#d6d9d1] bg-white p-1 shadow-xl">{guestOptions.map((option) => <button type="button" role="option" aria-selected={guests === option} key={option} onClick={() => { setGuests(option); setGuestMenu(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${guests === option ? 'bg-[#e7eadf] font-bold text-[#173f35]' : 'text-[#526057] hover:bg-[#f2f4ed]'}`}>{option}</button>)}</div>}</div><button className="m-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-6 py-3 font-bold text-white hover:bg-[#24584a]"><Search size={18} />Search</button></form></div>;
}
