import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin, getAdminPartner } from '@/lib/admin';
import { sendTripNotification } from '@/lib/notifications';

const schema = z.object({ vehicleId: z.string().min(1) });
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json(await db.pickupRequest.findMany({ where: { status: 'UNASSIGNED' }, include: { booking: { include: { listing: { select: { title: true, location: true } }, trip: { select: { reference: true } } } } }, orderBy: { requestedTime: 'asc' } }));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: 'Choose a vehicle.' }, { status: 400 });
  const partner = await getAdminPartner(); const vehicle = await db.vehicle.findFirst({ where: { id: parsed.data.vehicleId, partnerId: partner.id, isActive: true } }); if (!vehicle) return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
  const pickup = await db.pickupRequest.update({ where: { id: params.id }, data: { assignedVehicleId: vehicle.id, status: 'ASSIGNED' }, include: { booking: { select: { tripId: true } } } });
  if (pickup.booking.tripId) await sendTripNotification(pickup.booking.tripId, 'VEHICLE_ASSIGNED'); return NextResponse.json(pickup);
}
