import { db } from '@/lib/db';
import { cached } from '@/lib/cache';
import { bhimtalPackage } from '@/app/(public)/packages/package-data';
import { strings } from '@/lib/listings-shared';
import { inclusionKind as listingInclusionKind, parseItinerary, type ItineraryStop } from '@/lib/package-inclusions-shared';
import type { PublicResult } from '@/lib/listings';

/** A single bundled item shown on a package page. */
export type PackageInclusion = {
  id: string;
  slug: string;
  title: string;
  /** STAY | RIDE | RENTAL | ACTIVITY */
  category: string;
  location: string;
  image: string;
  price: number;
  /** Where "View" should send the guest; null when no detail page exists. */
  href: string | null;
};

export type PublicPackage = {
  id: string;
  title: string;
  description: string;
  price: number;
  listingIds: string[];
  image: string;
  location: string;
  inclusions: PackageInclusion[];
  /** Day-by-day stops an admin added in the package editor. */
  itinerary: ItineraryStop[];
};

/**
 * Only stays and rides have public detail pages today. Rentals and activities
 * render as non-clickable cards rather than linking to a route that 404s.
 */
function inclusionHref(category: string, slug: string): string | null {
  if (category === 'STAY') return `/stays/${slug}`;
  if (category === 'RIDE') return `/rides/${slug}`;
  return null;
}

export const inclusionKind = listingInclusionKind;

// Hardcoded seed package keeps local development usable without a database;
// production must never render fake, bookable packages — pages show a degraded banner.
function fallbackPackages(): PublicResult<PublicPackage[]> {
  if (process.env.NODE_ENV === 'production') return { data: [], degraded: true };
  return { data: [{ id: bhimtalPackage.slug, title: bhimtalPackage.title, description: bhimtalPackage.description, price: 24000, listingIds: [], image: bhimtalPackage.image, location: bhimtalPackage.eyebrow, inclusions: [], itinerary: [] }], degraded: true };
}

export async function getPublicPackages(): Promise<PublicResult<PublicPackage[]>> {
  return cached('packages:all', 120, async () => {
    try {
      const records = await db.package.findMany({ orderBy: { createdAt: 'desc' } });
      if (records.length) {
        const ids = records.flatMap((record) => strings(record.listingIds));
        const listings = await db.listing.findMany({ where: { id: { in: ids }, status: 'LIVE' }, select: { id: true, slug: true, title: true, category: true, location: true, images: true, sellPrice: true } });
        const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
        return {
          data: records.map((record) => {
            const listingIds = strings(record.listingIds);
            const bundled = listingIds.map((id) => listingMap.get(id)).filter(Boolean) as typeof listings;
            const firstListing = bundled[0];
            // Preserve the admin's selection order; drop anything unpublished.
            const inclusions: PackageInclusion[] = bundled.map((listing) => ({
              id: listing.id,
              slug: listing.slug,
              title: listing.title,
              category: listing.category,
              location: listing.location,
              image: strings(listing.images)[0] || bhimtalPackage.image,
              price: Number(listing.sellPrice ?? 0),
              href: inclusionHref(listing.category, listing.slug),
            }));
            return {
              id: record.id,
              title: record.title,
              description: record.description,
              price: Number(record.price),
              listingIds,
              image: strings(firstListing?.images)[0] || bhimtalPackage.image,
              location: firstListing?.location || 'Kumaon, Uttarakhand',
              inclusions,
              itinerary: parseItinerary((record.details as Record<string, unknown> | null)?.itinerary),
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
  });
}

export async function getPublicPackage(id: string): Promise<PublicResult<PublicPackage | null>> {
  const { data: packages, degraded } = await getPublicPackages();
  return { data: packages.find((item) => item.id === id) || null, degraded };
}