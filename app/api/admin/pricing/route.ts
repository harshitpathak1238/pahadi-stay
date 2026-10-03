import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { getPricingMode, savePricingMode } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const categorySchema = z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']);

const modeSchema = z.object({
  peakModeEnabled: z.boolean(),
  activeCategories: z.array(categorySchema).max(4).default([]),
  label: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
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

// GET /api/admin/pricing -> the global switch plus a per-category coverage count,
// so the admin screen can tell "no season prices set yet" from "switch is off".
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const mode = await getPricingMode();
  const [listings, fares] = await Promise.all([
    db.listing.groupBy({ by: ['category'], _count: { _all: true } }),
    db.rideFare.count(),
  ]);
  return NextResponse.json({
    mode,
    coverage: listings.map((row) => ({
      category: row.category,
      listings: row._count._all,
      // Rides are priced through RideFare rows, not Listing rows.
      fares: row.category === 'RIDE' ? fares : 0,
    })),
  });
}

// PUT /api/admin/pricing -> flip the global switch / narrow it to categories.
export async function PUT(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = modeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the pricing switch settings.', details: parsed.error.flatten() }, { status: 400 });
  try {
    const session = await requireAdmin();
    const mode = await savePricingMode({ ...parsed.data, updatedBy: session?.user?.email ?? null });
    revalidatePublicPrices();
    return NextResponse.json({ mode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the pricing switch.' }, { status: 500 });
  }
}