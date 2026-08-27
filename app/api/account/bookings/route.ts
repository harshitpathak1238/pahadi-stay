import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  const bookings = await db.booking.findMany({ where: { userId: user.id }, include: { listing: { select: { title: true, slug: true, category: true, location: true } }, payment: { select: { status: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(bookings);
}
