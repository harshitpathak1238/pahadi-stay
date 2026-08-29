import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminPartner, requireAdmin } from '@/lib/admin';

const listingSchema = z.object({ slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/), category: z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']), title: z.string().trim().min(2).max(120), description: z.string().trim().min(10), location: z.string().trim().min(2), basePrice: z.coerce.number().nonnegative(), sellPrice: z.coerce.number().nonnegative(), bikeQuantity: z.coerce.number().int().nonnegative().default(0), scootyQuantity: z.coerce.number().int().nonnegative().default(0), images: z.array(z.string().url()).default([]), amenities: z.array(z.string().trim().min(1)).default([]), status: z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).default('DRAFT') });

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const category = params.get('category');
  const search = params.get('search')?.trim();
  const status = params.get('status');
  const sort = params.get('sort') || 'newest';
  const listings = await db.listing.findMany({ where: { ...(category ? { category: category as 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' } : {}), ...(status ? { status: status as 'DRAFT' | 'LIVE' | 'PAUSED' | 'PENDING_REVIEW' } : {}), ...(search ? { OR: [{ title: { contains: search } }, { location: { contains: search } }, { partner: { businessName: { contains: search } } }] } : {}) }, include: { partner: { select: { businessName: true } }, _count: { select: { bookings: true } } }, orderBy: sort === 'price' ? { sellPrice: 'desc' } : sort === 'alphabetical' ? { title: 'asc' } : { createdAt: 'desc' } });
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
