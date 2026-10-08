'use client';
import { usePathname, useRouter } from 'next/navigation';
import { BedDouble, Bike, Compass, Package, Sparkles } from 'lucide-react';
import { SEARCH_TAB_ROUTES, isSearchTabKey } from '@/lib/search-params';

const categories = [
  ['stays', 'Stays', BedDouble],
  ['rides', 'Rides', Compass],
  ['rentals', 'Rentals', Bike],
  ['activities', 'Experiences', Sparkles],
  ['packages', 'Packages', Package],
] as const;

type CategoryTabsProps = {
  /** Standalone tabs navigate to their route when clicked. */
  navigate?: boolean;
  variant?: 'glass' | 'solid';
  /**
   * Controlled mode. `SearchBox` passes its selection + a handler that
   * navigates immediately (carrying typed values), so tabs are never dead.
   */
  activeKey?: string;
  onSelectKey?: (key: string) => void;
};

export function CategoryTabs({ navigate = false, variant = 'glass', activeKey, onSelectKey }: CategoryTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeKey ?? (categories.find(([key]) => pathname === `/${key}` || pathname.startsWith(`/${key}/`))?.[0] || 'stays');
  const shellClass =
    variant === 'glass'
      ? 'category-tabs category-tabs--glass inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/55 bg-white/15 p-1.5 shadow-[0_12px_32px_rgba(7,31,25,.22)] backdrop-blur-xl'
      : 'category-tabs category-tabs--solid inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-[#e4e3da] bg-white/85 p-1.5 shadow-[0_10px_28px_rgba(23,63,53,.10)] backdrop-blur-xl';
  return (
    <div className={shellClass} role="tablist" aria-label="Explore categories">
      {categories.map(([key, label, Icon]) => {
        const isActive = active === key;
        const handleClick = () => {
          // Controlled (hero search) mode always wins: SearchBox navigates
          // with typed values. Standalone mode (`navigate`) falls back to the
          // shared route map so a new tab can never push a wrong URL.
          if (onSelectKey) { onSelectKey(key); return; }
          if (navigate && isSearchTabKey(key)) router.push(SEARCH_TAB_ROUTES[key]);
        };
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={handleClick}
            className={`sans inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e5b785] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
              isActive
                ? 'category-tab-active bg-gradient-to-b from-[#1e5044] to-[#173f35] text-white shadow-[0_8px_18px_rgba(23,63,53,.35)] ring-1 ring-white/20'
                : variant === 'glass'
                  ? 'text-white/90 hover:bg-white/15 hover:text-white'
                  : 'text-[#526057] hover:bg-[#f1f3ed] hover:text-[#173f35]'
            }`}
          >
            <Icon size={16} strokeWidth={2.2} aria-hidden="true" className={isActive ? 'text-[#e5b785]' : ''} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
