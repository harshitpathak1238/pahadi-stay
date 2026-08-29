import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const partners = await db.partner.findMany({ include: { listings: { include: { bookings: { where: { status: 'COMPLETED' }, select: { totalPrice: true, commissionAmount: true } } } }, user: { select: { name: true, email: true } } }, orderBy: { businessName: 'asc' } });
  return NextResponse.json(partners.map((partner) => { const bookings = partner.listings.flatMap((listing) => listing.bookings); const gross = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0); const commission = bookings.reduce((sum, booking) => sum + Number(booking.commissionAmount), 0); return { id: partner.id, partner: partner.businessName, contact: partner.user.name || partner.user.email || '', bookings: bookings.length, gross, commission, payable: gross - commission, status: bookings.length ? 'PENDING' : 'NO_ACTIVITY' }; }));
}