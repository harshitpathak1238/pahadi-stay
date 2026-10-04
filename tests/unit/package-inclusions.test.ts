import { describe, expect, it } from 'vitest';
import {
  emptyStop,
  inclusionKind,
  isTransportCategory,
  matchesQuery,
  MAX_ITINERARY_NOTE,
  MAX_ITINERARY_STOPS,
  moveStop,
  parseItinerary,
  removeStopAt,
  serializeItinerary,
  showsInclusionPrice,
  splitInclusionsByGroup,
  type ItineraryStop,
  type PickerListing,
} from '@/lib/package-inclusions-shared';

const catalogue: PickerListing[] = [
  { id: '1', title: 'Sanobar (Kainchidarshan)', location: 'Bhimtal', category: 'STAY' },
  { id: '2', title: 'Lake darshan', location: 'Nainital', category: 'STAY' },
  { id: '3', title: 'Delhi to bhimtal', location: 'Delhi', category: 'RIDE' },
  { id: '4', title: 'Scooty', location: 'Bhimtal & Bhowali', category: 'RENTAL' },
];

describe('inclusionKind', () => {
  it('maps listing categories to the kinds rendered on a package page', () => {
    expect(inclusionKind('STAY')).toBe('stay');
    expect(inclusionKind('RIDE')).toBe('ride');
    expect(inclusionKind('RENTAL')).toBe('rental');
    expect(inclusionKind('ACTIVITY')).toBe('activity');
  });

  it('falls back to "other" for an unknown or missing category', () => {
    expect(inclusionKind('SOMETHING_NEW')).toBe('other');
    expect(inclusionKind('')).toBe('other');
    expect(inclusionKind(undefined as unknown as string)).toBe('other');
  });
});

describe('showsInclusionPrice', () => {
  it('hides the nightly rate on stay cards', () => {
    // Stay pricing is enquiry-first: the package page shows one bundled total.
    expect(showsInclusionPrice('STAY')).toBe(false);
  });

  it('keeps prices on transport, activity and unknown cards', () => {
    expect(showsInclusionPrice('RIDE')).toBe(true);
    expect(showsInclusionPrice('RENTAL')).toBe(true);
    expect(showsInclusionPrice('ACTIVITY')).toBe(true);
    expect(showsInclusionPrice('SOMETHING_NEW')).toBe(true);
    expect(showsInclusionPrice('')).toBe(true);
  });
});

describe('isTransportCategory', () => {
  it('treats rides and rentals as cars', () => {
    expect(isTransportCategory('RIDE')).toBe(true);
    expect(isTransportCategory('RENTAL')).toBe(true);
  });

  it('does not treat stays or activities as cars', () => {
    expect(isTransportCategory('STAY')).toBe(false);
    expect(isTransportCategory('ACTIVITY')).toBe(false);
  });
});

describe('splitInclusionsByGroup', () => {
  it('separates hotels from cars so the editor can list them apart', () => {
    const { stays, transport } = splitInclusionsByGroup(catalogue);
    expect(stays.map((l) => l.title)).toEqual(['Sanobar (Kainchidarshan)', 'Lake darshan']);
    expect(transport.map((l) => l.title)).toEqual(['Delhi to bhimtal', 'Scooty']);
  });

  it('preserves the source ordering within each group', () => {
    const { stays, transport } = splitInclusionsByGroup(catalogue);
    expect(stays).toEqual(catalogue.filter((l) => l.category === 'STAY'));
    expect(transport).toHaveLength(2);
  });

  it('filters by title or location, case-insensitively', () => {
    // "bhimtal" matches the ride by title and the scooter by location.
    expect(splitInclusionsByGroup(catalogue, 'bhimtal').transport.map((l) => l.title)).toEqual(['Delhi to bhimtal', 'Scooty']);
    expect(splitInclusionsByGroup(catalogue, 'nainital').stays.map((l) => l.title)).toEqual(['Lake darshan']);
    expect(splitInclusionsByGroup(catalogue, '  SCOOTY ').transport.map((l) => l.title)).toEqual(['Scooty']);
    expect(splitInclusionsByGroup(catalogue, 'delhi').transport.map((l) => l.title)).toEqual(['Delhi to bhimtal']);
  });

  it('returns empty groups when nothing matches', () => {
    expect(splitInclusionsByGroup(catalogue, 'zzzz')).toEqual({ stays: [], transport: [] });
  });

  it('keeps activities with stays rather than dropping them from selection', () => {
    const { stays, transport } = splitInclusionsByGroup([{ id: '9', title: 'Trek', location: 'Bhimtal', category: 'ACTIVITY' }]);
    expect(stays.map((l) => l.title)).toEqual(['Trek']);
    expect(transport).toEqual([]);
  });

  it('handles an empty catalogue', () => {
    expect(splitInclusionsByGroup([])).toEqual({ stays: [], transport: [] });
  });
});

describe('matchesQuery', () => {
  it('returns true for a blank query and tolerates a missing location', () => {
    expect(matchesQuery({ id: '1', title: 'A', location: '', category: 'STAY' }, '')).toBe(true);
    expect(matchesQuery({ id: '1', title: 'A', location: '', category: 'STAY' }, '   ')).toBe(true);
  });

  it('does not throw when location is missing entirely', () => {
    const listing = { id: '1', title: 'Oak House', category: 'STAY' } as PickerListing;
    expect(matchesQuery(listing, 'oak')).toBe(true);
    expect(matchesQuery(listing, 'zzz')).toBe(false);
  });
});

describe('parseItinerary', () => {
  it('returns an empty list when details has no itinerary', () => {
    expect(parseItinerary(undefined)).toEqual([]);
    expect(parseItinerary(null)).toEqual([]);
    expect(parseItinerary({ duration: '3 nights' })).toEqual([]);
    expect(parseItinerary('not an array')).toEqual([]);
  });

  it('keeps ordered stops with labels and notes', () => {
    const stops = parseItinerary([
      { label: 'Nainital lake shore', note: 'Sunset walk' },
      { label: 'Kainchi Dham', note: '' },
    ]);
    expect(stops).toEqual([
      { label: 'Nainital lake shore', note: 'Sunset walk' },
      { label: 'Kainchi Dham', note: '' },
    ]);
  });

  it('drops stops with no label, matching how rides discard blank rows', () => {
    expect(parseItinerary([{ label: '', note: 'orphan note' }, { label: 'Bhimbtal', note: '' }])).toEqual([
      { label: 'Bhimbtal', note: '' },
    ]);
  });

  it('tolerates legacy string entries and alternative key names', () => {
    expect(parseItinerary(['Nainital', { title: 'Sattal', description: 'boating' }, { name: 'Mukteshwar' }])).toEqual([
      { label: 'Nainital', note: '' },
      { label: 'Sattal', note: 'boating' },
      { label: 'Mukteshwar', note: '' },
    ]);
  });

  it('ignores junk entries instead of throwing', () => {
    expect(parseItinerary([null, undefined, 5, { label: 'Kainchi Dham' }, 'x'])).toEqual([
      { label: 'Kainchi Dham', note: '' },
      { label: 'x', note: '' },
    ]);
  });

  it('trims and caps overlong text', () => {
    const [stop] = parseItinerary([{ label: `  ${'a'.repeat(200)}  `, note: 'b'.repeat(1000) }]);
    expect(stop.label).toHaveLength(120);
    expect(stop.note).toHaveLength(MAX_ITINERARY_NOTE);
  });

  it('caps the number of stops at the maximum', () => {
    const many = Array.from({ length: MAX_ITINERARY_STOPS + 10 }, (_, i) => ({ label: `Stop ${i}` }));
    expect(parseItinerary(many)).toHaveLength(MAX_ITINERARY_STOPS);
  });

  it('survives non-string label types', () => {
    expect(parseItinerary([{ label: 42 }, { label: null }])).toEqual([]);
  });
});

describe('serializeItinerary', () => {
  it('drops blank rows so stray empty inputs are never persisted', () => {
    expect(serializeItinerary([{ label: 'Nainital', note: '' }, { label: '   ', note: 'note only' }])).toEqual([
      { label: 'Nainital', note: '' },
    ]);
  });

  it('trims labels and notes', () => {
    expect(serializeItinerary([{ label: '  Sattal  ', note: '  boating  ' }])).toEqual([{ label: 'Sattal', note: 'boating' }]);
  });

  it('round-trips through parseItinerary', () => {
    const stops: ItineraryStop[] = [
      { label: 'Bhimbtal', note: 'Lake view' },
      { label: 'Naukuchiatal', note: '' },
    ];
    expect(parseItinerary(serializeItinerary(stops))).toEqual(stops);
  });
});

describe('emptyStop', () => {
  it('creates a blank row', () => {
    expect(emptyStop()).toEqual({ label: '', note: '' });
  });
});

describe('moveStop', () => {
  const stops: ItineraryStop[] = [
    { label: 'One', note: '' },
    { label: 'Two', note: '' },
    { label: 'Three', note: '' },
  ];

  it('moves a stop up and down while preserving the rest', () => {
    expect(moveStop(stops, 2, 0).map((s) => s.label)).toEqual(['Three', 'One', 'Two']);
    expect(moveStop(stops, 0, 2).map((s) => s.label)).toEqual(['Two', 'Three', 'One']);
  });

  it('reorders one step at a time', () => {
    expect(moveStop(stops, 0, 1).map((s) => s.label)).toEqual(['Two', 'One', 'Three']);
  });

  it('is a no-op for out-of-range or same-index moves', () => {
    expect(moveStop(stops, -1, 0)).toBe(stops);
    expect(moveStop(stops, 0, 99)).toBe(stops);
    expect(moveStop(stops, 1, 1)).toBe(stops);
  });

  it('does not mutate the original array', () => {
    const before = stops.map((s) => s.label);
    moveStop(stops, 0, 2);
    expect(stops.map((s) => s.label)).toEqual(before);
  });

  it('handles an empty list', () => {
    expect(moveStop([], 0, 1)).toEqual([]);
  });
});

describe('removeStopAt', () => {
  const stops: ItineraryStop[] = [
    { label: 'One', note: '' },
    { label: 'Two', note: '' },
  ];

  it('removes only the targeted row', () => {
    expect(removeStopAt(stops, 0).map((s) => s.label)).toEqual(['Two']);
    expect(removeStopAt(stops, 1).map((s) => s.label)).toEqual(['One']);
  });

  it('is a no-op for out-of-range indices', () => {
    expect(removeStopAt(stops, 5)).toBe(stops);
    expect(removeStopAt(stops, -1)).toBe(stops);
  });

  it('does not mutate the original array', () => {
    removeStopAt(stops, 0);
    expect(stops).toHaveLength(2);
  });
});