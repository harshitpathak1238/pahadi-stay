import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { packageLiveRequirements } from '@/lib/listing-requirements';

const packageSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().optional(),
  listingIds: z.array(z.string()).optional(),
  price: z.coerce.number().nonnegative().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED']).optional(),
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
    ...(parsed.data.details !== undefined ? { details: parsed.data.details } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
  };
  if (parsed.data.status === 'LIVE') {
    const existing = await db.package.findUnique({ where: { id: params.id }, select: { title: true, description: true, price: true, listingIds: true, details: true } });
    if (!existing) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
    const missing = packageLiveRequirements({ ...existing, ...data });
    if (missing.length) return NextResponse.json({ error: 'This package is not ready to publish.', missing, details: `Complete the pre-flight checklist: ${missing.join(', ')}.` }, { status: 422 });
  }
  return NextResponse.json(await db.package.update({ where: { id: params.id }, data }));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  await db.package.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
