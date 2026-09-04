import { db } from '@/lib/db';
import { bhimtalPackage } from '@/app/(public)/packages/package-data';

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

export async function getPublicPackages(): Promise<PublicPackage[]> {
  try {
    const records = await db.package.findMany({ orderBy: { createdAt: 'desc' } });
    if (records.length) {
      const ids = records.flatMap((record) => strings(record.listingIds));
      const listings = await db.listing.findMany({ where: { id: { in: ids }, status: 'LIVE' }, select: { id: true, location: true, images: true } });
      const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
      return records.map((record) => {
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
      });
    }
  } catch (error) {
    console.error('Public packages unavailable:', error);
  }

  return [{ id: bhimtalPackage.slug, title: bhimtalPackage.title, description: bhimtalPackage.description, price: 24000, listingIds: [], image: bhimtalPackage.image, location: bhimtalPackage.eyebrow }];
}

export async function getPublicPackage(id: string) {
  const packages = await getPublicPackages();
  return packages.find((item) => item.id === id) || null;
}