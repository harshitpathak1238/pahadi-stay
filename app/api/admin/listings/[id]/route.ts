import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const updateSchema = z.object({ slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/).optional(), category: z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).optional(), title: z.string().trim().min(2).max(120).optional(), description: z.string().trim().min(10).optional(), location: z.string().trim().min(2).optional(), basePrice: z.coerce.number().nonnegative().optional(), sellPrice: z.coerce.number().nonnegative().optional(), images: z.array(z.string().url()).optional(), amenities: z.array(z.string().trim().min(1)).optional(), status: z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.' }, { status: 400 });
  const listing = await db.listing.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(listing);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const bookings = await db.booking.count({ where: { listingId: params.id, status: { not: 'CANCELLED' } } });
  if (bookings) return NextResponse.json({ error: 'Listings with active bookings cannot be deleted. Pause them instead.' }, { status: 409 });
  await db.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
