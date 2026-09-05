import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { packageLiveRequirements } from '@/lib/listing-requirements';

const packageSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().optional(),
  listingIds: z.array(z.string()).default([]),
  price: z.coerce.number().nonnegative().optional().default(0),
  details: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED']).default('DRAFT'),
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
    details: parsed.data.details,
    status: parsed.data.status,
  };
  const missing = parsed.data.status === 'LIVE' ? packageLiveRequirements(data) : [];
  if (missing.length) return NextResponse.json({ error: 'This package is not ready to publish.', missing, details: `Complete the pre-flight checklist: ${missing.join(', ')}.` }, { status: 422 });
  return NextResponse.json(await db.package.create({ data }), { status: 201 });
}
