'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';

interface FilterSidebarProps {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  results: Listing[];
  allStays: Listing[];
  filters: string[];
}

export function FilterSidebar({
  filterOpen,
  setFilterOpen,
  activeFilters,
  toggleFilter,
  maxPrice,
  setMaxPrice,
  results,
  allStays,
  filters,
}: FilterSidebarProps) {
  // Compute filter counts from current filtered results
  const filterCounts: Record<string, number> = {};
  filters.forEach((filter) => {
    filterCounts[filter] = results.filter((stay) =>
      stay.amenities.some((amenity) =>
        amenity.toLowerCase().includes(filter.toLowerCase().replace(' included', '').replace(' view', ''))
      )
    ).length;
  });

  // Star rating counts
  const ratingCounts = {
    '5 stars': results.filter((stay) => stay.rating >= 4.5).length,
    '4+ stars': results.filter((stay) => stay.rating >= 4).length,
    '3+ stars': results.filter((stay) => stay.rating >= 3).length,
  };

  const maxPriceInResults = Math.max(...allStays.map((stay) => stay.price), 10000);

  return (
    <>
      {/* Mobile filter button */}
      <button
        className="mb-3 inline-flex items-center gap-2 rounded border border-[#b9c5d1] bg-white px-3 py-2 text-sm lg:hidden"
        onClick={() => setFilterOpen(true)}
      >
        <SlidersHorizontal size={15} /> Filters
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          filterOpen ? 'block' : 'hidden'
        } fixed inset-0 z-40 overflow-y-auto bg-black/50 lg:relative lg:z-auto lg:block lg:bg-transparent lg:p-0`}
      >
        <div className="rounded-lg border border-[#d9e0e8] bg-white p-4 lg:bg-white">
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-bold">Filter by:</h2>
            <button className="text-xs text-[#0071c2]" onClick={() => setFilterOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Map placeholder */}
          <div className={`${filterOpen ? 'mt-4' : 'mt-4'} overflow-hidden rounded-lg bg-[#dce9f4] p-4 text-center`}>
            <div className="relative h-28 rounded bg-[#b8d3e8]">
              <span className="absolute left-[22%] top-[35%] text-xl">📍</span>
              <span className="absolute left-[55%] top-[52%] text-xl">📍</span>
              <span className="absolute left-[70%] top-[20%] text-xl">📍</span>
            </div>
            <button className="mt-3 rounded bg-[#0071c2] px-3 py-2 text-xs font-bold text-white hover:bg-[#005b9d]">
              Show on map
            </button>
          </div>

          {/* Star rating filter */}
          <div className="mt-5 border-t border-[#e5e7eb] pt-4">
            <h3 className="text-sm font-bold">Star rating</h3>
            {Object.entries(ratingCounts).map(([rating, count]) => (
              <label key={rating} className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" />
                {rating}
                <span className="ml-auto text-xs text-[#718096]">{count}</span>
              </label>
            ))}
          </div>

          {/* Amenities filter */}
          <div className="mt-5 border-t border-[#e5e7eb] pt-4">
            <h3 className="text-sm font-bold">Amenities</h3>
            {filters.map((filter) => (
              <label key={filter} className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activeFilters.includes(filter)}
                  onChange={() => toggleFilter(filter)}
                />
                {filter}
                <span className="ml-auto text-xs text-[#718096]">{filterCounts[filter] || 0}</span>
              </label>
            ))}
          </div>

          {/* Price range filter */}
          <div className="mt-5 border-t border-[#e5e7eb] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Price range</h3>
              <span className="text-xs text-[#536274]">₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="1000"
              max={maxPriceInResults}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="mt-3 w-full"
            />
            <div className="mt-2 flex gap-2 text-xs text-[#536274]">
              <span>₹1,000</span>
              <span className="ml-auto">₹{maxPriceInResults.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Mobile done button */}
          <button
            className="mt-5 w-full rounded bg-[#0071c2] px-4 py-3 text-sm font-bold text-white hover:bg-[#005b9d] lg:hidden"
            onClick={() => setFilterOpen(false)}
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
}
