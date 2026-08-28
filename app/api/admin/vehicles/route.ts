import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin, getAdminPartner } from '@/lib/admin';

const vehicleSchema = z.object({ type: z.string().trim().min(2), registrationNumber: z.string().trim().min(3), driverName: z.string().trim().min(2), driverPhone: z.string().trim().min(10), isActive: z.boolean().default(true) });

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const partner = await getAdminPartner();
  return NextResponse.json(await db.vehicle.findMany({ where: { partnerId: partner.id }, orderBy: { driverName: 'asc' } }));
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = vehicleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check vehicle and driver details.' }, { status: 400 });
  const partner = await getAdminPartner();
  return NextResponse.json(await db.vehicle.create({ data: { ...parsed.data, partnerId: partner.id } }), { status: 201 });
}
