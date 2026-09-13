import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const vehicleSchema = z.object({
  name: z.string().trim().max(120).optional(),
  capacity: z.coerce.number().int().min(1).max(60).optional(),
  image: z.string().trim().max(500).optional().nullable().transform((value) => value || null),
  order: z.coerce.number().int().nonnegative().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = vehicleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the vehicle type fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const existing = await db.vehicleType.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Vehicle type not found.' }, { status: 404 });
  try {
    const vehicle = await db.vehicleType.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update this vehicle type.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const existing = await db.vehicleType.findUnique({ where: { id: params.id }, select: { _count: { select: { fares: true } } } });
  if (!existing) return NextResponse.json({ error: 'Vehicle type not found.' }, { status: 404 });
  if (existing._count.fares > 0) {
    return NextResponse.json({ error: `This vehicle type is used in ${existing._count.fares} ride pricing row${existing._count.fares === 1 ? '' : 's'}. Update those routes first or rename the vehicle instead of deleting it.` }, { status: 409 });
  }
  await db.vehicleType.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}