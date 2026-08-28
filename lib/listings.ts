import type { ListingCategory } from '@prisma/client';
import { db } from '@/lib/db';
import { rentals, stays, type Listing, type Rental } from '@/lib/mock-data';

function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function mapRecord(record: { slug: string; title: string; location: string; sellPrice: unknown; category: ListingCategory; images: unknown; amenities: unknown }): Listing {
  return { slug: record.slug, title: record.title, location: record.location, price: Number(record.sellPrice), rating: 5, category: record.category === 'RENTAL' ? 'rental' : record.category === 'ACTIVITY' ? 'activity' : 'stay', image: strings(record.images)[0] || '/images/Logo.png', description: '', amenities: strings(record.amenities) };
}

export async function getPublicListings(category: ListingCategory): Promise<Listing[]> {
  try {
    const records = await db.listing.findMany({ where: { category, status: 'LIVE' }, orderBy: { createdAt: 'desc' } });
    if (records.length) return records.map((record) => ({ ...mapRecord(record), description: record.description }));
  } catch { /* Keep public pages available while the database is unavailable. */ }
  return category === 'RENTAL' ? rentals.map((rental) => ({ slug: rental.slug, title: rental.title, location: rental.pickup, price: rental.price, rating: 5, category: 'rental' as const, image: rental.image, description: rental.description, amenities: rental.features })) : stays;
}

export async function getPublicListing(slug: string): Promise<Listing | null> {
  try {
    const record = await db.listing.findFirst({ where: { slug, status: 'LIVE' } });
    if (record) return { ...mapRecord(record), description: record.description };
  } catch { /* Use static content until the database is ready. */ }
  return stays.find((stay) => stay.slug === slug) || null;
}

export async function getPublicRentals(): Promise<Rental[]> {
  return (await getPublicListings('RENTAL')).map((record) => ({ slug: record.slug, title: record.title, type: 'Local rental', price: record.price, image: record.image, description: record.description, features: record.amenities, pickup: record.location }));
}
