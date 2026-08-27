import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminPartner, requireAdmin } from '@/lib/admin';

const listingSchema = z.object({ slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/), category: z.enum(['STAY', 'RIDE', 'RENTAL']), title: z.string().trim().min(2).max(120), description: z.string().trim().min(10), location: z.string().trim().min(2), basePrice: z.coerce.number().nonnegative(), sellPrice: z.coerce.number().nonnegative(), images: z.array(z.string().url()).default([]), amenities: z.array(z.string().trim().min(1)).default([]), status: z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).default('DRAFT') });

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const category = new URL(request.url).searchParams.get('category');
  const listings = await db.listing.findMany({ where: category ? { category: category as 'STAY' | 'RIDE' | 'RENTAL' } : undefined, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = listingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  try {
    const partner = await getAdminPartner();
    const listing = await db.listing.create({ data: { ...parsed.data, partnerId: partner.id, basePrice: parsed.data.basePrice, sellPrice: parsed.data.sellPrice } });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create listing.' }, { status: 500 }); }
}
