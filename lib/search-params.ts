// Pure search rules shared by the hero search box, the results pages, the API
// guards and the unit tests.
//
// This module deliberately has NO imports from React, Prisma, the database or
// the cache layer. Server components, client components and a node-environment
// test runner all need to agree on what a search actually matches, so the rules
// live in one place that any of them can import safely.

export type SearchTabKey = 'stays' | 'rides' | 'rentals' | 'activities' | 'packages';

export type SearchTab = { key: SearchTabKey; label: string; route: string };

/**
 * Tab order and labels must stay in step with `components/ui/CategoryTabs`.
 * The home page shows this list above the search box, and the chosen tab is
 * what decides where pressing "Search" actually goes.
 */
export const SEARCH_TABS: SearchTab[] = [
  { key: 'stays', label: 'Stays', route: '/stays' },
  { key: 'rides', label: 'Rides', route: '/rides' },
  { key: 'rentals', label: 'Rentals', route: '/rentals' },
  { key: 'activities', label: 'Experiences', route: '/activities' },
  { key: 'packages', label: 'Packages', route: '/packages' },
];

export const SEARCH_TAB_ROUTES: Record<SearchTabKey, string> = SEARCH_TABS.reduce(
  (routes, tab) => {
    routes[tab.key] = tab.route;
    return routes;
  },
  {} as Record<SearchTabKey, string>,
);

export const DEFAULT_SEARCH_TAB: SearchTabKey = 'stays';

/** Places offered to the guest as autocomplete suggestions. */
export const SUGGESTED_PLACES = [
  'Bhimtal',
  'Kainchi Dham',
  'Bhowali',
  'Nainital',
  'Pangot',
  'Ramnagar',
  'Kathgodam',
  'Haldwani',
] as const;

export const MIN_GUESTS = 1;
export const MAX_GUESTS = 20;
export const DEFAULT_GUESTS = 2;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isSearchTabKey(value: unknown): value is SearchTabKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SEARCH_TAB_ROUTES, value);
}

/** Which tab a pathname belongs to; unknown paths fall back to Stays. */
export function tabFromPathname(pathname: string | null | undefined): SearchTabKey {
  if (!pathname) return DEFAULT_SEARCH_TAB;
  const match = SEARCH_TABS.find((tab) => pathname === tab.route || pathname.startsWith(`${tab.route}/`));
  return match ? match.key : DEFAULT_SEARCH_TAB;
}

/** Clamps anything user- or URL-supplied into the supported 1-20 range. */
export function normaliseGuests(value: unknown, fallback: number = DEFAULT_GUESTS): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Math.trunc(parsed)));
}

export function guestLabel(count: number): string {
  const guests = normaliseGuests(count);
  return `${guests} ${guests === 1 ? 'guest' : 'guests'}`;
}

export function guestOptions(count = MAX_GUESTS): number[] {
  return Array.from({ length: Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, count)) }, (_, index) => index + 1);
}
/** Local (not UTC) calendar day - avoids the classic off-by-one at midnight. */
export function todayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addDaysISO(value: string, days: number): string {
  if (!isIsoDate(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type DateRangeProblem =
  | 'invalid-check-in'
  | 'invalid-check-out'
  | 'check-in-in-past'
  | 'check-out-in-past'
  | 'check-out-before-check-in';

export type DateRangeResult =
  | { valid: true; problem: null; message: '' }
  | { valid: false; problem: DateRangeProblem; message: string };

const DATE_RANGE_MESSAGES: Record<DateRangeProblem, string> = {
  'invalid-check-in': 'Choose a valid check-in date.',
  'invalid-check-out': 'Choose a valid check-out date.',
  'check-in-in-past': 'Check-in cannot be in the past.',
  'check-out-in-past': 'Check-out cannot be in the past.',
  // Matches `lib/validations/booking.ts`, which requires checkOut > checkIn, so
  // search rejects exactly what booking would reject.
  'check-out-before-check-in': 'Check-out must be after check-in.',
};

/**
 * Validates the date pair before we navigate. Search previously forwarded any
 * pair of strings, including an empty check-out and a range that ends before
 * it starts.
 */
export function validateDateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  options: { today?: string } = {},
): DateRangeResult {
  const today = options.today ?? todayISO();
  const from = typeof checkIn === 'string' ? checkIn.trim() : '';
  const to = typeof checkOut === 'string' ? checkOut.trim() : '';
  const fail = (problem: DateRangeProblem): DateRangeResult => ({ valid: false, problem, message: DATE_RANGE_MESSAGES[problem] });

  if (!from && !to) return { valid: true, problem: null, message: '' };
  if (from && !isIsoDate(from)) return fail('invalid-check-in');
  if (to && !isIsoDate(to)) return fail('invalid-check-out');
  if (from && from < today) return fail('check-in-in-past');
  if (to && to < today) return fail('check-out-in-past');
  if (from && to && to <= from) return fail('check-out-before-check-in');
  return { valid: true, problem: null, message: '' };
}

export type SearchValues = {
  location?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | string | null;
};

/**
 * Builds the query string for a tab.
 *
 * Stays keep `location`/`checkIn`/`checkOut`/`guests`. The other categories
 * only understand a place query today, and they read it as `where` - that is
 * the parameter `/rides` has always used, so shared links keep working.
 */
export function searchParamsForTab(tab: SearchTabKey, values: SearchValues): URLSearchParams {
  const params = new URLSearchParams();
  const where = typeof values.location === 'string' ? values.location.trim() : '';
  if (tab === 'stays') {
    if (where) params.set('location', where);
    if (values.checkIn) params.set('checkIn', values.checkIn);
    if (values.checkOut) params.set('checkOut', values.checkOut);
    params.set('guests', String(normaliseGuests(values.guests)));
    return params;
  }
  if (where) params.set('where', where);
  return params;
}

export function searchHrefForTab(tab: SearchTabKey, values: SearchValues): string {
  const route = SEARCH_TAB_ROUTES[tab] ?? SEARCH_TAB_ROUTES[DEFAULT_SEARCH_TAB];
  const query = searchParamsForTab(tab, values).toString();
  return query ? `${route}?${query}` : route;
}

/** Lowercases and reduces punctuation to single spaces so matching is forgiving. */
export function normaliseText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenise(value: unknown): string[] {
  const text = normaliseText(value);
  return text ? text.split(' ') : [];
}

/**
 * Every query token must appear somewhere in the haystack, so "bhimtal lake"
 * narrows instead of demanding that exact phrase. Tokens of one or two
 * characters have to match a whole word so they cannot match inside unrelated
 * words.
 */
export function matchesTextQuery(haystack: unknown, query: string | null | undefined): boolean {
  const tokens = tokenise(query);
  if (!tokens.length) return true;
  const text = normaliseText(haystack);
  if (!text) return false;
  const words = new Set(text.split(' '));
  return tokens.every((token) => (token.length <= 2 ? words.has(token) : text.includes(token)));
}

/** The fields a stay is searched against. */
export type SearchableStay = {
  title: string;
  location: string;
  description?: string;
  amenities?: string[];
  maxGuests?: number;
  fullyBooked?: boolean;
  accommodations?: { bedrooms: number; beds: number }[];
};

export function staySearchText(stay: SearchableStay): string {
  return [stay.title, stay.location, stay.description ?? '', ...(stay.amenities ?? [])].join(' ');
}

export function matchesStayQuery(stay: SearchableStay, query: string | null | undefined): boolean {
  return matchesTextQuery(staySearchText(stay), query);
}

export type StayFilter = { label: string; terms: string[] };

/**
 * Amenity filters carry explicit match terms. The previous implementation
 * compared the filter label against the amenity text, so "Free WiFi" looked
 * for the literal phrase "free wifi" and never matched the stored "Wi-Fi".
 */
export const STAY_FILTERS: StayFilter[] = [
  { label: 'Free WiFi', terms: ['wi fi', 'wifi', 'internet'] },
  { label: 'Breakfast included', terms: ['breakfast', 'meals'] },
  { label: 'Parking', terms: ['parking', 'park'] },
  { label: 'Lake view', terms: ['lake', 'lakeside', 'waterfront'] },
  { label: 'Pet friendly', terms: ['pet', 'dog'] },
];

export function matchesStayFilter(stay: SearchableStay, label: string): boolean {
  const filter = STAY_FILTERS.find((item) => item.label === label);
  if (!filter) return false;
  const haystack = normaliseText(staySearchText(stay));
  return filter.terms.some((term) => haystack.includes(normaliseText(term)));
}

export function matchesAllStayFilters(stay: SearchableStay, labels: string[]): boolean {
  return labels.every((label) => matchesStayFilter(stay, label));
}

/**
 * Occupancy for a stay, or null when the partner has not set one.
 *
 * Falls back to twice the number of beds when accommodations are described but
 * no explicit limit exists, so a real listing is not silently unfillable.
 */
export function stayCapacity(stay: SearchableStay): number | null {
  const declared = Number(stay.maxGuests);
  if (Number.isFinite(declared) && declared > 0) return Math.trunc(declared);
  const beds = (stay.accommodations ?? []).reduce((total, room) => total + (Number(room.beds) > 0 ? Number(room.beds) : 0), 0);
  return beds > 0 ? beds * 2 : null;
}

/**
 * Unknown capacity is not treated as "too small" - a listing with no occupancy
 * data should still appear for a normal party rather than vanish from search.
 */
export function fitsGuests(stay: SearchableStay, guests: number): boolean {
  const capacity = stayCapacity(stay);
  if (capacity === null) return true;
  return capacity >= normaliseGuests(guests);
}

export type StayQuery = {
  location?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  guests?: number | null;
  amenities?: string[];
  /** Drop listings flagged fully booked - used once real dates are in play. */
  excludeFullyBooked?: boolean;
};

export function filterStays<T extends SearchableStay & { price: number }>(stays: T[], query: StayQuery): T[] {
  const location = query.location ?? '';
  const guests = normaliseGuests(query.guests);
  const minPrice = Number.isFinite(query.minPrice as number) ? (query.minPrice as number) : undefined;
  const maxPrice = Number.isFinite(query.maxPrice as number) ? (query.maxPrice as number) : undefined;
  const amenities = query.amenities ?? [];

  return stays.filter((stay) => {
    if (query.excludeFullyBooked && stay.fullyBooked) return false;
    if (!matchesStayQuery(stay, location)) return false;
    if (!fitsGuests(stay, guests)) return false;
    if (!matchesAllStayFilters(stay, amenities)) return false;
    if (minPrice !== undefined && stay.price < minPrice) return false;
    if (maxPrice !== undefined && stay.price > maxPrice) return false;
    return true;
  });
}