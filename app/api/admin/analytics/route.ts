import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const since = new Date(Date.now() - 30 * 86400000);
  const [categories, statuses, topListings, bookings] = await Promise.all([db.booking.groupBy({ by: ['category'], _count: { _all: true }, _sum: { totalPrice: true, commissionAmount: true }, where: { createdAt: { gte: since } } }), db.trip.groupBy({ by: ['status'], _count: { _all: true }, where: { createdAt: { gte: since } } }), db.listing.findMany({ include: { bookings: { where: { createdAt: { gte: since } }, select: { totalPrice: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }), db.booking.findMany({ where: { createdAt: { gte: since } }, select: { totalPrice: true, commissionAmount: true, createdAt: true } })]);
  const timeline = bookings.reduce<Record<string, { revenue: number; margin: number }>>((result, item) => { const key = item.createdAt.toISOString().slice(0, 10); result[key] ||= { revenue: 0, margin: 0 }; result[key].revenue += Number(item.totalPrice); result[key].margin += Number(item.commissionAmount); return result; }, {});
  return NextResponse.json({ timeline: Object.entries(timeline).map(([date, values]) => ({ date, ...values })), categories: categories.map((item) => ({ category: item.category, bookings: item._count._all, revenue: Number(item._sum.totalPrice || 0), margin: Number(item._sum.commissionAmount || 0) })), funnel: statuses.map((item) => ({ status: item.status, trips: item._count._all })), topListings: topListings.map((listing) => ({ id: listing.id, title: listing.title, bookings: listing.bookings.length, revenue: listing.bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0) })).sort((a, b) => b.revenue - a.revenue) });
}