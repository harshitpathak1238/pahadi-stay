import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const packageSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().optional(),
  listingIds: z.array(z.string()).default([]),
  price: z.coerce.number().nonnegative().optional().default(0),
});

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json(await db.package.findMany({ orderBy: { createdAt: 'desc' } }));
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the package fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const data = {
    title: parsed.data.title?.trim() || 'Untitled package',
    description: parsed.data.description?.trim() || '',
    listingIds: parsed.data.listingIds || [],
    price: Number(parsed.data.price ?? 0),
  };
  return NextResponse.json(await db.package.create({ data }), { status: 201 });
}
