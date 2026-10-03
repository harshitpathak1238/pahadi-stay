/**
 * Client-safe helpers for package inclusions.
 *
 * Deliberately dependency-free: the admin package editor is a client component,
 * and importing from `@/lib/packages` would pull Prisma and Redis into the
 * browser bundle.
 */

/** Categories an admin sees under "Cars & rides" rather than "Hotels & homestays". */
export const TRANSPORT_CATEGORIES = ['RIDE', 'RENTAL'] as const;

export type InclusionCategory = 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' | (string & {});

export type InclusionKind = 'stay' | 'ride' | 'rental' | 'activity' | 'other';

export function isTransportCategory(category: string) {
  return (TRANSPORT_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Maps a listing category to the kind used for public package cards.
 * Unknown categories fall back to "other" rather than throwing.
 */
export function inclusionKind(category: string): InclusionKind {
  if (category === 'STAY') return 'stay';
  if (category === 'RIDE') return 'ride';
  if (category === 'RENTAL') return 'rental';
  if (category === 'ACTIVITY') return 'activity';
  return 'other';
}

/** Minimum shape the picker needs to group and filter a catalogue. */
export type PickerListing = { id: string; title: string; location: string; category: string; status?: string };

/** Free-text match over title and location, case- and whitespace-insensitive. */
export function matchesQuery(listing: PickerListing, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return listing.title.toLowerCase().includes(needle) || (listing.location || '').toLowerCase().includes(needle);
}

export type InclusionGroups = {
  stays: PickerListing[];
  transport: PickerListing[];
};

/**
 * Splits a catalogue into the two groups the package editor presents.
 * Ordering follows the source so admins keep a predictable list.
 */
export function splitInclusionsByGroup(listings: PickerListing[], query = ''): InclusionGroups {
  const stays: PickerListing[] = [];
  const transport: PickerListing[] = [];

  for (const listing of listings) {
    if (!matchesQuery(listing, query)) continue;
    (listing.category === 'STAY' ? stays : isTransportCategory(listing.category) ? transport : stays).push(listing);
  }

  return { stays, transport };
}