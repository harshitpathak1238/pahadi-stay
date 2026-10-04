import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { invalidateCatalogueCache } from '@/lib/listings';
import { invalidatePricingCache } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * Price fields are optional: a blank box means "no seasonal rate", which stores
 * NULL and makes the resolver fall back to the base price.
 */
const optionalPrice = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : value),
  z.coerce.number().nonnegative().max(10000000).nullable(),
);

const listingRow = z.object({
  id: z.string().trim().min(1),
  seasonPrice: optionalPrice,
  offSeasonPrice: optionalPrice,
});

const fareRow = z.object({
  // Ride fares are addressed by their composite key, which is what the admin
  // grid has on hand from the route payload.
  rideRouteId: z.string().trim().min(1),
  vehicleTypeId: z.string().trim().min(1),
  seasonPrice: optionalPrice,
  offSeasonPrice: optionalPrice,
});

const bulkSchema = z.object({
  listings: z.array(listingRow).max(500).optional(),
  fares: z.array(fareRow).max(500).optional(),
});

/** Revalidate every page that renders a price, not just the catalogue indexes. */
function revalidatePublicPrices() {
  for (const path of ['/', '/stays', '/rentals', '/rides', '/activities']) {
    try {
      revalidatePath(path);
    } catch {
      /* revalidation is best-effort outside a request lifecycle */
    }
  }
}

/**
 * PATCH /api/admin/pricing -> bulk-write seasonal prices.
 *
 * Deliberately separate from the listing writer: the pricing grid edits dozens
 * of rows at once and only ever touches two columns, so a bulk endpoint avoids
 * re-sending (and re-validating) every unrelated listing field per row.
 */
export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = bulkSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the seasonal prices and try again.', details: parsed.error.flatten() }, { status: 400 });

  const listingRows = parsed.data.listings ?? [];
  const fareRows = parsed.data.fares ?? [];
  if (!listingRows.length && !fareRows.length) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    // A sequential `await tx.update()` per row cost one network round-trip each,
    // so editing a few dozen rows blew past Prisma's 5s interactive-transaction
    // default and the whole save failed with "Transaction already closed".
    //
    // The array form runs the same statements in a single transaction but
    // without the interactive wall-clock limit, so the save is bounded by the
    // work itself rather than by how long the round-trips take. The client now
    // only sends rows whose price actually changed, which keeps the list short.
    await db.$transaction([
      ...listingRows.map((row) => db.listing.update({
        where: { id: row.id },
        data: {
          ...(row.seasonPrice !== undefined ? { seasonPrice: row.seasonPrice as Prisma.Decimal | null } : {}),
          ...(row.offSeasonPrice !== undefined ? { offSeasonPrice: row.offSeasonPrice as Prisma.Decimal | null } : {}),
        },
      })),
      ...fareRows.map((row) => db.rideFare.update({
        where: { rideRouteId_vehicleTypeId: { rideRouteId: row.rideRouteId, vehicleTypeId: row.vehicleTypeId } },
        data: {
          ...(row.seasonPrice !== undefined ? { seasonPrice: row.seasonPrice } : {}),
          ...(row.offSeasonPrice !== undefined ? { offSeasonPrice: row.offSeasonPrice } : {}),
        },
      })),
    ]);
  } catch (error) {
    const code = typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'One of those prices belongs to a record that no longer exists. Reload and try again.' }, { status: 400 });
    }
    // A rolled-back transaction is retryable, and saying so is far more useful
    // to the admin than the raw driver message.
    if (code === 'P2028' || (error instanceof Error && /transaction/i.test(error.message))) {
      return NextResponse.json({ error: 'The price update took too long and was rolled back, so nothing changed. Try saving a smaller selection.' }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Could not save the seasonal prices.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // A price change is exactly as visible as a switch change, so purge both the
  // catalogue reads and the cached switch, then revalidate the public pages.
  await Promise.all([invalidateCatalogueCache(), invalidatePricingCache()]);
  revalidatePublicPrices();

  return NextResponse.json({ updatedListings: listingRows.length, updatedFares: fareRows.length });
}