import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const updateStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).optional());
const optionalStringList = z.array(z.string().trim().max(500)).optional().transform((items) => items ? items.map((item) => item.trim()).filter(Boolean) : items);
const updateSchema = z.object({ slug: z.string().trim().max(160).optional(), category: z.string().trim().max(20).optional(), title: z.string().trim().max(120).optional(), description: z.string().trim().max(2000).optional(), location: z.string().trim().max(160).optional(), basePrice: z.coerce.number().nonnegative().optional(), sellPrice: z.coerce.number().nonnegative().optional(), bikeQuantity: z.coerce.number().int().nonnegative().optional(), scootyQuantity: z.coerce.number().int().nonnegative().optional(), images: optionalStringList, amenities: optionalStringList, status: updateStatus });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.' }, { status: 400 });
  const category = parsed.data.category ? parsed.data.category.toUpperCase() as 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' : undefined;
  const data = { ...parsed.data, ...(category ? { category } : {}) };
  const listing = await db.listing.update({ where: { id: params.id }, data });
  return NextResponse.json(listing);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const bookings = await db.booking.count({ where: { listingId: params.id, status: { not: 'CANCELLED' } } });
  if (bookings) return NextResponse.json({ error: 'Listings with active bookings cannot be deleted. Pause them instead.' }, { status: 409 });
  await db.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
