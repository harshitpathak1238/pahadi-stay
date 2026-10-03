import type { ListingCategory } from '@prisma/client';
import { db } from '@/lib/db';
import { cached, cacheDeletePrefix } from '@/lib/cache';
import { rentals, stays, type Listing, type Rental } from '@/lib/mock-data';
import { defaultStayFacilities } from '@/lib/stay-facilities';
import { strings, faqs, parseHouseRules, type PublicResult } from '@/lib/listings-shared';

// Pure types/constants/parsers live in '@/lib/listings-shared' so client
// components can use them without pulling Prisma or the cache into the browser.
export * from '@/lib/listings-shared';

function mapRecord(record: { slug: string; title: string; location: string; sellPrice: unknown; basePrice?: unknown; category: ListingCategory; images: unknown; amenities: unknown; details?: unknown; faqs?: unknown; houseRules?: unknown; accommodations?: unknown; fullyBooked?: unknown }): Listing {
  const details = record.details && typeof record.details === 'object' ? record.details as Record<string, unknown> : {};
  const facilities = details.facilities && typeof details.facilities === 'object' ? Object.fromEntries(Object.entries(details.facilities).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean> : { ...defaultStayFacilities };
  const recordFaqs = (record as { faqs?: unknown }).faqs;
  const recordHouseRules = (record as { houseRules?: unknown }).houseRules;
  const recordAccommodations = (record as { accommodations?: unknown }).accommodations;
  const price = Number(record.sellPrice);
  const base = Number(record.basePrice);
  return { slug: record.slug, title: record.title, location: record.location, price, ...((Number.isFinite(base) && base > 0 && base > price) ? { basePrice: base } : {}), ...(Number(details.maxGuests) > 0 ? { maxGuests: Math.trunc(Number(details.maxGuests)) } : {}), fullyBooked: Boolean(record.fullyBooked), rating: 5, category: record.category === 'RENTAL' ? 'rental' : record.category === 'ACTIVITY' ? 'activity' : 'stay', image: strings(record.images)[0] || '/images/Logo.png', images: strings(record.images), description: '', amenities: strings(record.amenities), facilities, faqs: faqs(recordFaqs), houseRules: parseHouseRules(recordHouseRules), mapPin: typeof details.mapPin === 'string' ? details.mapPin : '', accommodations: parseAccommodations(recordAccommodations) };
}

function parseAccommodations(value: unknown): Accommodation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const cover = String(item.image ?? '').trim();
      const extras = strings(item.images).filter((url) => url !== cover);
      return {
        title: String(item.title ?? ''),
        description: String(item.description ?? ''),
        image: cover,
        images: cover ? [cover, ...extras] : extras,
        price: Number.isFinite(Number(item.price)) && Number(item.price) > 0 ? Number(item.price) : 0,
        bedrooms: Number(item.bedrooms ?? 0),
        beds: Number(item.beds ?? 0),
      };
    })
    .filter((item) => item.title.trim());
}

type Accommodation = { title: string; description: string; image: string; images: string[]; price: number; bedrooms: number; beds: number };

const localRentals = (): Listing[] => rentals.map((rental) => ({ slug: rental.slug, title: rental.title, location: rental.pickup, price: rental.price, rating: 5, category: 'rental' as const, image: rental.image, description: rental.description, amenities: rental.features }));
// Mock data keeps local development usable without a database; production
// must never render fake, bookable listings — pages show a degraded banner.
const fallbackListings = (category: ListingCategory): PublicResult<Listing[]> => ({ data: process.env.NODE_ENV === 'production' ? [] : category === 'RENTAL' ? localRentals() : stays, degraded: true });

export async function getPublicListings(category: ListingCategory): Promise<PublicResult<Listing[]>> {
  return cached(`listings:${category}`, 60, async () => {
    try {
      const records = await db.listing.findMany({ where: { category, status: 'LIVE' }, select: { slug: true, title: true, location: true, sellPrice: true, basePrice: true, category: true, images: true, amenities: true, details: true, accommodations: true, fullyBooked: true, description: true }, orderBy: { createdAt: 'desc' } });
      if (records.length) return { data: records.map((record) => ({ ...mapRecord(record as { slug: string; title: string; location: string; sellPrice: unknown; basePrice?: unknown; category: ListingCategory; images: unknown; amenities: unknown; details?: unknown; accommodations?: unknown; fullyBooked?: unknown }), description: record.description })), degraded: false };
      return fallbackListings(category);
    } catch (error) {
      console.error(`Public listings (${category}) unavailable:`, error);
      return fallbackListings(category);
    }
  });
}

export async function getPublicListing(slug: string): Promise<PublicResult<Listing | null>> {
  // Cached for 120s. This is the per-stay detail query, and without a cache
  // every stay page hit the database on every request. The key reuses the
  // `listings:` prefix so the existing admin-side
  // `cacheDeletePrefix('listings:')` invalidates it with no extra wiring.
  return cached(`listing:${slug}`, 120, async () => {
    try {
      const record = await db.listing.findFirst({ where: { slug, status: 'LIVE' }, select: { slug: true, title: true, location: true, sellPrice: true, basePrice: true, category: true, images: true, amenities: true, details: true, accommodations: true, fullyBooked: true, description: true, faqs: { orderBy: { order: 'asc' }, select: { question: true, answer: true } } }, });
      if (record) return { data: { ...mapRecord(record as { slug: string; title: string; location: string; sellPrice: unknown; basePrice?: unknown; category: ListingCategory; images: unknown; amenities: unknown; details?: unknown; accommodations?: unknown; fullyBooked?: unknown }), description: record.description }, degraded: false };
    } catch (error) {
      console.error(`Public listing (${slug}) unavailable:`, error);
    }
    if (process.env.NODE_ENV === 'production') return { data: null, degraded: true };
    return { data: stays.find((stay) => stay.slug === slug) || null, degraded: true };
  });
}

export async function getPublicRentals(): Promise<PublicResult<Rental[]>> {
  return cached('listings:RENTAL', 60, async () => {
    try {
      const records = await db.listing.findMany({ where: { category: 'RENTAL', status: 'LIVE' }, orderBy: { createdAt: 'desc' } });
      if (records.length) return { data: records.map((record) => ({ slug: record.slug, title: record.title, type: record.scootyQuantity > 0 ? 'Scooty rent' : 'Bike rent', price: Number(record.sellPrice), image: strings(record.images)[0] || '/images/Logo.png', description: record.description, features: strings(record.amenities), pickup: record.location, bikeQuantity: record.bikeQuantity, scootyQuantity: record.scootyQuantity })), degraded: false };
    } catch { /* fall through to the degraded fallback below */ }
    if (process.env.NODE_ENV === 'production') return { data: [], degraded: true };
    return { data: rentals, degraded: true };
  });
}

/**
 * Purge cached catalogue reads after an admin write so editors see their
 * changes immediately instead of waiting out the TTL. Package pages embed
 * listing images, titles and prices, so those are refreshed too.
 */
export async function invalidateCatalogueCache(category?: ListingCategory) {
  await cacheDeletePrefix('listings:');
  // Bundled items are rendered inside package pages.
  await cacheDeletePrefix('packages:');
  void category;
}
