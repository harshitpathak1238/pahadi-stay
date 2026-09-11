import { db } from '@/lib/db';
import { bhimtalPackage } from '@/app/(public)/packages/package-data';
import type { PublicResult } from '@/lib/listings';

export type PublicPackage = {
  id: string;
  title: string;
  description: string;
  price: number;
  listingIds: string[];
  image: string;
  location: string;
};

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

// Hardcoded seed package keeps local development usable without a database;
// production must never render fake, bookable packages — pages show a degraded banner.
function fallbackPackages(): PublicResult<PublicPackage[]> {
  if (process.env.NODE_ENV === 'production') return { data: [], degraded: true };
  return { data: [{ id: bhimtalPackage.slug, title: bhimtalPackage.title, description: bhimtalPackage.description, price: 24000, listingIds: [], image: bhimtalPackage.image, location: bhimtalPackage.eyebrow }], degraded: true };
}

export async function getPublicPackages(): Promise<PublicResult<PublicPackage[]>> {
  try {
    const records = await db.package.findMany({ orderBy: { createdAt: 'desc' } });
    if (records.length) {
      const ids = records.flatMap((record) => strings(record.listingIds));
      const listings = await db.listing.findMany({ where: { id: { in: ids }, status: 'LIVE' }, select: { id: true, location: true, images: true } });
      const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
      return {
        data: records.map((record) => {
          const listingIds = strings(record.listingIds);
          const firstListing = listingIds.map((id) => listingMap.get(id)).find(Boolean);
          return {
            id: record.id,
            title: record.title,
            description: record.description,
            price: Number(record.price),
            listingIds,
            image: strings(firstListing?.images)[0] || bhimtalPackage.image,
            location: firstListing?.location || 'Kumaon, Uttarakhand',
          };
        }),
        degraded: false,
      };
    }
    return fallbackPackages();
  } catch (error) {
    console.error('Public packages unavailable:', error);
    return fallbackPackages();
  }
}

export async function getPublicPackage(id: string): Promise<PublicResult<PublicPackage | null>> {
  const { data: packages, degraded } = await getPublicPackages();
  return { data: packages.find((item) => item.id === id) || null, degraded };
}