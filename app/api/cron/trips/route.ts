import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTripNotification } from '@/lib/notifications';

function authorized(request: Request) { return process.env.CRON_SECRET && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`; }

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const now = new Date(); const expired = await db.trip.findMany({ where: { status: 'PENDING', expiresAt: { lt: now } }, select: { id: true } });
  if (expired.length) await db.$transaction([db.booking.updateMany({ where: { tripId: { in: expired.map((trip) => trip.id) }, status: 'PENDING' }, data: { status: 'CANCELLED' } }), db.pickupRequest.updateMany({ where: { booking: { tripId: { in: expired.map((trip) => trip.id) } } }, data: { status: 'CANCELLED' } }), db.trip.updateMany({ where: { id: { in: expired.map((trip) => trip.id) } }, data: { status: 'CANCELLED' } })]);
  const reminders = await db.trip.findMany({ where: { status: 'CONFIRMED', reminderSentAt: null, bookings: { some: { startDate: { gte: new Date(now.getTime() + 23 * 3600000), lte: new Date(now.getTime() + 25 * 3600000) } } } }, select: { id: true } });
  for (const trip of reminders) { await sendTripNotification(trip.id, 'REMINDER_24H'); await db.trip.update({ where: { id: trip.id }, data: { reminderSentAt: now } }); }
  return NextResponse.json({ expired: expired.length, reminders: reminders.length });
}
