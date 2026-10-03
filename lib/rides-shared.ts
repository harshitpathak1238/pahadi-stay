// Pure ride helpers shared by server code and client components.
//
// This module deliberately has NO imports from Prisma, the database or the
// cache layer: client components (RideManager, RidesExplorer) can depend on it
// without dragging server-only packages into the browser bundle.

import { tokenise } from '@/lib/search-params';

export type RideType = 'SIGHTSEEING' | 'TRANSFER';

export type PublicRideFare = {
  vehicleTypeId: string;
  vehicleName: string;
  vehicleCapacity: number;
  vehicleImage: string | null;
  price: number;
};

export type PublicRideStop = {
  label: string;
  note: string | null;
};

export type PublicRide = {
  id: string;
  slug: string;
  title: string;
  type: RideType;
  description: string;
  fromLocation: string | null;
  toLocation: string | null;
  distanceKm: number | null;
  durationDays: number | null;
  images: string[];
  image: string;
  stops: PublicRideStop[];
  fares: PublicRideFare[];
  minFare: number | null;
};

/** Minimal shape needed for search — avoids requiring the full Prisma record. */
export type RideSearchable = {
  title: string;
  fromLocation: string | null;
  toLocation: string | null;
  description: string;
  stops: { label: string }[];
};

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

// Lowest positive fare across a route's vehicles. Fares of zero or blank are
// treated as "not offered" — a route with none returns null (pricing coming soon).
export function minFare(fares: { price: number }[]): number | null {
  const prices = fares.map((fare) => fare.price).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function selectedVehicleName(
  vehicles: { vehicleTypeId: string; vehicleName?: string }[],
  vehicleTypeId: string | undefined,
): string {
  if (!vehicles || !vehicleTypeId) return 'this ride';
  const hit = vehicles.find((v) => v.vehicleTypeId === vehicleTypeId);
  return hit?.vehicleName ?? 'this ride';
}

export function slugifyRideTitle(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function rideSearchText(ride: PublicRide | RideSearchable): string {
  const stops = Array.isArray(ride.stops) ? ride.stops.map((stop) => stop.label) : [];
  return [ride.title, ride.fromLocation, ride.toLocation, ...stops, ride.description].filter(Boolean).join(' ').toLowerCase();
}

// Multi-token matching so "bhimtal transfer" narrows results instead of
// demanding that exact phrase appear in the record.
export function matchesRideQuery(ride: PublicRide | RideSearchable, query: string): boolean {
  const tokens = tokenise(query);
  if (!tokens.length) return true;
  return tokens.every((token) => rideSearchText(ride).includes(token));
}

/** Structural type for the Prisma row `mapRideRecord` accepts. */
export type RideRecordLike = {
  id: string;
  slug: string;
  title: string;
  type: RideType;
  description: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  distanceKm: unknown;
  durationDays: unknown;
  images: unknown;
  stops?: { label: string; note: string | null }[] | null;
  fares?: ({ price: number; vehicleType: { id: string; name: string; capacity: number; image: string | null } | null })[] | null;
};

export function mapRideRecord(record: RideRecordLike): PublicRide {
  const images = strings(record.images);
  const stops = (record.stops ?? []).map((stop) => ({ label: stop.label, note: stop.note ?? null }));
  const fares = (record.fares ?? [])
    .filter((fare) => fare.vehicleType !== null && Number.isFinite(fare.price) && fare.price > 0)
    .map((fare) => ({
      vehicleTypeId: fare.vehicleType!.id,
      vehicleName: fare.vehicleType!.name,
      vehicleCapacity: fare.vehicleType!.capacity,
      vehicleImage: fare.vehicleType!.image ?? null,
      price: Number(fare.price),
    }));
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    type: record.type,
    description: record.description ?? '',
    fromLocation: record.fromLocation ?? null,
    toLocation: record.toLocation ?? null,
    distanceKm: record.distanceKm !== null ? Number(record.distanceKm) : null,
    durationDays: record.durationDays !== null ? Number(record.durationDays) : null,
    images,
    image: images[0] || '/images/Logo.png',
    stops,
    fares,
    minFare: minFare(fares),
  };
}