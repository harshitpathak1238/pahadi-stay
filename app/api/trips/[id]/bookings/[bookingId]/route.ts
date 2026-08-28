import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendTripNotification } from '@/lib/notifications';

export async function POST(request: Request, { params }: { params: { id: string; bookingId: string } }) {
  const session = await auth(); const body = await request.json().catch(() => ({}));
  const booking = await db.booking.findFirst({ where: { id: params.bookingId, tripId: params.id }, include: { trip: true } });
  if (!booking) return NextResponse.json({ error: 'Trip item not found.' }, { status: 404 });
  if (session?.user?.email && booking.guestEmail.toLowerCase() !== session.user.email.toLowerCase() && !body.admin) return NextResponse.json({ error: 'You cannot cancel this trip item.' }, { status: 403 });
  if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'This item is already cancelled.' }, { status: 409 });
  const hours = (new Date(booking.startDate || booking.checkIn).getTime() - Date.now()) / 3600000;
  const refundRate = hours >= 48 ? 1 : hours >= 24 ? 0.5 : 0;
  const refundAmount = Number(booking.priceAtBooking) * refundRate;
  const result = await db.$transaction(async (transaction) => { await transaction.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }); await transaction.pickupRequest.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED' } }); if (refundAmount) { const payment = await transaction.payment.findFirst({ where: { tripId: params.id, status: 'CAPTURED' } }); if (payment) await transaction.payment.update({ where: { id: payment.id }, data: { refundedAmount: { increment: refundAmount } } }); } return { refundAmount, refundRate }; });
  await sendTripNotification(params.id, 'CANCELLATION');
  return NextResponse.json({ cancelled: true, ...result });
}
