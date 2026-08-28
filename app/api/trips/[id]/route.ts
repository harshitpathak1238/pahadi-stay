import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const trip = await db.trip.findUnique({ where: { id: params.id }, select: { status: true, reference: true, payments: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 } } });
  if (!trip) return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
  return NextResponse.json({ status: trip.status, paymentStatus: trip.payments[0]?.status || 'CREATED', reference: trip.reference });
}