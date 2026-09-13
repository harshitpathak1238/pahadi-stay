import { db } from '@/lib/db';
import type { PublicResult } from '@/lib/listings';
import type { Prisma, RideRoute } from '@prisma/client';

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
  durationMinutes: number | null;
  images: string[];
  image: string;
  stops: PublicRideStop[];
  fares: PublicRideFare[];
  minFare: number | null;
};

const stopsInclude = { orderBy: { order: 'asc' as const } };
const faresInclude = { include: { vehicleType: true }, orderBy: { vehicleType: { order: 'asc' as const } } };
const rideInclude = { stops: stopsInclude, fares: faresInclude };

type RideRecord = Prisma.RideRouteGetPayload<{ include: { stops: true; fares: { include: { vehicleType: true } } } }>;
type RideSearchable = Pick<RideRoute, 'title' | 'fromLocation' | 'toLocation' | 'description'> & { stops: { label: string }[] };

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

export function matchesRideQuery(ride: PublicRide | RideSearchable, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return rideSearchText(ride).includes(needle);
}

export function mapRideRecord(record: RideRecord): PublicRide {
  const images = strings(record.images);
  const stops = (record.stops ?? []).map((stop) => ({ label: stop.label, note: stop.note ?? null }));
  const fares = (record.fares ?? [])
    .filter((fare) => fare.vehicleType !== null && Number.isFinite(fare.price) && fare.price > 0)
    .map((fare) => ({
      vehicleTypeId: fare.vehicleType.id,
      vehicleName: fare.vehicleType.name,
      vehicleCapacity: fare.vehicleType.capacity,
      vehicleImage: fare.vehicleType.image ?? null,
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
    durationMinutes: record.durationMinutes !== null ? Number(record.durationMinutes) : null,
    images,
    image: images[0] || '/images/Logo.png',
    stops,
    fares,
    minFare: minFare(fares),
  };
}

export async function getPublicRides(): Promise<PublicResult<PublicRide[]>> {
  try {
    const records = await db.rideRoute.findMany({
      where: { status: 'LIVE' },
      include: rideInclude,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return { data: records.map(mapRideRecord), degraded: false };
  } catch (error) {
    console.error('Public rides unavailable:', error);
    return { data: [], degraded: true };
  }
}

export async function getPublicRide(slug: string): Promise<PublicResult<PublicRide | null>> {
  try {
    const record = await db.rideRoute.findFirst({ where: { slug, status: 'LIVE' }, include: rideInclude });
    return { data: record ? mapRideRecord(record) : null, degraded: false };
  } catch (error) {
    console.error('Public ride detail unavailable:', error);
    return { data: null, degraded: true };
  }
}