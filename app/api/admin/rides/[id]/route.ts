import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const stopSchema = z.object({ label: z.string().trim().max(120).default(''), note: z.string().trim().max(300).optional().default('') });
const fareSchema = z.object({ vehicleTypeId: z.string().trim().min(1), price: z.coerce.number().nonnegative() });
const optionalNumber = z.preprocess((value) => value === '' || value === null ? null : value, z.coerce.number().nonnegative().nullable().optional());

const rideSchema = z.object({
  slug: z.string().trim().max(160).optional(),
  title: z.string().trim().max(120).optional(),
  type: z.enum(['SIGHTSEEING', 'TRANSFER']).optional(),
  description: z.string().trim().optional(),
  fromLocation: z.string().trim().max(160).optional().transform((value) => value || null),
  toLocation: z.string().trim().max(160).optional().transform((value) => value || null),
  distanceKm: optionalNumber,
  durationMinutes: optionalNumber.transform((value) => value == null ? null : Math.round(value)),
  images: z.array(z.string().trim().max(500)).optional(),
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED']).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  stops: z.array(stopSchema).max(30).optional(),
  fares: z.array(fareSchema).max(60).optional(),
});

const dedupeFares = (fares: { vehicleTypeId: string; price: number }[]) => {
  const unique = new Map<string, { vehicleTypeId: string; price: number }>();
  fares.forEach((fare) => unique.set(fare.vehicleTypeId, fare));
  return [...unique.values()];
};

const orderedStops = (stops: { label: string; note: string }[]) =>
  stops.map((stop, index) => ({ label: stop.label, note: stop.note?.trim() || null, order: index })).filter((stop) => stop.label || stop.note);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const route = await db.rideRoute.findUnique({
    where: { id: params.id },
    include: {
      stops: { orderBy: { order: 'asc' } },
      fares: { include: { vehicleType: true }, orderBy: { vehicleType: { order: 'asc' } } },
    },
  });
  if (!route) return NextResponse.json({ error: 'Ride route not found.' }, { status: 404 });
  return NextResponse.json(route);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = rideSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the route fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const existing = await db.rideRoute.findUnique({ where: { id: params.id }, select: { id: true, slug: true } });
  if (!existing) return NextResponse.json({ error: 'Ride route not found.' }, { status: 404 });
  try {
    const route = await db.$transaction(async (tx) => {
      const { stops, fares, distanceKm, durationMinutes, ...fields } = parsed.data;
      const updated = await tx.rideRoute.update({
        where: { id: params.id },
        data: {
          ...fields,
          ...(distanceKm !== undefined ? { distanceKm } : {}),
          ...(durationMinutes !== undefined ? { durationMinutes } : {}),
        },
      });
      if (stops !== undefined) {
        await tx.rideStop.deleteMany({ where: { rideRouteId: params.id } });
        if (stops.length) await tx.rideStop.createMany({ data: orderedStops(stops).map((stop) => ({ ...stop, rideRouteId: params.id })) });
      }
      if (fares !== undefined) {
        const priced = dedupeFares(fares).filter((fare) => Number.isFinite(fare.price) && fare.price > 0);
        await tx.rideFare.deleteMany({ where: { rideRouteId: params.id } });
        if (priced.length) await tx.rideFare.createMany({ data: priced.map((fare) => ({ ...fare, rideRouteId: params.id })) });
      }
      return tx.rideRoute.findUnique({
        where: { id: params.id },
        include: {
          stops: { orderBy: { order: 'asc' } },
          fares: { include: { vehicleType: true }, orderBy: { vehicleType: { order: 'asc' } } },
        },
      });
    });
    try {
      revalidatePath('/rides');
      if (route?.slug && route.slug !== existing.slug) revalidatePath(`/rides/${existing.slug}`);
      if (route?.slug) revalidatePath(`/rides/${route.slug}`);
    } catch {
      /* revalidation is best-effort outside a request lifecycle */
    }
    return NextResponse.json(route);
  } catch (error) {
    const duplicate = error instanceof Error && error.message.includes('P2002');
    return NextResponse.json({ error: duplicate ? 'That slug is already in use.' : error instanceof Error ? error.message : 'Could not update this ride route.' }, { status: duplicate ? 409 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const existing = await db.rideRoute.findUnique({ where: { id: params.id }, select: { slug: true } });
  if (!existing) return NextResponse.json({ error: 'Ride route not found.' }, { status: 404 });
  await db.rideRoute.delete({ where: { id: params.id } });
  try {
    revalidatePath('/rides');
    revalidatePath(`/rides/${existing.slug}`);
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
  return NextResponse.json({ deleted: true });
}