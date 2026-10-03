import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GUESTS,
  MAX_GUESTS,
  SEARCH_TABS,
  addDaysISO,
  filterStays,
  fitsGuests,
  guestLabel,
  guestOptions,
  isIsoDate,
  matchesStayFilter,
  matchesStayQuery,
  matchesTextQuery,
  normaliseGuests,
  searchHrefForTab,
  stayCapacity,
  tabFromPathname,
  todayISO,
  validateDateRange,
} from '@/lib/search-params';
import { matchesRideQuery } from '@/lib/rides-shared';

const stay = (over: Record<string, unknown> = {}) => ({
  slug: 'lake-stay',
  title: 'Oak House by the Lake',
  location: 'Bhimtal, Uttarakhand',
  price: 4200,
  rating: 4.9,
  category: 'stay' as const,
  image: '',
  description: 'A sun-filled cedar home with lake views.',
  amenities: ['Lake view', 'Breakfast included', 'Bonfire', 'Wi-Fi'],
  ...over,
});

/**
 * These guard the search defects: the tab bar did not drive the destination,
 * field values were discarded for most categories, dates and guests never
 * filtered anything, and the "Free WiFi" amenity filter matched nothing.
 */
describe('search routing', () => {
  it('keeps the place query when a non-stay category is searched', () => {
    // Previously anything that was not "stays" or "rides" did a bare
    // router.push(target) and threw the input away.
    expect(searchHrefForTab('rentals', { location: 'Bhimtal' })).toBe('/rentals?where=Bhimtal');
    expect(searchHrefForTab('activities', { location: 'Bhimtal' })).toBe('/activities?where=Bhimtal');
    expect(searchHrefForTab('packages', { location: 'Kainchi Dham' })).toBe('/packages?where=Kainchi+Dham');
    expect(searchHrefForTab('rides', { location: 'Bhimtal' })).toBe('/rides?where=Bhimtal');
  });

  it('sends every field on the stays tab', () => {
    const href = searchHrefForTab('stays', {
      location: 'Bhimtal',
      checkIn: '2030-04-01',
      checkOut: '2030-04-04',
      guests: 3,
    });
    expect(href).toBe('/stays?location=Bhimtal&checkIn=2030-04-01&checkOut=2030-04-04&guests=3');
  });

  it('omits the query entirely when nothing was entered', () => {
    expect(searchHrefForTab('stays', { guests: 2 })).toBe('/stays?guests=2');
    expect(searchHrefForTab('rentals', { location: '   ' })).toBe('/rentals');
  });

  it('resolves the active tab from the pathname on every category page', () => {
    expect(tabFromPathname('/')).toBe('stays');
    expect(tabFromPathname('/stays')).toBe('stays');
    expect(tabFromPathname('/rides')).toBe('rides');
    expect(tabFromPathname('/rentals')).toBe('rentals');
    expect(tabFromPathname('/packages/bhimtal')).toBe('packages');
    expect(tabFromPathname('/checkout')).toBe('stays');
  });

  it('exposes a tab for every category so none is a dead end', () => {
    expect(SEARCH_TABS.map((tab) => tab.key)).toEqual(['stays', 'rides', 'rentals', 'activities', 'packages']);
    for (const tab of SEARCH_TABS) expect(searchHrefForTab(tab.key, {})).toContain(tab.route);
  });
});

describe('date validation', () => {
  const today = '2030-01-10';

  it('accepts an empty pair and a valid range', () => {
    expect(validateDateRange('', '', { today }).valid).toBe(true);
    expect(validateDateRange('2030-01-10', '2030-01-12', { today }).valid).toBe(true);
  });

  it('rejects a check-out on or before check-in', () => {
    expect(validateDateRange('2030-01-12', '2030-01-12', { today }).problem).toBe('check-out-before-check-in');
    expect(validateDateRange('2030-01-12', '2030-01-10', { today }).problem).toBe('check-out-before-check-in');
  });

  it('rejects past dates and malformed values', () => {
    expect(validateDateRange('2020-01-01', '', { today }).problem).toBe('check-in-in-past');
    expect(validateDateRange('', '2020-01-01', { today }).problem).toBe('check-out-in-past');
    expect(validateDateRange('not-a-date', '', { today }).problem).toBe('invalid-check-in');
    expect(validateDateRange('2030-02-30', '', { today }).problem).toBe('invalid-check-in');
  });

  it('pushes check-out to the day after check-in', () => {
    expect(addDaysISO('2030-01-10', 1)).toBe('2030-01-11');
    expect(addDaysISO('2030-02-28', 1)).toBe('2030-03-01');
  });

  it('validates real calendar days only', () => {
    expect(isIsoDate('2030-13-01')).toBe(false);
    expect(isIsoDate('2030-02-30')).toBe(false);
    expect(isIsoDate('2030-02-28')).toBe(true);
  });

  it('builds today in local time', () => {
    expect(todayISO(new Date(2030, 0, 5, 23, 30))).toBe('2030-01-05');
  });
});

describe('stay filtering', () => {
  it('narrows on every word rather than an exact phrase', () => {
    expect(matchesStayQuery(stay(), 'bhimtal')).toBe(true);
    expect(matchesStayQuery(stay(), 'lake bhimtal')).toBe(true);
    expect(matchesStayQuery(stay(), 'bhimtal delhi')).toBe(false);
    expect(matchesStayQuery(stay(), '')).toBe(true);
  });

  it('filters by guest count against the declared occupancy', () => {
    expect(fitsGuests(stay({ maxGuests: 4 }), 4)).toBe(true);
    expect(fitsGuests(stay({ maxGuests: 4 }), 5)).toBe(false);
    // No occupancy data must not hide a listing from a normal party.
    expect(fitsGuests(stay(), 6)).toBe(true);
  });

  it('derives occupancy from beds when no maximum is declared', () => {
    expect(stayCapacity(stay({ accommodations: [{ bedrooms: 2, beds: 3 }] }))).toBe(6);
    expect(stayCapacity(stay())).toBeNull();
  });

  it('matches "Free WiFi" against a stored "Wi-Fi" amenity', () => {
    // The old comparison looked for the literal phrase "free wifi" and
    // returned 0 for every stay, so the filter looked broken.
    expect(matchesStayFilter(stay(), 'Free WiFi')).toBe(true);
    expect(matchesStayFilter(stay(), 'Breakfast included')).toBe(true);
    expect(matchesStayFilter(stay(), 'Pet friendly')).toBe(false);
  });

  it('applies location, guests, price and amenities together', () => {
    const results = filterStays(
      [stay(), stay({ slug: 'big', title: 'Group Manor', maxGuests: 12, price: 9000 })],
      { location: 'bhimtal', guests: 6, maxPrice: 5000 },
    );
    expect(results.map((item) => item.slug)).toEqual(['lake-stay']);
  });

  it('drops fully booked stays only once dates are in play', () => {
    const list = [stay({ fullyBooked: true })];
    expect(filterStays(list, {})).toHaveLength(1);
    expect(filterStays(list, { excludeFullyBooked: true })).toHaveLength(0);
  });

  it('never matches a very short token inside an unrelated word', () => {
    expect(matchesTextQuery('Kainchi Dham', 'dh')).toBe(false);
    expect(matchesTextQuery('Kainchi Dham', 'dham')).toBe(true);
  });
});

describe('ride search', () => {
  const ride = {
    title: 'Bhimtal sightseeing loop',
    fromLocation: 'Bhimtal',
    toLocation: 'Nainital',
    description: 'A full day around the lake',
    stops: [{ label: 'Tallital' }, { label: 'Bhimtal lake' }],
  };

  it('matches on any word of the query', () => {
    expect(matchesRideQuery(ride, 'bhimtal')).toBe(true);
    expect(matchesRideQuery(ride, 'nainital loop')).toBe(true);
    expect(matchesRideQuery(ride, 'nainital delhi')).toBe(false);
    expect(matchesRideQuery(ride, '  ')).toBe(true);
  });
});
describe('guest counts', () => {
  it('clamps to the supported range instead of silently truncating', () => {
    expect(normaliseGuests('4+')).toBe(4);
    expect(normaliseGuests(0)).toBe(1);
    expect(normaliseGuests(999)).toBe(MAX_GUESTS);
    expect(normaliseGuests('abc')).toBe(DEFAULT_GUESTS);
  });

  it('labels singular and plural correctly', () => {
    expect(guestLabel(1)).toBe('1 guest');
    expect(guestLabel(2)).toBe('2 guests');
  });

  it('offers every count from 1 to the maximum', () => {
    const options = guestOptions();
    expect(options[0]).toBe(1);
    expect(options[options.length - 1]).toBe(MAX_GUESTS);
  });
});