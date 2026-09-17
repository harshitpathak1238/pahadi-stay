import type { PublicRide, PublicRideFare } from './rides';

export type PickupRoute = Pick<PublicRide, 'id' | 'slug' | 'title' | 'fromLocation' | 'toLocation' | 'fares'>;
export type StayPickup = {
  routeId: string;
  routeTitle: string;
  fromLocation: string;
  toLocation: string;
  vehicleTypeId: string;
  vehicleName: string;
  price: number;
};

/** Only published transfer data passed by the server; never invent a reverse fare. */
export function pickupRoutes(rides: PublicRide[]): PickupRoute[] {
  return rides.filter((ride) => ride.type === 'TRANSFER' && ride.fromLocation?.trim() && ride.toLocation?.trim())
    .map(({ id, slug, title, fromLocation, toLocation, fares }) => ({
      id, slug, title, fromLocation, toLocation,
      fares: fares.filter((fare) => Number.isFinite(fare.price) && fare.price > 0),
    })).filter((route) => route.fares.length > 0);
}

export function resolveStayPickup(routes: PickupRoute[], routeId: string, vehicleTypeId: string): StayPickup | null {
  const route = routes.find((item) => item.id === routeId);
  const fare: PublicRideFare | undefined = route?.fares.find((item) => item.vehicleTypeId === vehicleTypeId);
  if (!route?.fromLocation || !route.toLocation || !fare || !Number.isFinite(fare.price) || fare.price <= 0) return null;
  return { routeId, routeTitle: route.title, fromLocation: route.fromLocation, toLocation: route.toLocation,
    vehicleTypeId, vehicleName: fare.vehicleName, price: fare.price };
}


export const PICKUP_LOCATION_OPTIONS = [
  'Kathgodam Railway Station',
  'Kathgodam Bus Stand',
  'Pantnagar Airport',
  'Haldwani',
  'My homestay',
  'Other — describe it',
] as const;

export const PICKUP_PRICING: Record<string, number> = {
  'Kathgodam Railway Station': 350,
  'Kathgodam Bus Stand': 300,
  'Pantnagar Airport': 550,
  Haldwani: 250,
  'My homestay': 0,
  'Other — describe it': 450,
};

export function getPickupPrice(location: string) {
  return PICKUP_PRICING[location] ?? 450;
}
