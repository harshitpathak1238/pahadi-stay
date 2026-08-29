import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const search = params.get('search')?.trim();
  const status = params.get('status');
  const trips = await db.trip.findMany({
    where: {
      ...(status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status) ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' } : {}),
      ...(search ? { OR: [{ reference: { contains: search } }, { bookings: { some: { guestName: { contains: search } } } }, { bookings: { some: { guestEmail: { contains: search } } } }] } : {}),
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { bookings: { include: { listing: { select: { title: true, category: true } } } }, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return NextResponse.json(trips.map((trip) => ({ id: trip.id, reference: trip.reference, status: trip.status, createdAt: trip.createdAt, amount: Number(trip.payments[0]?.amount || 0), paymentStatus: trip.payments[0]?.status || 'CREATED', guestName: trip.bookings[0]?.guestName || 'Guest', guestEmail: trip.bookings[0]?.guestEmail || '', items: trip.bookings.length, listing: trip.bookings[0]?.listing.title || 'Multiple items', category: trip.bookings[0]?.listing.category || 'STAY' })));
}