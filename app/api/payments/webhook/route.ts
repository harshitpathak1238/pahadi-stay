import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTripNotification } from '@/lib/notifications';

export async function POST(request: Request) {
	const signature = request.headers.get('x-razorpay-signature'); const body = await request.text();
	if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 });
	const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
	const signatureBuffer = Buffer.from(signature); const expectedBuffer = Buffer.from(expected);
	if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
	const event = JSON.parse(body) as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
	const paymentEntity = event.payload?.payment?.entity; const orderId = paymentEntity?.order_id;
	if (!orderId) return NextResponse.json({ received: true });
	const payment = await db.payment.findFirst({ where: { razorpayOrderId: orderId } });
	if (!payment) return NextResponse.json({ received: true });
	const succeeded = event.event === 'payment.captured' || event.event === 'order.paid';
	const failed = event.event === 'payment.failed';
	if (succeeded && payment.status !== 'CAPTURED') { await db.$transaction([db.payment.update({ where: { id: payment.id }, data: { status: 'CAPTURED', razorpayPaymentId: paymentEntity?.id } }), db.trip.update({ where: { id: payment.tripId }, data: { status: 'CONFIRMED', confirmedAt: new Date() } }), db.booking.updateMany({ where: { tripId: payment.tripId, status: 'PENDING' }, data: { status: 'CONFIRMED' } })]); await sendTripNotification(payment.tripId, 'PAYMENT_SUCCESS'); }
	if (failed) { await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } }); await sendTripNotification(payment.tripId, 'PAYMENT_FAILED'); }
	return NextResponse.json({ received: true });
}
