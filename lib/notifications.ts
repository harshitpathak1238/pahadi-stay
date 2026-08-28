import { db } from '@/lib/db';

export type TripNotificationEvent = 'PAYMENT_SUCCESS' | 'VEHICLE_ASSIGNED' | 'REMINDER_24H' | 'CANCELLATION' | 'PAYMENT_FAILED';

export async function sendTripNotification(tripId: string, eventType: TripNotificationEvent) {
  const trip = await db.trip.findUnique({ where: { id: tripId }, include: { bookings: { include: { listing: true, pickupRequest: { include: { assignedVehicle: true } } } }, payments: true } });
  if (!trip) throw new Error('Trip not found.');
  const lines = trip.bookings.map((booking) => { const pickup = booking.pickupRequest; const vehicle = pickup?.assignedVehicle; return `${booking.listing.title} (${booking.category}): INR ${Number(booking.priceAtBooking).toLocaleString('en-IN')}${pickup ? `\nPickup: ${pickup.pickupLocationText} at ${pickup.requestedTime.toLocaleString('en-IN')}${vehicle ? `\nDriver: ${vehicle.driverName}, ${vehicle.driverPhone}, ${vehicle.registrationNumber}` : ''}` : ''}`; });
  const total = trip.bookings.reduce((sum, booking) => sum + Number(booking.priceAtBooking), 0);
  const message = `KainchiDarshan trip ${trip.reference}\n${lines.join('\n')}\nTotal: INR ${total.toLocaleString('en-IN')}` + (eventType === 'PAYMENT_FAILED' ? '\nPayment failed. Retry from your trip confirmation page.' : '');
  console.info(`[trip-notification:${eventType}]`, { recipient: trip.bookings[0]?.guestPhone, message });
  // Integration point: send WhatsApp Business via Interakt/Gupshup, then use email as backup.
  return { delivered: false, channel: 'stub', eventType, reference: trip.reference };
}
