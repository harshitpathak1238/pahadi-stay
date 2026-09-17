import type { StayPickup } from './pickup-pricing';
import { WHATSAPP_NUMBER } from './contact';

/**
 * WhatsApp bedroom enquiry for stay detail pages.
 *
 * The visitor opens "Enquire on WhatsApp", picks the bedrooms they want in the
 * popup, and a ready-made message (property, bedrooms, prices, amounts) is sent
 * to the KainchiDarshan WhatsApp number. Kept free of React so it stays
 * unit-testable in the node test environment.
 */

export type EnquiryBedroom = {
  title: string;
  description: string;
  photos: string[];
  /** Per-night price; null when the host has not set one ("price on request"). */
  price: number | null;
  bedrooms: number;
  beds: number;
  /** True for the synthetic "Entire property" card used when no rooms exist. */
  isEntireProperty?: boolean;
};

export type EnquiryStay = {
  title: string;
  location: string;
  slug: string;
  price: number;
  image?: string;
  images?: string[];
  accommodations?: { title: string; description: string; image: string; images?: string[]; price?: number | null; bedrooms: number; beds: number }[] | null;
};

export function roomMetaLabel(bedrooms: number, beds: number): string {
  return [
    bedrooms > 0 ? `${bedrooms} Bedroom${bedrooms > 1 ? 's' : ''}` : '',
    beds > 0 ? `${beds} Bed${beds > 1 ? 's' : ''}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Builds the selectable bedroom list; falls back to one "Entire property" card. */
export function enquiryBedroomsFromStay(stay: EnquiryStay): EnquiryBedroom[] {
  const rooms = (stay.accommodations ?? [])
    .filter((acc) => acc.title.trim())
    .map((acc) => ({
      title: acc.title.trim(),
      description: acc.description ?? '',
      photos: [...new Set([acc.image, ...(acc.images ?? [])])].filter(Boolean),
      price: typeof acc.price === 'number' && acc.price > 0 ? acc.price : null,
      bedrooms: acc.bedrooms ?? 0,
      beds: acc.beds ?? 0,
    }));
  if (rooms.length) return rooms;
  const gallery = [...new Set([...(stay.images ?? []), stay.image ?? ''])].filter(Boolean);
  return [
    {
      title: 'Entire property',
      description: '',
      photos: gallery,
      price: stay.price > 0 ? stay.price : null,
      bedrooms: 0,
      beds: 0,
      isEntireProperty: true,
    },
  ];
}

export function formatRoomEnquiryLine(room: Pick<EnquiryBedroom, 'title' | 'price' | 'bedrooms' | 'beds'>, index: number): string {
  const meta = roomMetaLabel(room.bedrooms, room.beds);
  const price = room.price && room.price > 0 ? `₹${room.price.toLocaleString('en-IN')} / night` : 'Price on request';
  return `${index + 1}. ${room.title} — ${price}${meta ? ` (${meta})` : ''}`;
}

export function enquiryTotalPerNight(bedrooms: Pick<EnquiryBedroom, 'price'>[]): number {
  return bedrooms.reduce((sum, room) => sum + (typeof room.price === 'number' && room.price > 0 ? room.price : 0), 0);
}

/** The prefilled WhatsApp template sent with the visitor's bedroom selection. */
export function buildStayEnquiryMessage(input: {
  propertyTitle: string;
  location: string;
  url: string;
  pickup?: StayPickup | null;
  bedrooms: Pick<EnquiryBedroom, 'title' | 'price' | 'bedrooms' | 'beds'>[];
}): string {
  const count = input.bedrooms.length;
  const total = enquiryTotalPerNight(input.bedrooms);
  const totalLine = total > 0
    ? `💰 *Estimated total:* ₹${total.toLocaleString('en-IN')} / night for ${count} bedroom${count > 1 ? 's' : ''}`
    : '💰 *Estimated total:* Price on request';
  return [
    'Namaste KainchiDarshan! 🙏',
    '',
    'I found a stay on your website and would like to enquire:',
    '',
    `🏡 *Property:* ${input.propertyTitle}`,
    `📍 *Location:* ${input.location}`,
    `🔗 *Link:* ${input.url}`,
    '',
    `🛏️ *Bedroom(s) selected:* ${count}`,
    ...input.bedrooms.map((room, index) => formatRoomEnquiryLine(room, index)),
    '',
    totalLine,
    ...(input.pickup ? [
      '',
      '🚕 *Arrival pickup:*',
      `📍 *From:* ${input.pickup.fromLocation}`,
      `📍 *To:* ${input.pickup.toLocation}`,
      `🗺️ *Transfer:* ${input.pickup.routeTitle}`,
      `🚗 *Car:* ${input.pickup.vehicleName}`,
      `💰 *Pickup fare:* ₹${input.pickup.price.toLocaleString('en-IN')} per transfer (separate from the nightly stay price)`,
      'Please confirm this route serves the property and confirm pickup availability.',
    ] : []),
    '',
    'Please share availability, current photos and the best price for my dates. Dhanyavaad! 🙏',
  ].join('\n');
}

export function stayEnquiryWhatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
