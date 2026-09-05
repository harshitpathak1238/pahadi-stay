import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const packageSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().optional(),
  listingIds: z.array(z.string()).optional(),
  price: z.coerce.number().nonnegative().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the package fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const data = {
    ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() || 'Untitled package' } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description.trim() } : {}),
    ...(parsed.data.listingIds !== undefined ? { listingIds: parsed.data.listingIds } : {}),
    ...(parsed.data.price !== undefined ? { price: Number(parsed.data.price) } : {}),
  };
  return NextResponse.json(await db.package.update({ where: { id: params.id }, data }));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  await db.package.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
