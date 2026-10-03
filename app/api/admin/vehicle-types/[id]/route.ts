import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const vehicleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  capacity: z.coerce.number().int().min(1).max(60),
  image: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Authorisation is per-handler, not middleware: the middleware matcher
  // deliberately excludes `/api`, so an unguarded handler here would be
  // reachable by anyone on the internet.
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const body = await req.json();
    const parse = vehicleSchema.safeParse(body);
    if (!parse.success) {
            return NextResponse.json({ error: 'Check the vehicle type fields and try again.', details: parse.error.flatten() }, { status: 400 });
    }
    const { name, capacity, image } = parse.data;
    const updated = await db.vehicleType.update({
      where: { id: params.id },
      data: { name, capacity, image },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating vehicle type:', error);
    return NextResponse.json({ error: 'Failed to update vehicle type' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    await db.vehicleType.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Vehicle type deleted' });
  } catch (error) {
    console.error('Error deleting vehicle type:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle type' }, { status: 500 });
  }
}
