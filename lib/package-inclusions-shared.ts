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
/* ------------------------------------------------------------------ */
/* Itinerary                                                           */
/* ------------------------------------------------------------------ */

export type ItineraryStop = { label: string; note: string };

/** Hard cap so a package can't balloon into an unusable wall of text. */
export const MAX_ITINERARY_STOPS = 30;

const MAX_LABEL = 120;
const MAX_NOTE = 300;

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * Normalises `details.itinerary` from the database.
 *
 * Packages store this as free-form JSON, so the shape is untrusted: it may be
 * missing, an older array shape, or contain junk. Anything without a label is
 * dropped, mirroring how rides discard empty stops before saving.
 */
export function parseItinerary(value: unknown): ItineraryStop[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') return { label: clip(entry, MAX_LABEL), note: '' };
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      return { label: clip(record.label ?? record.title ?? record.name, MAX_LABEL), note: clip(record.note ?? record.description, MAX_NOTE) };
    })
    .filter((stop): stop is ItineraryStop => Boolean(stop?.label))
    .slice(0, MAX_ITINERARY_STOPS);
}

/** Serialises stops for `details.itinerary`, dropping blank rows first. */
export function serializeItinerary(stops: ItineraryStop[]): ItineraryStop[] {
  return stops
    .map((stop) => ({ label: clip(stop?.label, MAX_LABEL), note: clip(stop?.note, MAX_NOTE) }))
    .filter((stop) => stop.label)
    .slice(0, MAX_ITINERARY_STOPS);
}

export function emptyStop(): ItineraryStop {
  return { label: '', note: '' };
}

/** Moves a stop and returns a new array; out-of-range indices are a no-op. */
export function moveStop(stops: ItineraryStop[], from: number, to: number): ItineraryStop[] {
  if (from === to || from < 0 || to < 0 || from >= stops.length || to >= stops.length) return stops;
  const next = [...stops];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function removeStopAt(stops: ItineraryStop[], index: number): ItineraryStop[] {
  if (index < 0 || index >= stops.length) return stops;
  return stops.filter((_, position) => position !== index);
}