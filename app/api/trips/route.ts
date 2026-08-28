import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { razorpay } from '@/lib/payments';
import { sendTripNotification } from '@/lib/notifications';

const itemSchema = z.object({ slug: z.string().min(1), category: z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']), startDate: z.coerce.date(), endDate: z.coerce.date().optional(), addons: z.array(z.enum(['PICKUP', 'RENTAL', 'ACTIVITY'])).default([]), pickup: z.object({ location: z.string().min(2), detail: z.string().trim().min(2).max(300), requestedTime: z.coerce.date(), lat: z.coerce.number().min(-90).max(90).nullable().optional(), lng: z.coerce.number().min(-180).max(180).nullable().optional() }).optional() }).superRefine((item, context) => { if (item.addons.includes('PICKUP') && !item.pickup) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Add pickup details before continuing.', path: ['pickup'] }); });
const tripSchema = z.object({ guestName: z.string().trim().min(2), guestEmail: z.string().email(), guestPhone: z.string().trim().min(10), guests: z.coerce.number().int().min(1).max(20), items: z.array(itemSchema).min(1) });

export async function POST(request: Request) {
  const parsed = tripSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check your guest details and trip items.', details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  try {
    const result = await db.$transaction(async (transaction) => {
      const listings = await transaction.listing.findMany({ where: { slug: { in: data.items.map((item) => item.slug) }, status: 'LIVE' } });
      const unavailable = data.items.filter((item) => !listings.some((listing) => listing.slug === item.slug));
      if (unavailable.length) throw new Error(`Unavailable: ${unavailable.map((item) => item.slug).join(', ')}`);
      for (const item of data.items) {
        const listing = listings.find((record) => record.slug === item.slug)!;
        const start = item.startDate;
        const end = item.endDate || item.startDate;
        const conflict = await transaction.booking.findFirst({ where: { listingId: listing.id, status: { not: 'CANCELLED' }, startDate: { lt: end }, endDate: { gt: start } }, select: { id: true } });
        if (conflict) throw new Error(`Unavailable dates: ${listing.title}`);
        const blocked = await transaction.availability.findFirst({ where: { listingId: listing.id, date: { gte: start, lte: end }, isAvailable: false }, select: { id: true } });
        if (blocked) throw new Error(`Unavailable dates: ${listing.title}`);
      }
      const user = await transaction.user.findUnique({ where: { email: data.guestEmail.toLowerCase() }, select: { id: true } });
      const reference = `KD-${Date.now().toString(36).toUpperCase()}`;
      const trip = await transaction.trip.create({ data: { reference, userId: user?.id, status: 'PENDING', expiresAt: new Date(Date.now() + 25 * 60 * 1000) } });
      let total = 0;
      for (const item of data.items) {
        const listing = listings.find((record) => record.slug === item.slug)!;
        const addonPrice = item.addons.reduce((sum, addon) => sum + ({ PICKUP: 800, RENTAL: 500, ACTIVITY: 750 }[addon] || 0), 0);
        const price = Number(listing.sellPrice) + addonPrice;
        total += price;
        const booking = await transaction.booking.create({ data: { tripId: trip.id, listingId: listing.id, category: listing.category, startDate: item.startDate, endDate: item.endDate || null, checkIn: item.startDate, checkOut: item.endDate || null, guests: data.guests, status: 'PENDING', priceAtBooking: price, totalPrice: price, commissionAmount: 0, guestName: data.guestName, guestEmail: data.guestEmail, guestPhone: data.guestPhone, metadata: { addons: item.addons } } });
        if (item.pickup) await transaction.pickupRequest.create({ data: { bookingId: booking.id, pickupLocationText: item.pickup.location, pickupLat: item.pickup.lat ?? null, pickupLng: item.pickup.lng ?? null, dropoffLocationText: item.pickup.detail, requestedTime: item.pickup.requestedTime, status: 'UNASSIGNED' } });
      }
      const payment = await transaction.payment.create({ data: { tripId: trip.id, amount: total, status: 'CREATED' } });
      return { tripId: trip.id, reference, paymentId: payment.id, amount: total };
    }, { isolationLevel: 'Serializable' });
    let orderId: string | null = null;
    try { const order = await razorpay().orders.create({ amount: Math.round(result.amount * 100), currency: 'INR', receipt: result.reference }); orderId = order.id; await db.payment.update({ where: { id: result.paymentId }, data: { razorpayOrderId: order.id } }); } catch { /* Payment can be configured after trip creation; the webhook remains authoritative. */ }
    return NextResponse.json({ ...result, orderId, keyId: process.env.RAZORPAY_KEY_ID || null }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create your trip.' }, { status: 409 }); }
}
