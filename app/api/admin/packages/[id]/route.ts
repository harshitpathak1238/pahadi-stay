import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const packageSchema = z.object({ title: z.string().trim().min(2).max(120).optional(), description: z.string().trim().min(10).optional(), listingIds: z.array(z.string()).optional(), price: z.coerce.number().nonnegative().optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the package fields and try again.' }, { status: 400 });
  return NextResponse.json(await db.package.update({ where: { id: params.id }, data: parsed.data }));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  await db.package.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
