import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const pickups = await db.pickupRequest.findMany({
    where: { status: 'UNASSIGNED' },
    include: { booking: { include: { listing: { select: { title: true, location: true } }, trip: { select: { reference: true } } } } },
    orderBy: { requestedTime: 'asc' },
  });
  return NextResponse.json(pickups);
}
