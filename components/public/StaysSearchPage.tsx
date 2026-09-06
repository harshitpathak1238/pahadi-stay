'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarDays, LayoutGrid, List, MapPin, Search, Users, X } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { FilterSidebar } from './FilterSidebar';
import { ResultCard } from './ResultCard';

const filters = ['Free WiFi', 'Breakfast included', 'Parking', 'Lake view', 'Pet friendly'];

export function StaysSearchPage({ stays }: { stays: Listing[] }) {
  const [destination, setDestination] = useState('Bhimtal, Uttarakhand');
  const [dates, setDates] = useState('18 Sep - 21 Sep');
  const [guests, setGuests] = useState('2 adults · 1 room');
  const [sort, setSort] = useState('Recommended');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [maxPrice, setMaxPrice] = useState(Math.max(...stays.map((stay) => stay.price), 10000));

  const results = useMemo(() => {
    const filtered = stays.filter(
      (stay) =>
        stay.price <= maxPrice &&
        activeFilters.every((filter) =>
          stay.amenities.some((amenity) =>
            amenity.toLowerCase().includes(filter.toLowerCase().replace(' included', '').replace(' view', ''))
          )
        )
    );
    return [...filtered].sort((a, b) =>
      sort === 'Price: low to high' ? a.price - b.price : sort === 'Guest rating' ? b.rating - a.rating : 0
    );
  }, [activeFilters, maxPrice, sort, stays]);

  const toggleFilter = (filter: string) =>
    setActiveFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  const toggleWishlist = (slug: string) =>
    setWishlist((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));

  return (
    <div className="bg-[#f5f7fa] text-[#1f2937]">
      {/* Header */}
      <div className="border-b border-[#d9e0e8] bg-[#003b95] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-black tracking-tight">
              Kainchi
              <span className="text-[#feba02]">Darshan</span>
            </Link>
            <div className="hidden items-center gap-5 text-xs font-semibold md:flex">
              <span>INR</span>
              <span aria-label="India">🇮🇳</span>
              <span>Help</span>
              <Link href="/partner/login">List your property</Link>
              <Link href="/signup" className="rounded border border-white px-3 py-2">
                Register
              </Link>
              <Link href="/login" className="rounded bg-white px-3 py-2 text-[#003b95]">
                Sign in
              </Link>
            </div>
            <Link href="/login" className="rounded bg-white px-3 py-2 text-xs font-bold text-[#003b95] md:hidden">
              Sign in
            </Link>
          </div>
          <nav className="mt-5 flex gap-5 overflow-x-auto pb-1 text-xs font-bold">
            <span className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-[#003b95]">🏨 Stays</span>
            <span className="whitespace-nowrap">✈ Flights</span>
            <span className="whitespace-nowrap">✈ Flight + Hotel</span>
            <span className="whitespace-nowrap">🚗 Car rental</span>
            <span className="whitespace-nowrap">🎟 Attractions</span>
            <span className="whitespace-nowrap">🚕 Airport taxis</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
        {/* Search bar */}
        <div className="rounded-xl bg-[#feba02] p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <MapPin size={17} className="text-[#003b95]" />
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Destination"
              />
              <X size={15} />
            </label>
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <CalendarDays size={17} className="text-[#003b95]" />
              <input
                value={dates}
                onChange={(event) => setDates(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Dates"
              />
            </label>
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <Users size={17} className="text-[#003b95]" />
              <input
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Guests"
              />
            </label>
            <button className="rounded bg-[#0071c2] px-7 py-3 font-bold text-white hover:bg-[#005b9d]">
              <Search size={18} className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mt-4 text-xs text-[#536274]">
          Home <span className="mx-2">›</span> India <span className="mx-2">›</span> Uttarakhand <span className="mx-2">›</span> Bhimtal
          <span className="mx-2">›</span> Search results
        </div>

        {/* Two-column layout: filters (left) + results (right) */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left sidebar - filters */}
          <FilterSidebar
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            results={results}
            allStays={stays}
            filters={filters}
          />

          {/* Right column - results */}
          <section>
            {/* Results header: count, sort, list/grid toggle */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  {destination}: {results.length} properties found
                </h1>
                <p className="mt-1 text-sm text-[#536274]">
                  {dates} · {guests}
                </p>
              </div>

              {/* Sort and view toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  Sort by:
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded border border-[#b9c5d1] bg-white px-3 py-2 font-semibold"
                  >
                    <option>Recommended</option>
                    <option>Price: low to high</option>
                    <option>Guest rating</option>
                  </select>
                </label>

                {/* List/Grid toggle */}
                <div className="hidden overflow-hidden rounded border border-[#b9c5d1] bg-white sm:flex">
                  <button
                    aria-label="List view"
                    onClick={() => setView('list')}
                    className={`p-2 transition ${view === 'list' ? 'bg-[#e7f1f8] text-[#0071c2]' : 'text-[#536274]'}`}
                  >
                    <List size={17} />
                  </button>
                  <button
                    aria-label="Grid view"
                    onClick={() => setView('grid')}
                    className={`p-2 transition ${view === 'grid' ? 'bg-[#e7f1f8] text-[#0071c2]' : 'text-[#536274]'}`}
                  >
                    <LayoutGrid size={17} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results grid */}
            <div className={`mt-4 grid gap-4 ${view === 'grid' ? 'sm:grid-cols-2' : ''}`}>
              {results.map((stay) => (
                <ResultCard
                  key={stay.slug}
                  stay={stay}
                  isWishlisted={wishlist.includes(stay.slug)}
                  onToggleWishlist={toggleWishlist}
                  view={view}
                />
              ))}
            </div>

            {/* Empty state */}
            {results.length === 0 && (
              <div className="rounded-lg border border-[#d9e0e8] bg-white p-8 text-center">
                <p className="text-[#536274]">No properties found matching your filters.</p>
                <button
                  onClick={() => {
                    setActiveFilters([]);
                    setMaxPrice(Math.max(...stays.map((stay) => stay.price), 10000));
                  }}
                  className="mt-3 text-sm font-bold text-[#0071c2] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

        {/* Right column - results */}
        <section>e} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-4 w-full accent-[#24584a]" /></div><div className="mt-5 border-t border-[#e5e7eb] pt-4"><h3 className="text-sm font-bold">Review score</h3>{['9+ Superb', '8+ Very good', '7+ Good'].map((item) => <label key={item} className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" />{item}<span className="ml-auto text-xs text-[#718096]">{results.length}</span></label>)}</div></aside>
        <section><div className="flex flex-wrap items-end justify-between gap-3"><div><button className="mb-3 inline-flex items-center gap-2 rounded border border-[#b9c5d1] bg-white px-3 py-2 text-sm lg:hidden" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={15} /> Filters</button><h1 className="text-2xl font-bold md:text-3xl">{destination}: {results.length * 127 + 127} properties found</h1><p className="mt-1 text-sm text-[#536274]">{dates} · {guests}</p></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm">Sort by:<select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded border border-[#b9c5d1] bg-white px-3 py-2 font-semibold"><option>Recommended</option><option>Price: low to high</option><option>Guest rating</option></select></label><div className="hidden overflow-hidden rounded border border-[#b9c5d1] bg-white sm:flex"><button aria-label="List view" onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-[#e7f1f8] text-[#0071c2]' : ''}`}><List size={17} /></button><button aria-label="Grid view" onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-[#e7f1f8] text-[#0071c2]' : ''}`}><LayoutGrid size={17} /></button></div></div></div><div className={`mt-4 grid gap-4 ${view === 'grid' ? 'sm:grid-cols-2' : ''}`}>{results.map((stay) => <article key={stay.slug} className={`grid gap-4 rounded-lg border border-[#d9e0e8] bg-white p-3 shadow-sm transition hover:shadow-md ${view === 'grid' ? 'grid-cols-1' : 'md:grid-cols-[230px_minmax(0,1fr)_145px]'}`}><div className="relative"><img src={stay.image} alt={stay.title} className={`w-full rounded object-cover ${view === 'grid' ? 'h-52' : 'h-48 md:h-40'}`} /><button aria-label={`Save ${stay.title}`} onClick={() => toggleWishlist(stay.slug)} className="absolute right-2 top-2 rounded-full bg-white p-2 shadow"><Heart size={17} fill={wishlist.includes(stay.slug) ? '#e11d48' : 'none'} className={wishlist.includes(stay.slug) ? 'text-rose-600' : ''} /></button></div><div className="min-w-0"><div className="flex items-start justify-between gap-3"><div><Link href={`/stays/${stay.slug}`} className="text-xl font-bold text-[#0071c2] hover:underline">{stay.title}</Link><div className="mt-1 flex items-center gap-1 text-[#f59e0b]">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill="currentColor" />)}</div></div><span className="rounded bg-[#003b95] px-2 py-1 text-xs font-bold text-white">{stay.rating.toFixed(1)}</span></div><p className="mt-2 text-sm text-[#536274]"><MapPin size={14} className="mr-1 inline" />{stay.location} · <button className="text-[#0071c2]">Show on map</button></p><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4b5563]">{stay.description}</p><div className="mt-3 flex flex-wrap gap-2">{stay.amenities.slice(0, 4).map((amenity) => <span key={amenity} className="rounded bg-[#eef7ee] px-2 py-1 text-xs text-[#27704a]">{amenity}</span>)}</div></div><div className="flex flex-col justify-end text-left md:items-end md:text-right"><p className="text-xs text-[#536274]">Wonderful</p><p className="mt-1 text-xs text-[#536274]">{Math.round(stay.rating * 83)} reviews</p><p className="mt-3 text-xl font-bold">₹{stay.price.toLocaleString('en-IN')}</p><p className="text-xs text-[#536274]">1 night, 2 adults</p><Link href={`/stays/${stay.slug}`} className="mt-3 rounded bg-[#0071c2] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#005b9d]">Show prices</Link></div></article>)}{!results.length && <div className="rounded border border-[#d9e0e8] bg-white p-10 text-center text-sm">No stays match those filters.</div>}</div></section>
      </div>
    </main>
  </div>;
}