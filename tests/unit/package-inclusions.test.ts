import { describe, expect, it } from 'vitest';
import { inclusionKind, isTransportCategory, matchesQuery, splitInclusionsByGroup, type PickerListing } from '@/lib/package-inclusions-shared';

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