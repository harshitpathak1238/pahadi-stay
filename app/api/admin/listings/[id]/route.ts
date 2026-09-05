import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const updateStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).optional());
const optionalStringList = z.array(z.string().trim().max(500)).optional().transform((items) => items ? items.map((item) => item.trim()).filter(Boolean) : items);
const updateSchema = z.object({ slug: z.string().trim().max(160).optional(), category: z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).optional()), title: z.string().trim().min(1, 'Title is required.').max(120).optional(), description: z.string().optional(), location: z.string().trim().min(1, 'Location is required.').max(160).optional(), address: z.string().trim().min(1, 'Address is required.').max(500).optional(), basePrice: z.coerce.number().nonnegative().optional(), sellPrice: z.coerce.number().nonnegative().optional(), bikeQuantity: z.coerce.number().int().nonnegative().optional(), scootyQuantity: z.coerce.number().int().nonnegative().optional(), images: optionalStringList, amenities: optionalStringList, details: z.record(z.string(), z.unknown()).optional(), seoTitle: z.string().trim().max(160).optional(), seoDescription: z.string().trim().max(320).optional(), cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(), featured: z.coerce.boolean().optional(), partnerId: z.string().trim().min(1).optional(), status: updateStatus }).superRefine((value, context) => { if (value.basePrice !== undefined && value.sellPrice !== undefined && value.sellPrice < value.basePrice) context.addIssue({ code: z.ZodIssueCode.custom, path: ['sellPrice'], message: 'Selling price must be greater than or equal to base price.' }); });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.' }, { status: 400 });
  const { category, partnerId, details, ...fields } = parsed.data;
  const data = { ...fields, ...(details ? { details: details as Prisma.InputJsonValue } : {}), ...(category ? { category } : {}), ...(partnerId ? { partner: { connect: { id: partnerId } } } : {}) };
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
