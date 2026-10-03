import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { cacheDeletePrefix } from '@/lib/cache';
import { packageLiveRequirements } from '@/lib/listing-requirements';
import { MAX_ITINERARY_STOPS, serializeItinerary } from '@/lib/package-inclusions-shared';

const itineraryStopSchema = z.object({ label: z.string().trim().max(120).default(''), note: z.string().trim().max(300).optional().default('') });

const packageSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().optional(),
  listingIds: z.array(z.string()).optional(),
  price: z.coerce.number().nonnegative().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  itinerary: z.array(itineraryStopSchema).max(MAX_ITINERARY_STOPS).optional(),
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED']).optional(),
});

/**
 * Itinerary is merged into `details` rather than replacing it, so unrelated
 * fields such as duration survive an itinerary-only edit.
 */
function withItinerary(details: Record<string, unknown> | undefined, itinerary: z.infer<typeof itineraryStopSchema>[] | undefined) {
  if (!itinerary) return details;
  return { ...(details ?? {}), itinerary: serializeItinerary(itinerary) };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the package fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const data: Record<string, unknown> = {
    ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() || 'Untitled package' } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description.trim() } : {}),
    ...(parsed.data.listingIds !== undefined ? { listingIds: parsed.data.listingIds } : {}),
    ...(parsed.data.price !== undefined ? { price: Number(parsed.data.price) } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
  };

  // `details` is merged server-side so an itinerary-only edit can't wipe the
  // other keys admins rely on (duration, meal plan, and so on).
  if (parsed.data.details !== undefined || parsed.data.itinerary !== undefined) {
    const current = await db.package.findUnique({ where: { id: params.id }, select: { details: true } });
    if (!current) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
    const base = (current.details ?? {}) as Record<string, unknown>;
    data.details = withItinerary({ ...base, ...(parsed.data.details ?? {}) }, parsed.data.itinerary) as Prisma.InputJsonValue;
  }

  if (parsed.data.status === 'LIVE') {
    const existing = await db.package.findUnique({ where: { id: params.id }, select: { title: true, description: true, price: true, listingIds: true, details: true } });
    if (!existing) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
    const missing = packageLiveRequirements({ ...existing, ...data });
    if (missing.length) return NextResponse.json({ error: 'This package is not ready to publish.', missing, details: `Complete the pre-flight checklist: ${missing.join(', ')}.` }, { status: 422 });
  }

  const packageItem = await db.package.update({ where: { id: params.id }, data });
  await cacheDeletePrefix('packages:');
  return NextResponse.json(packageItem);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  await db.package.delete({ where: { id: params.id } });
  await cacheDeletePrefix('packages:');
  return NextResponse.json({ deleted: true });
}
