import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAdminPartner, requireAdmin } from '@/lib/admin';

const listingStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).default('DRAFT'));
const optionalStringList = z.array(z.string().trim().max(500)).default([]).transform((items) => items.map((item) => item.trim()).filter(Boolean));
const listingSchema = z.object({ slug: z.string().trim().max(160).default(''), category: z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).default('STAY')), title: z.string().trim().min(1, 'Title is required.').max(120), description: z.string().max(20000).default(''), location: z.string().trim().min(1, 'Location is required.').max(160), address: z.string().trim().min(1, 'Address is required.').max(500), basePrice: z.coerce.number().nonnegative(), sellPrice: z.coerce.number().nonnegative(), bikeQuantity: z.coerce.number().int().nonnegative().default(0), scootyQuantity: z.coerce.number().int().nonnegative().default(0), images: optionalStringList, amenities: optionalStringList, details: z.record(z.string(), z.unknown()).default({}), seoTitle: z.string().trim().max(160).default(''), seoDescription: z.string().trim().max(320).default(''), cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).default('FLEXIBLE'), featured: z.coerce.boolean().default(false), partnerId: z.string().trim().min(1, 'Partner is required.'), status: listingStatus }).superRefine((value, context) => { if (value.sellPrice < value.basePrice) context.addIssue({ code: z.ZodIssueCode.custom, path: ['sellPrice'], message: 'Selling price must be greater than or equal to base price.' }); });

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
    const partner = await db.partner.findUnique({ where: { id: parsed.data.partnerId } });
    if (!partner) return NextResponse.json({ error: 'Selected partner was not found.', details: { fieldErrors: { partnerId: ['Partner is required.'] } } }, { status: 400 });
    const title = parsed.data.title || 'Untitled listing';
    const slug = parsed.data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `listing-${Date.now()}`;
    const { partnerId, ...data } = parsed.data;
    const listing = await db.listing.create({ data: { ...data, details: data.details as Prisma.InputJsonValue, slug, title, partnerId, category: parsed.data.category } });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create listing.' }, { status: 500 }); }
}
