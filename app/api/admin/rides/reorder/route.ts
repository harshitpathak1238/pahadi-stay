import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const reorderSchema = z.object({
  routes: z.array(z.object({
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
    const updates = parsed.data.routes.map((route) =>
      db.rideRoute.update({
        where: { id: route.id },
        data: { order: route.order },
      })
    );
    
    await db.$transaction(updates, { timeout: 10000 });
    revalidatePath('/rides');
    revalidatePath('/admin/rides');
    
    return NextResponse.json({ success: true, updated: parsed.data.routes.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update ride order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
