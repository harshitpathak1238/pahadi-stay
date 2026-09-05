import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminPartner, requireAdmin } from '@/lib/admin';

const listingStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).default('DRAFT'));
const optionalStringList = z.array(z.string().trim().max(500)).default([]).transform((items) => items.map((item) => item.trim()).filter(Boolean));
const listingSchema = z.object({ slug: z.string().trim().max(160).default(''), category: z.string().trim().max(20).default('STAY'), title: z.string().trim().max(120).default('Untitled listing'), description: z.string().trim().default(''), location: z.string().trim().max(160).default(''), basePrice: z.coerce.number().nonnegative().default(0), sellPrice: z.coerce.number().nonnegative().default(0), bikeQuantity: z.coerce.number().int().nonnegative().default(0), scootyQuantity: z.coerce.number().int().nonnegative().default(0), images: optionalStringList, amenities: optionalStringList, status: listingStatus });

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
    const title = parsed.data.title || 'Untitled listing';
    const slug = parsed.data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `listing-${Date.now()}`;
    const listing = await db.listing.create({ data: { ...parsed.data, slug, title, partnerId: partner.id, basePrice: parsed.data.basePrice, sellPrice: parsed.data.sellPrice, category: (parsed.data.category || 'STAY') as 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' } });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create listing.' }, { status: 500 }); }
}
