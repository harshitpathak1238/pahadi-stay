'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutGrid, List } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { FilterSidebar } from './FilterSidebar';
import { ResultCard } from './ResultCard';
import { StaysSearchBar } from './StaysSearchBar';
import { Breadcrumbs } from './Breadcrumbs';
import { useWishlist } from '@/hooks/use-wishlist';
import { STAY_FILTERS, filterStays, matchesStayPropertyType, normaliseGuests } from '@/lib/search-params';
import { PropertyTypeStrip } from './PropertyTypeStrip';

const filters = STAY_FILTERS.map((filter) => filter.label);

type StaysSearchPageProps = {
  stays: Listing[];
  initialLocation: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialMinRating?: number;
  initialAmenities?: string[];
  initialPropertyType?: string;
};

export function StaysSearchPage({ stays, initialLocation, initialCheckIn, initialCheckOut, initialGuests, initialMinPrice, initialMaxPrice, initialMinRating, initialAmenities, initialPropertyType }: StaysSearchPageProps) {
  const router = useRouter();
  const prices = stays.map((stay) => stay.price).filter((price) => Number.isFinite(price));
  const datasetMinPrice = prices.length ? Math.min(...prices) : 0;
  const datasetMaxPrice = prices.length ? Math.max(...prices) : 0;
  const [destination, setDestination] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(() => normaliseGuests(initialGuests));
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [sort, setSort] = useState('Recommended');
  const [activeFilters, setActiveFilters] = useState<string[]>(initialAmenities ?? []);
  const [propertyType, setPropertyType] = useState(initialPropertyType ?? '');
  const [minRating, setMinRating] = useState<number | undefined>(initialMinRating);
  const { slugs: wishlist, toggle: toggleWishlist } = useWishlist();
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice ?? datasetMaxPrice);

  useEffect(() => {
    setDestination(initialLocation);
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setGuestCount(normaliseGuests(initialGuests));
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice ?? datasetMaxPrice);
    setPropertyType(initialPropertyType ?? '');
  }, [datasetMaxPrice, initialCheckIn, initialCheckOut, initialGuests, initialLocation, initialMaxPrice, initialMinPrice, initialPropertyType]);

  // Keep the URL in sync with active filters (router.replace so refresh/back
  // behaviour stays clean) — refreshed or shared links restore the same view.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (destination.trim()) params.set('location', destination.trim());
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      params.set('guests', String(guestCount));
      if (minPrice !== undefined) params.set('minPrice', String(minPrice));
      if (maxPrice !== undefined && maxPrice !== datasetMaxPrice) params.set('maxPrice', String(maxPrice));
      if (minRating !== undefined) params.set('minRating', String(minRating));
      if (activeFilters.length) params.set('amenities', activeFilters.join(','));
      if (propertyType.trim()) params.set('propertyType', propertyType.trim());
      const query = params.toString();
      router.replace(query ? `/stays?${query}` : '/stays', { scroll: false });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeFilters, checkIn, checkOut, destination, guestCount, maxPrice, minPrice, minRating, propertyType, datasetMaxPrice, router]);

  const handleLocationChange = useCallback((value: string) => setDestination(value), []);
  const handlePriceChange = useCallback((nextMinPrice?: number, nextMaxPrice?: number) => {
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice ?? datasetMaxPrice);
  }, [datasetMaxPrice]);
  const handleSearch = useCallback((values: { location: string; checkIn: string; checkOut: string; guests: number }) => {
    setDestination(values.location);
    setCheckIn(values.checkIn);
    setCheckOut(values.checkOut);
    setGuestCount(values.guests);
  }, []);

  // Dates and guests now genuinely narrow the list. They used to be carried in
  // the URL and echoed in the header while the filter ignored them entirely, so
  // choosing a party size or a date range changed nothing on screen.
  const hasDates = Boolean(checkIn || checkOut);

  // Everything except the property-type strip, so the chip counts stay
  // meaningful while a type is selected (mirrors FilterSidebar counting
  // against the filtered results).
  const baseResults = useMemo(
    () =>
      filterStays(stays, {
        location: destination,
        minPrice,
        maxPrice,
        guests: guestCount,
        amenities: activeFilters,
        excludeFullyBooked: hasDates,
      }).filter((stay) => minRating === undefined || stay.rating >= minRating),
    [activeFilters, destination, guestCount, hasDates, maxPrice, minPrice, minRating, stays],
  );

  const results = useMemo(() => {
    const filtered = propertyType.trim()
      ? baseResults.filter((stay) => matchesStayPropertyType(stay, propertyType))
      : baseResults;
    return [...filtered].sort((a, b) =>
      sort === 'Price: low to high' ? a.price - b.price : sort === 'Guest rating' ? b.rating - a.rating : 0
    );
  }, [baseResults, propertyType, sort]);

  const toggleFilter = (filter: string) =>
    setActiveFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  // Wishlist toggling is handled by the shared useWishlist hook.

  return (
    <div className="bg-[#f5f7fa] text-[#1f2937]">
      <main className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
        {/* The site header is `position: fixed`, so the search controls would slide
            behind it while scrolling. `site-header-sticky` pins them just under the
            bar, using the header's real measured height. The full-bleed padding
            cancels `main`'s side padding so result cards can't peek through the
            pill's rounded corners while it is stuck. */}
        <div className="site-header-sticky -mx-3 bg-[#f5f7fa] px-3 py-2 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <StaysSearchBar
            stays={stays}
            initialLocation={initialLocation}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
            initialGuests={initialGuests}
            initialMinPrice={initialMinPrice}
            initialMaxPrice={initialMaxPrice}
            onLocationChange={handleLocationChange}
            onPriceChange={handlePriceChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Breadcrumb: Home › Stays › City / Search results */}
        <Breadcrumbs
          className="mt-4"
          items={
            destination.trim()
              ? [
                  { label: 'Home', href: '/' },
                  { label: 'Stays', href: '/stays' },
                  { label: destination.trim() },
                ]
              : [
                  { label: 'Home', href: '/' },
                  { label: 'Stays', href: '/stays' },
                  { label: 'Search results' },
                ]
          }
        />

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
            minRating={minRating}
            setMinRating={setMinRating}
            results={results}
            allStays={stays}
            filters={filters}
          />

          {/* Right column - results. `min-w-0` is load-bearing: without it the
              mobile grid's implicit auto track is floored by this column's
              min-content (the quick-filter chips are shrink-0), which stretched
              the whole page horizontally instead of letting the chip row clip
              and scroll inside its own box. */}
          <section className="min-w-0">
            {/* Quick property-type filters, right below the Filters bar: All,
                Homestay, Villa, Hotel plus any custom type the admin added,
                scrolling horizontally with a clear button at the end. */}
            <PropertyTypeStrip allStays={stays} results={baseResults} active={propertyType} onChange={setPropertyType} />

            {/* Results header: count, sort, list/grid toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                  {destination.trim() ? `${destination.trim()}: ` : ''}
                  {results.length} {results.length === 1 ? 'property' : 'properties'} found
                </h1>
                <p className="mt-1 text-xs font-medium text-[#536274] sm:text-sm">
                  {checkIn && checkOut ? `${checkIn} to ${checkOut}` : 'Choose dates to plan your stay'} · {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                </p>
              </div>

              {/* Sort and view toggle */}
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <span className="relative inline-flex min-w-0 items-center">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort results"
                    className="min-w-0 appearance-none rounded-full border border-[#e4e8e2] bg-white py-2 pl-4 pr-10 text-sm font-semibold text-[#23332e] shadow-[0_2px_8px_rgba(6,95,70,.06)] transition hover:border-[#cdd6d0] focus:outline-none focus:ring-2 focus:ring-[#047857]/30"
                  >
                    <option>Recommended</option>
                    <option>Price: low to high</option>
                    <option>Guest rating</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-4 text-[#065f46]" />
                </span>

                {/* List/Grid toggle */}
                <div className="hidden items-center overflow-hidden rounded-full border border-[#e4e8e2] bg-white shadow-[0_2px_8px_rgba(6,95,70,.06)] sm:flex">
                  <button
                    aria-label="List view"
                    onClick={() => setView('list')}
                    className={`p-2 transition ${view === 'list' ? 'bg-[#e8f0ed] text-[#065f46]' : 'text-[#536274] hover:text-[#065f46]'}`}
                  >
                    <List size={17} />
                  </button>
                  <button
                    aria-label="Grid view"
                    onClick={() => setView('grid')}
                    className={`p-2 transition ${view === 'grid' ? 'bg-[#e8f0ed] text-[#065f46]' : 'text-[#536274] hover:text-[#065f46]'}`}
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
                  fullyBooked={Boolean(stay.fullyBooked)}
                />
              ))}
            </div>

            {/* Empty state */}
            {results.length === 0 && (
              <div className="rounded-lg border border-[#d9e0e8] bg-white p-8 text-center">
                <p className="text-[#536274]">No properties found matching your search.</p>
                <p className="mt-1 text-sm text-[#718096]">
                  Try a different place, a smaller party, or clear the filters below.
                </p>
                <button
                  onClick={() => {
                    // The destination and the guest count are the two inputs most
                    // likely to have over-narrowed the list, so "Clear filters"
                    // now resets those too - it used to leave them in place and
                    // appear to do nothing.
                    setActiveFilters([]);
                    setPropertyType('');
                    setDestination('');
                    setMinPrice(undefined);
                    setMaxPrice(datasetMaxPrice);
                    setGuestCount(normaliseGuests(1));
                  }}
                  className="mt-3 text-sm font-bold text-[#1a3a2a] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
