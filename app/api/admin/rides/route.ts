import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { slugifyRideTitle } from '@/lib/rides';

const stopSchema = z.object({ label: z.string().trim().max(120).default(''), note: z.string().trim().max(300).optional().default('') });
const fareSchema = z.object({ vehicleTypeId: z.string().trim().min(1), price: z.coerce.number().nonnegative() });
const optionalNumber = z.preprocess((value) => value === '' || value === null || value === undefined ? null : value, z.coerce.number().nonnegative().nullable().optional());

const optionalString = z.string().trim().max(160).nullable().optional().transform((value) => (typeof value === 'string' && value.length > 0 ? value : null));

const rideSchema = z.object({
  slug: z.string().trim().max(160).default(''),
  title: z.string().trim().max(120).default('Untitled ride'),
  type: z.enum(['SIGHTSEEING', 'TRANSFER']).default('SIGHTSEEING'),
  description: z.string().trim().default(''),
  fromLocation: optionalString,
  toLocation: optionalString,
  distanceKm: optionalNumber,
  durationDays: optionalNumber,
  images: z.array(z.string().trim().max(500)).default([]),
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED']).default('DRAFT'),
  order: z.coerce.number().int().nonnegative().default(0),
  stops: z.array(stopSchema).max(30).default([]),
  fares: z.array(fareSchema).max(60).default([]),
});

// One row per vehicle; a duplicate vehicleTypeId resolves to the last price.
const dedupeFares = (fares: { vehicleTypeId: string; price: number }[]) => {
  const unique = new Map<string, { vehicleTypeId: string; price: number }>();
  fares.forEach((fare) => unique.set(fare.vehicleTypeId, fare));
  return [...unique.values()];
};

const orderedStops = (stops: { label: string; note: string }[]) =>
  stops.map((stop, index) => ({ label: stop.label, note: stop.note?.trim() || null, order: index })).filter((stop) => stop.label || stop.note);

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  const status = params.get('status');
  const search = params.get('search')?.trim();
  const routes = await db.rideRoute.findMany({
    where: {
      ...(type && type !== 'ALL' ? { type: type as 'SIGHTSEEING' | 'TRANSFER' } : {}),
      ...(status && status !== 'ALL' ? { status: status as 'DRAFT' | 'LIVE' | 'PAUSED' } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }, { fromLocation: { contains: search } }, { toLocation: { contains: search } }] } : {}),
    },
    include: {
      stops: { orderBy: { order: 'asc' } },
      fares: { include: { vehicleType: true }, orderBy: { vehicleType: { order: 'asc' } } },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = rideSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the route fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const fares = dedupeFares(parsed.data.fares).filter((fare) => Number.isFinite(fare.price) && fare.price > 0);
  try {
    const slug = parsed.data.slug || slugifyRideTitle(parsed.data.title) || `ride-${Date.now()}`;
    const { distanceKm, durationDays, stops, fares: fareData, ...fields } = parsed.data;
    const route = await db.rideRoute.create({
      data: {
        ...fields,
        slug,
        ...(distanceKm !== undefined ? { distanceKm } : {}),
        ...(durationDays !== undefined ? { durationDays } : {}),
        stops: { create: orderedStops(stops || []) },
        fares: { create: fares.map((fare) => ({ vehicleTypeId: fare.vehicleTypeId, price: fare.price })) },
      },
    });
    revalidatePath('/rides');
    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('P2002') ? 'That slug is already in use.' : error instanceof Error ? error.message : 'Could not create this ride route.';
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes('P2002') ? 409 : 500 });
  }
}
