import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const vehicleSchema = z.object({
  name: z.string().trim().max(120).default('Untitled vehicle type'),
  capacity: z.coerce.number().int().min(1).max(60).default(4),
  image: z.string().trim().max(500).optional().nullable().transform((value) => value || null),
  order: z.coerce.number().int().nonnegative().default(0),
});

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json(await db.vehicleType.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }));
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = vehicleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the vehicle type fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  try {
    const vehicle = await db.vehicleType.create({ data: parsed.data });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create this vehicle type.' }, { status: 500 });
  }
}