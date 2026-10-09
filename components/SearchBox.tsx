'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CalendarDays, ChevronDown, MapPin, Search, Users } from 'lucide-react';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import {
  DEFAULT_GUESTS,
  SUGGESTED_PLACES,
  addDaysISO,
  guestLabel,
  guestOptions,
  isSearchTabKey,
  searchHrefForTab,
  tabFromPathname,
  todayISO,
  validateDateRange,
  type SearchTabKey,
} from '@/lib/search-params';

/**
 * Hero search widget (home page and the desktop rides page).
 *
 * Clicking a category pill navigates immediately to that category (carrying
 * the typed place/dates/guests across) so the tabs are never dead. Pressing
 * "Search" re-navigates with the latest values.
 */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<SearchTabKey>(tabFromPathname(pathname));
  const [guestMenu, setGuestMenu] = useState(false);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(DEFAULT_GUESTS);
  const [error, setError] = useState('');
  const guestsRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => todayISO(), []);

  // Navigating between category pages should move the selection with them.
  useEffect(() => setTab(tabFromPathname(pathname)), [pathname]);

  // Close the guest popover on Escape or an outside click.
  useEffect(() => {
    if (!guestMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!guestsRef.current?.contains(event.target as Node)) setGuestMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuestMenu(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [guestMenu]);

  // Keep check-out ahead of check-in as the guest picks dates.
  const onCheckInChange = (value: string) => {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) setCheckOut(addDaysISO(value, 1));
    setError('');
  };
  const onCheckOutChange = (value: string) => {
    setCheckOut(value);
    setError('');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const range = validateDateRange(checkIn, checkOut, { today });
    if (!range.valid) {
      setError(range.message);
      return;
    }
    setError('');
    router.push(searchHrefForTab(tab, { location, checkIn, checkOut, guests }));
  };

  // Tab clicks navigate immediately (this is the reported bug: they used to
  // only highlight). Typed values ride along so nothing is thrown away; an
  // invalid date pair only blocks "Search", not exploring a category.
  const handleTabSelect = (key: string) => {
    if (!isSearchTabKey(key)) return;
    setTab(key);
    const range = validateDateRange(checkIn, checkOut, { today });
    router.push(
      searchHrefForTab(key, {
        location,
        checkIn: range.valid ? checkIn : '',
        checkOut: range.valid ? checkOut : '',
        guests,
      }),
    );
  };

  return (
    <div className="sans mx-auto w-full max-w-3xl">
      <div className="mb-4"><CategoryTabs activeKey={tab} onSelectKey={handleTabSelect} /></div>
      <form
        onSubmit={submit}
        role="search"
        aria-label="Search stays, rides and rentals"
        className="grid grid-cols-2 gap-2 overflow-visible rounded-[1.5rem] bg-white p-2 shadow-[0_26px_60px_rgba(2,20,16,.3)] sm:rounded-[1.75rem] md:flex md:items-stretch md:gap-0 md:rounded-full md:px-3 md:py-2"
      >
        <label className="col-span-2 flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:hover:bg-[#f7f8f4]">
          <MapPin size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Where</span>
            <input value={location} onChange={(event) => { setLocation(event.target.value); setError(''); }} list="search-places" autoComplete="off" className="mt-0.5 w-full min-w-0 bg-transparent text-[13px] font-semibold outline-none placeholder:text-[#9aa39f] sm:text-sm" placeholder="Bhimtal or Kainchi Dham" aria-label="Where to" />
          </span>
        </label>
        <datalist id="search-places">
          {SUGGESTED_PLACES.map((place) => <option key={place} value={place} />)}
        </datalist>

        <label className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <CalendarDays size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-in</span>
            <input type="date" value={checkIn} min={today} onChange={(event) => onCheckInChange(event.target.value)} className="mt-0.5 w-full bg-transparent text-[13px] font-semibold outline-none sm:text-sm" aria-label="Check-in date" />
          </span>
        </label>

        <label className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition focus-within:bg-[#f4f6f1] sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <CalendarDays size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Check-out</span>
            <input type="date" value={checkOut} min={checkIn || today} onChange={(event) => onCheckOutChange(event.target.value)} className="mt-0.5 w-full bg-transparent text-[13px] font-semibold outline-none sm:text-sm" aria-label="Check-out date" />
          </span>
        </label>

        <div ref={guestsRef} className="relative col-span-2 flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf9f4] px-3.5 py-2.5 text-sm text-[#23332e] transition sm:col-span-1 sm:rounded-full md:flex-1 md:bg-transparent md:px-4 md:py-2 md:border-l md:border-[#ecebe4] md:hover:bg-[#f7f8f4]">
          <Users size={16} className="hidden shrink-0 text-[#b66b45] sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9591]">Guests</span>
            <button type="button" aria-haspopup="listbox" aria-expanded={guestMenu} onClick={() => setGuestMenu(!guestMenu)} className="flex w-full items-center justify-between gap-1 text-left text-[13px] font-semibold outline-none sm:text-sm">
              <span className="truncate">{guestLabel(guests)}</span>
              <ChevronDown size={14} className={`shrink-0 text-[#6c7770] transition ${guestMenu ? 'rotate-180' : ''}`} />
            </button>
          </span>
          {guestMenu && (
            <div role="listbox" aria-label="Number of guests" className="absolute inset-x-1 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-[#d6d9d1] bg-white p-1 shadow-[0_20px_44px_rgba(6,95,70,.18)]">
              {guestOptions().map((count) => (
                <button type="button" role="option" aria-selected={guests === count} key={count} onClick={() => { setGuests(count); setGuestMenu(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${guests === count ? 'bg-[#e7eadf] font-bold text-[#065f46]' : 'text-[#526057] hover:bg-[#f2f4ed]'}`}>{guestLabel(count)}</button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="col-span-2 inline-flex h-11 shrink-0 items-center justify-center gap-2 self-center rounded-full bg-[#065f46] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(6,95,70,.4)] transition hover:bg-[#047857] active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-[#047857]/50 focus:ring-offset-2 md:col-span-1 md:ml-3 md:h-12 md:w-12 md:self-stretch md:items-center md:justify-center md:px-0">
          <Search size={17} />
          <span className="md:hidden">Search</span>
        </button>
      </form>
      {/* Validation feedback. `aria-live` so screen readers announce it too. */}
      {error && (
        <p role="alert" aria-live="polite" className="sans mt-2 rounded-xl bg-[#fdecea] px-3 py-2 text-center text-sm font-semibold text-[#8a2a1f]">
          {error}
        </p>
      )}
    </div>
  );
}
