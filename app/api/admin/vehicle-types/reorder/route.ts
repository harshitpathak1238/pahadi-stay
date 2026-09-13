import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const reorderSchema = z.object({
  vehicles: z.array(z.object({
    id: z.string().min(1),
    order: z.coerce.number().int().nonnegative(),
  })).min(1),
});

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  
  const parsed = reorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reorder data.', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updates = parsed.data.vehicles.map((vehicle) =>
      db.vehicleType.update({
        where: { id: vehicle.id },
        data: { order: vehicle.order },
      })
    );
    
    await db.$transaction(updates, { timeout: 10000 });
    
    return NextResponse.json({ success: true, updated: parsed.data.vehicles.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update vehicle order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
