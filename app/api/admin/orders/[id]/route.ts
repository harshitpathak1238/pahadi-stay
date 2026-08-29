import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
const actionSchema = z.object({ action: z.enum(['STATUS', 'CANCEL_ITEM']), status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(), bookingId: z.string().optional() });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const trip = await db.trip.findUnique({ where: { id: params.id }, include: { bookings: { include: { listing: true, pickupRequest: { include: { assignedVehicle: true } } } }, payments: { orderBy: { createdAt: 'desc' } } } });
  if (!trip) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order action.' }, { status: 400 });
  if (parsed.data.action === 'STATUS' && parsed.data.status) return NextResponse.json(await db.trip.update({ where: { id: params.id }, data: { status: parsed.data.status } }));
  if (!parsed.data.bookingId) return NextResponse.json({ error: 'Booking item is required.' }, { status: 400 });
  const booking = await db.booking.findFirst({ where: { id: parsed.data.bookingId, tripId: params.id } });
  if (!booking) return NextResponse.json({ error: 'Booking item not found.' }, { status: 404 });
  return NextResponse.json(await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }));
}
