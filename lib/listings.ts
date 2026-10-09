import type { ListingCategory } from '@prisma/client';
import { db } from '@/lib/db';
import { cached, cacheDeletePrefix } from '@/lib/cache';
import { rentals, stays, type Listing, type Rental } from '@/lib/mock-data';
import { defaultStayFacilities } from '@/lib/stay-facilities';
import { strings, faqs, parseHouseRules, toListingRating, type PublicResult, type ListingRating } from '@/lib/listings-shared';
import { getPricingMode, resolveCompareAtPrice, resolveDisplayPrice, type PricingMode } from '@/lib/pricing';

// Pure types/constants/parsers live in '@/lib/listings-shared' so client
// components can use them without pulling Prisma or the cache into the browser.
export * from '@/lib/listings-shared';

/**
 * Structural view of a `Listing` row, so the mapper accepts both a Prisma
 * `findMany` result and a narrower `select` without a cast at every call site.
 */
type ListingRecordLike = {
  id: string;
  slug: string;
  title: string;
  location: string;
  sellPrice: unknown;
  basePrice?: unknown;
  seasonPrice?: unknown;
  offSeasonPrice?: unknown;
  category: ListingCategory;
  images: unknown;
  amenities: unknown;
  details?: unknown;
  faqs?: unknown;
  houseRules?: unknown;
  accommodations?: unknown;
  fullyBooked?: unknown;
};

// Review-derived rating attached to a listing. `rating` is the rounded average
// of approved reviews (1–5); `count` lets the cards hide the badge entirely
// when a stay has not been reviewed yet, instead of faking a 5.0.
function mapRecord(record: ListingRecordLike, pricing?: PricingMode, review?: ListingRating): Listing {
  const details = record.details && typeof record.details === 'object' ? record.details as Record<string, unknown> : {};
  const facilities = details.facilities && typeof details.facilities === 'object' ? Object.fromEntries(Object.entries(details.facilities).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean> : { ...defaultStayFacilities };
  const recordFaqs = record.faqs;
  const recordHouseRules = record.houseRules;
  const recordAccommodations = record.accommodations;
  // Seasonal switch: `price` is what the guest is quoted right now, resolved
  // from the peak/low pair whenever the admin has set them.
  const seasonal = { price: record.sellPrice, seasonPrice: record.seasonPrice, offSeasonPrice: record.offSeasonPrice };
  // `pricing` is omitted on the degraded/mock paths, where there is no switch.
  const price = pricing ? resolveDisplayPrice(seasonal, pricing, record.category) : Number(record.sellPrice) || 0;
  // The struck-through MRP stays `basePrice`: it is an editorial figure and must
  // not be swapped for a seasonal rate, or existing discount badges would change
  // number. In peak mode the peak rate becomes the compare-at value instead,
  // and only when it genuinely sits above the quoted rate.
  const base = Number(record.basePrice);
  const compareAt = pricing ? resolveCompareAtPrice(seasonal, pricing, record.category) : null;
  return { slug: record.slug, title: record.title, location: record.location, price, ...((Number.isFinite(base) && base > 0 && base > price) ? { basePrice: base } : {}), ...(compareAt !== null && compareAt > price ? { peakCompareAtPrice: compareAt } : {}), ...(Number(details.maxGuests) > 0 ? { maxGuests: Math.trunc(Number(details.maxGuests)) } : {}), fullyBooked: Boolean(record.fullyBooked), rating: review ? review.rating : 0, ...(review ? { reviewCount: review.count } : {}), category: record.category === 'RENTAL' ? 'rental' : record.category === 'ACTIVITY' ? 'activity' : 'stay', image: strings(record.images)[0] || '/images/Logo.png', images: strings(record.images), description: '', amenities: strings(record.amenities), facilities, faqs: faqs(recordFaqs), houseRules: parseHouseRules(recordHouseRules), mapPin: typeof details.mapPin === 'string' ? details.mapPin : '', ...(typeof details.propertyType === 'string' && details.propertyType.trim() ? { propertyType: details.propertyType.trim() } : {}), accommodations: parseAccommodations(recordAccommodations) };
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

// Real, approved-review average per listing. A single grouped query for the
// whole page keeps this at one round-trip regardless of catalogue size.
// Listings with no approved reviews are simply absent from the map, so their
// cards fall back to "New" instead of a fabricated 5.0. Never throws — a DB
// hiccup degrades to "New" everywhere rather than failing the page.
async function reviewAverages(listingIds: string[]): Promise<Map<string, ListingRating>> {
  const map = new Map<string, ListingRating>();
  if (!listingIds.length) return map;
  try {
    const grouped = await db.review.groupBy({
      by: ['listingId'],
      where: { listingId: { in: listingIds }, status: 'APPROVED' },
      _avg: { overallRating: true },
      _count: { _all: true },
    });
    for (const row of grouped) {
      const rating = toListingRating(row._avg.overallRating, row._count._all);
      if (rating) map.set(row.listingId, rating);
    }
  } catch (error) {
    console.error('Review averages unavailable:', error);
  }
  return map;
}

export async function getPublicListings(category: ListingCategory): Promise<PublicResult<Listing[]>> {
  return cached(`listings:${category}`, 60, async () => {
    try {
      const records = await db.listing.findMany({ where: { category, status: 'LIVE' }, select: { id: true, slug: true, title: true, location: true, sellPrice: true, basePrice: true, seasonPrice: true, offSeasonPrice: true, category: true, images: true, amenities: true, details: true, accommodations: true, fullyBooked: true, description: true }, orderBy: { createdAt: 'desc' } });
      if (records.length) {
        // One switch read + one grouped review average for the whole page.
        const [pricing, ratings] = await Promise.all([getPricingMode(), reviewAverages(records.map((record) => record.id))]);
        return { data: records.map((record) => ({ ...mapRecord(record, pricing, ratings.get(record.id)), description: record.description })), degraded: false };
      }
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
      const record = await db.listing.findFirst({ where: { slug, status: 'LIVE' }, select: { id: true, slug: true, title: true, location: true, sellPrice: true, basePrice: true, seasonPrice: true, offSeasonPrice: true, category: true, images: true, amenities: true, details: true, accommodations: true, fullyBooked: true, description: true, faqs: { orderBy: { order: 'asc' }, select: { question: true, answer: true } } }, });
      if (record) { const [pricing, ratings] = await Promise.all([getPricingMode(), reviewAverages([record.id])]); return { data: { ...mapRecord(record, pricing, ratings.get(record.id)), description: record.description }, degraded: false }; }
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
      // Explicit select: the mapper needs the seasonal pair, and `description`
      // is read straight from the row below.
      const records = await db.listing.findMany({ where: { category: 'RENTAL', status: 'LIVE' }, select: { slug: true, title: true, description: true, images: true, amenities: true, location: true, category: true, sellPrice: true, seasonPrice: true, offSeasonPrice: true, bikeQuantity: true, scootyQuantity: true }, orderBy: { createdAt: 'desc' } });
      if (records.length) {
        // Rentals are quoted per day, so they follow the same seasonal switch as
        // stays — otherwise a peak-season site would still advertise cheap bikes.
        const pricing = await getPricingMode();
        return { data: records.map((record) => ({ slug: record.slug, title: record.title, type: (record.scootyQuantity > 0 || /scooty|scooter/i.test(record.title)) ? 'Scooty rent' : 'Bike rent', price: resolveDisplayPrice({ price: record.sellPrice, seasonPrice: record.seasonPrice, offSeasonPrice: record.offSeasonPrice }, pricing, 'RENTAL'), image: strings(record.images)[0] || '/images/Logo.png', description: record.description, features: strings(record.amenities), pickup: record.location, bikeQuantity: record.bikeQuantity, scootyQuantity: record.scootyQuantity })), degraded: false };
      }
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
  // Ride routes carry their own fare matrix with the same seasonal pair, so a
  // listing write can still change a price a guest sees on /rides.
  await cacheDeletePrefix('rides:');
  void category;
}
