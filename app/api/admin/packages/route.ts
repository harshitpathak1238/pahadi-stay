import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const packageSchema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().min(10), listingIds: z.array(z.string()).default([]), price: z.coerce.number().nonnegative() });

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json(await db.package.findMany({ orderBy: { createdAt: 'desc' } }));
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the package fields and try again.' }, { status: 400 });
  return NextResponse.json(await db.package.create({ data: parsed.data }), { status: 201 });
}
