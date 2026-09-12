import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { isFullBlogDocument, sanitizeBlogHtml } from '@/lib/sanitize-html';

const updateStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).optional());
const optionalStringList = z.array(z.string().trim().max(500)).optional().transform((items) => items ? items.map((item) => item.trim()).filter(Boolean) : items);
const updateSchema = z.object({ slug: z.string().trim().max(160).optional(), category: z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).optional()), title: z.string().trim().max(120).optional(), description: z.string().optional(), location: z.string().trim().max(160).optional(), basePrice: z.coerce.number().nonnegative().optional(), sellPrice: z.coerce.number().nonnegative().optional(), images: optionalStringList, amenities: optionalStringList, details: z.record(z.string(), z.unknown()).optional(), partnerId: z.string().trim().optional(), status: updateStatus }).superRefine((value, context) => { if (value.basePrice !== undefined && value.sellPrice !== undefined && value.sellPrice < value.basePrice) context.addIssue({ code: z.ZodIssueCode.custom, path: ['sellPrice'], message: 'Selling price must be greater than or equal to base price.' }); });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.' }, { status: 400 });
  const existing = await db.listing.findUnique({ where: { id: params.id }, select: { category: true, title: true, description: true, basePrice: true, sellPrice: true, images: true, location: true } });
  if (!existing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  const { category, partnerId, details, ...fields } = parsed.data;
  const data = { ...fields, ...(fields.description !== undefined ? { description: isFullBlogDocument(fields.description) ? fields.description : sanitizeBlogHtml(fields.description) } : {}), ...(details ? { details: details as Prisma.InputJsonObject } : {}), ...(category ? { category } : {}), ...(partnerId ? { partner: { connect: { id: partnerId } } } : {}) };
  const listing = await db.listing.update({ where: { id: params.id }, data });
  try {
    revalidatePath(`/stays/${listing.slug}`);
    revalidatePath('/stays');
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
  return NextResponse.json(listing);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const bookings = await db.booking.count({ where: { listingId: params.id, status: { not: 'CANCELLED' } } });
  if (bookings) return NextResponse.json({ error: 'Listings with active bookings cannot be deleted. Pause them instead.' }, { status: 409 });
  await db.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
