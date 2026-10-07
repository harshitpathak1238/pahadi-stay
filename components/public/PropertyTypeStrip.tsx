'use client';

import type { LucideIcon } from 'lucide-react';
import { Building2, Castle, House, Hotel, LayoutGrid, Shapes, Trash2 } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { matchesStayPropertyType, normalisePropertyType, stayPropertyTypes } from '@/lib/search-params';

type PropertyTypeStripProps = {
  /** Full catalogue - decides which chips exist (custom types come from data). */
  allStays: Listing[];
  /** Current results ignoring this strip - source of the count on each chip. */
  results: Listing[];
  /** Active property type; '' means "All". */
  active: string;
  onChange: (type: string) => void;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  homestay: House,
  villa: Castle,
  hotel: Hotel,
};

const iconFor = (type: string): LucideIcon => TYPE_ICONS[normalisePropertyType(type)] ?? Shapes;

/**
 * Quick property-type filter for /stays: a horizontally scrolling row of
 * modern icon chips (All, Homestay, Villa, Hotel + any custom type the admin
 * created) with live counts, plus a delete button at the end that clears the
 * selection back to "All". Clicking the active chip also clears it.
 */
export function PropertyTypeStrip({ allStays, results, active, onChange }: PropertyTypeStripProps) {
  const types = stayPropertyTypes(allStays);
  // A hand-edited URL can select a type no listing currently has; keep it on
  // the row so the active filter stays visible (and clearable) instead of the
  // list silently rendering empty with no chip highlighted.
  const activeLabel = active.trim();
  if (activeLabel && !types.some((type) => normalisePropertyType(type) === normalisePropertyType(activeLabel))) {
    types.push(activeLabel);
  }
  const chips = [
    { label: 'All', value: '' },
    ...types.map((type) => ({ label: type, value: type })),
  ];

  return (
    // `overflow-hidden` is a hard guarantee that nothing in this strip can
    // paint outside its box; the horizontal scrolling happens in the inner row.
    <div className="mb-4 overflow-hidden">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#718096]">
        <Building2 size={13} strokeWidth={2.2} aria-hidden="true" />
        Property type
      </p>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => {
            const isActive = chip.value
              ? normalisePropertyType(active) === normalisePropertyType(chip.value)
              : normalisePropertyType(active) === '';
            const Icon = chip.value ? iconFor(chip.value) : LayoutGrid;
            const count = chip.value
              ? results.filter((stay) => matchesStayPropertyType(stay, chip.value)).length
              : results.length;
            return (
              <button
                key={chip.value ? `type:${chip.value}` : 'type:all'}
                type="button"
                aria-pressed={isActive}
                title={chip.value ? `Show ${chip.label.toLowerCase()} stays only` : 'Show every property type'}
                onClick={() => onChange(isActive && chip.value ? '' : chip.value)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full border py-2 pl-2 pr-3 text-[13px] font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#24584a]/40 ${
                  isActive
                    ? 'border-[#173f35] bg-[#173f35] text-white shadow-[0_8px_18px_rgba(23,63,53,0.22)]'
                    : 'border-[#e4e8e2] bg-white text-[#23332e] shadow-[0_2px_8px_rgba(23,63,53,0.05)] hover:-translate-y-0.5 hover:border-[#c3d0c9] hover:shadow-[0_6px_14px_rgba(23,63,53,0.10)]'
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full transition ${isActive ? 'bg-white/15 text-white' : 'bg-[#eef4ef] text-[#24584a] group-hover:bg-[#e0efe5]'}`}>
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                </span>
                <span>{chip.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${isActive ? 'bg-white/15 text-white/90' : 'bg-[#f1f4f0] text-[#536274]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clears the quick filter (back to All). Sits outside the scroll area
            so it stays reachable at the end of the row on every screen. */}
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={normalisePropertyType(active) === ''}
          title="Clear property type filter"
          aria-label="Clear property type filter"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0d7d7] bg-white text-[#b04a4a] shadow-[0_2px_8px_rgba(23,63,53,0.05)] transition hover:border-[#e3b6b6] hover:bg-[#fdf1f1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b04a4a]/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}