import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { sendTripNotification } from '@/lib/notifications';

/** Constant-time comparison so the token cannot be recovered byte by byte. */
function tokenMatches(expected: string | null | undefined, provided: unknown) {
  if (typeof provided !== 'string' || !expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request, { params }: { params: { id: string; bookingId: string } }) {
  const body = await request.json().catch(() => ({}));
  const booking = await db.booking.findFirst({ where: { id: params.bookingId, tripId: params.id }, include: { trip: { select: { cancelToken: true } } } });
  if (!booking) return NextResponse.json({ error: 'Trip item not found.' }, { status: 404 });

  // Authorisation is decided entirely on the server.
  //
  // Previously this only checked ownership *when a session happened to exist*,
  // so any anonymous caller could cancel any booking, and a client-supplied
  // `admin: true` in the body skipped the check altogether. Admin rights now
  // come from `requireAdmin()` — a real server-side session check — never from
  // the request body. Guests prove ownership with the per-trip cancel token
  // issued at checkout, because guest checkout has no account session.
  const isAdmin = Boolean(await requireAdmin());
  const session = await auth();
  const ownsBySession = Boolean(session?.user?.email) && booking.guestEmail.toLowerCase() === session!.user!.email.toLowerCase();
  const ownsByToken = tokenMatches(booking.trip?.cancelToken, body.cancelToken);

  if (!isAdmin && !ownsBySession && !ownsByToken) {
    return NextResponse.json({ error: 'You cannot cancel this trip item.' }, { status: 403 });
  }

  if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'This item is already cancelled.' }, { status: 409 });
  const hours = (new Date(booking.startDate || booking.checkIn).getTime() - Date.now()) / 3600000;
  const refundRate = hours >= 48 ? 1 : hours >= 24 ? 0.5 : 0;
  const refundAmount = Number(booking.priceAtBooking) * refundRate;
  const result = await db.$transaction(async (transaction) => { await transaction.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }); await transaction.pickupRequest.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED' } }); if (refundAmount) { const payment = await transaction.payment.findFirst({ where: { tripId: params.id, status: 'CAPTURED' } }); if (payment) await transaction.payment.update({ where: { id: payment.id }, data: { refundedAmount: { increment: refundAmount } } }); } return { refundAmount, refundRate }; });
  await sendTripNotification(params.id, 'CANCELLATION');
  return NextResponse.json({ cancelled: true, ...result });
}
