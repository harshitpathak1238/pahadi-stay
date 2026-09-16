import { WHATSAPP_NUMBER } from './contact';

/**
 * WhatsApp vehicle enquiry for ride detail pages — the ride-side twin of
 * lib/stay-enquiry. The visitor opens "Enquire on WhatsApp", picks the
 * vehicle(s) they want in the popup, and a ready-made message (ride, route,
 * vehicles, prices, total) is sent to the KainchiDarshan WhatsApp number.
 * Kept free of React so it stays unit-testable in the node test environment.
 */

export type EnquiryVehicle = {
  name: string;
  photos: string[];
  capacity: number;
  /** Per-ride price; null when not set ("price on request"). */
  price: number | null;
  /** True for the synthetic fallback card used when no fares exist. */
  isAnyVehicle?: boolean;
};

export type EnquiryRide = {
  title: string;
  fromLocation: string | null;
  toLocation: string | null;
  slug: string;
  image?: string;
  images?: string[];
  minFare?: number | null;
  fares?: { vehicleTypeId: string; vehicleName: string; vehicleCapacity: number; vehicleImage: string | null; price: number }[] | null;
};

export function vehicleCapacityLabel(capacity: number): string {
  return capacity > 0 ? `Up to ${capacity} seats` : '';
}

/** Builds the selectable vehicle list; falls back to one "Any available vehicle" card. */
export function enquiryVehiclesFromRide(ride: EnquiryRide): EnquiryVehicle[] {
  const vehicles = (ride.fares ?? [])
    .filter((fare) => fare.vehicleName.trim())
    .map((fare) => ({
      name: fare.vehicleName.trim(),
      photos: [fare.vehicleImage ?? ''].filter(Boolean),
      capacity: fare.vehicleCapacity ?? 0,
      price: typeof fare.price === 'number' && fare.price > 0 ? fare.price : null,
    }));
  if (vehicles.length) return vehicles;
  const gallery = [...new Set([...(ride.images ?? []), ride.image ?? ''])].filter(Boolean);
  return [
    {
      name: 'Any available vehicle',
      photos: gallery,
      capacity: 0,
      price: typeof ride.minFare === 'number' && ride.minFare > 0 ? ride.minFare : null,
      isAnyVehicle: true,
    },
  ];
}

export function formatVehicleEnquiryLine(vehicle: Pick<EnquiryVehicle, 'name' | 'price' | 'capacity'>, index: number): string {
  const capacity = vehicleCapacityLabel(vehicle.capacity);
  const price = vehicle.price && vehicle.price > 0 ? `₹${vehicle.price.toLocaleString('en-IN')} per ride` : 'Price on request';
  return `${index + 1}. ${vehicle.name} — ${price}${capacity ? ` (${capacity})` : ''}`;
}

export function enquiryTotal(vehicles: Pick<EnquiryVehicle, 'price'>[]): number {
  return vehicles.reduce((sum, vehicle) => sum + (typeof vehicle.price === 'number' && vehicle.price > 0 ? vehicle.price : 0), 0);
}

export function rideEnquiryRouteLine(ride: Pick<EnquiryRide, 'fromLocation' | 'toLocation'>): string {
  return [ride.fromLocation, ride.toLocation].filter(Boolean).join(' → ') || 'As per the route details';
}

/** The prefilled WhatsApp template sent with the visitor's vehicle selection. */
export function buildRideEnquiryMessage(input: {
  rideTitle: string;
  route: string;
  url: string;
  vehicles: Pick<EnquiryVehicle, 'name' | 'price' | 'capacity'>[];
}): string {
  const count = input.vehicles.length;
  const total = enquiryTotal(input.vehicles);
  const totalLine = total > 0
    ? `💰 *Estimated total:* ₹${total.toLocaleString('en-IN')} for ${count} vehicle${count > 1 ? 's' : ''}`
    : '💰 *Estimated total:* Price on request';
  return [
    'Namaste KainchiDarshan! 🙏',
    '',
    'I found a ride on your website and would like to enquire:',
    '',
    `🚕 *Ride:* ${input.rideTitle}`,
    `📍 *Route:* ${input.route}`,
    `🔗 *Link:* ${input.url}`,
    '',
    `🚗 *Vehicle(s) selected:* ${count}`,
    ...input.vehicles.map((vehicle, index) => formatVehicleEnquiryLine(vehicle, index)),
    '',
    totalLine,
    '',
    'Please share availability, current photos and the best price for my dates. Dhanyavaad! 🙏',
  ].join('\n');
}

export function rideEnquiryWhatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
