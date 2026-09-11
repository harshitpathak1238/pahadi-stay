import type { ListingCategory } from '@prisma/client';
import { db } from '@/lib/db';
import { rentals, stays, type Listing, type Rental } from '@/lib/mock-data';
import { defaultStayFacilities } from '@/lib/stay-facilities';

export type PublicResult<T> = { data: T; degraded: boolean };

function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function mapRecord(record: { slug: string; title: string; location: string; sellPrice: unknown; category: ListingCategory; images: unknown; amenities: unknown; details?: unknown }): Listing {
  const details = record.details && typeof record.details === 'object' ? record.details as Record<string, unknown> : {};
  const facilities = details.facilities && typeof details.facilities === 'object' ? Object.fromEntries(Object.entries(details.facilities).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean> : { ...defaultStayFacilities };
  return { slug: record.slug, title: record.title, location: record.location, price: Number(record.sellPrice), rating: 5, category: record.category === 'RENTAL' ? 'rental' : record.category === 'ACTIVITY' ? 'activity' : 'stay', image: strings(record.images)[0] || '/images/Logo.png', images: strings(record.images), description: '', amenities: strings(record.amenities), facilities };
}

const localRentals = (): Listing[] => rentals.map((rental) => ({ slug: rental.slug, title: rental.title, location: rental.pickup, price: rental.price, rating: 5, category: 'rental' as const, image: rental.image, description: rental.description, amenities: rental.features }));
// Mock data keeps local development usable without a database; production
// must never render fake, bookable listings — pages show a degraded banner.
const fallbackListings = (category: ListingCategory): PublicResult<Listing[]> => ({ data: process.env.NODE_ENV === 'production' ? [] : category === 'RENTAL' ? localRentals() : stays, degraded: true });

export async function getPublicListings(category: ListingCategory): Promise<PublicResult<Listing[]>> {
  try {
    const records = await db.listing.findMany({ where: { category, status: 'LIVE' }, orderBy: { createdAt: 'desc' } });
    if (records.length) return { data: records.map((record) => ({ ...mapRecord(record), description: record.description })), degraded: false };
    return fallbackListings(category);
  } catch {
    return fallbackListings(category);
  }
}

export async function getPublicListing(slug: string): Promise<PublicResult<Listing | null>> {
  try {
    const record = await db.listing.findFirst({ where: { slug, status: 'LIVE' } });
    if (record) return { data: { ...mapRecord(record), description: record.description }, degraded: false };
  } catch { /* fall through to the degraded fallback below */ }
  if (process.env.NODE_ENV === 'production') return { data: null, degraded: true };
  return { data: stays.find((stay) => stay.slug === slug) || null, degraded: true };
}

export async function getPublicRentals(): Promise<PublicResult<Rental[]>> {
  try {
    const records = await db.listing.findMany({ where: { category: 'RENTAL', status: 'LIVE' }, orderBy: { createdAt: 'desc' } });
    if (records.length) return { data: records.map((record) => ({ slug: record.slug, title: record.title, type: record.scootyQuantity > 0 ? 'Scooty rent' : 'Bike rent', price: Number(record.sellPrice), image: strings(record.images)[0] || '/images/Logo.png', description: record.description, features: strings(record.amenities), pickup: record.location, bikeQuantity: record.bikeQuantity, scootyQuantity: record.scootyQuantity })), degraded: false };
  } catch { /* fall through to the degraded fallback below */ }
  if (process.env.NODE_ENV === 'production') return { data: [], degraded: true };
  return { data: rentals, degraded: true };
}
