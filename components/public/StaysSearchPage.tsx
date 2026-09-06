'use client';

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
      <main className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
        {/* Search bar */}
        <div className="rounded-xl bg-[#feba02] p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <MapPin size={17} className="text-[#1a3a2a]" />
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Destination"
              />
              <X size={15} />
            </label>
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <CalendarDays size={17} className="text-[#1a3a2a]" />
              <input
                value={dates}
                onChange={(event) => setDates(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Dates"
              />
            </label>
            <label className="flex items-center gap-2 rounded border border-[#c98e00] bg-white px-3 py-3 text-sm text-[#374151]">
              <Users size={17} className="text-[#1a3a2a]" />
              <input
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="min-w-0 flex-1 outline-none"
                aria-label="Guests"
              />
            </label>
            <button className="rounded bg-[#1a3a2a] px-7 py-3 font-bold text-white hover:bg-[#0f2818]">
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
                    className={`p-2 transition ${view === 'list' ? 'bg-[#e8f0ed] text-[#1a3a2a]' : 'text-[#536274]'}`}
                  >
                    <List size={17} />
                  </button>
                  <button
                    aria-label="Grid view"
                    onClick={() => setView('grid')}
                    className={`p-2 transition ${view === 'grid' ? 'bg-[#e8f0ed] text-[#1a3a2a]' : 'text-[#536274]'}`}
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
                  className="mt-3 text-sm font-bold text-[#1a3a2a] hover:underline"
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
