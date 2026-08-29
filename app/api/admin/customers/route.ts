import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const search = new URL(request.url).searchParams.get('search')?.trim();
  const users = await db.user.findMany({ where: { role: 'CUSTOMER', ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] } : {}) }, include: { bookings: { select: { totalPrice: true, createdAt: true } }, trips: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json(users.map((user) => ({ id: user.id, name: user.name || 'Unnamed guest', email: user.email || '', phone: user.phone || '', bookings: user.bookings.length, totalSpend: user.bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0), lastBooking: user.trips[0]?.createdAt || null, createdAt: user.createdAt })));
}