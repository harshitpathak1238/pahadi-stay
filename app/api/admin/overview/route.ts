import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const money = (value: unknown) => Number(value || 0);

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [bookings, revenue, previousRevenue, pendingPickups, pendingPartners, failedPayments, recentOrders, categoryGroups, dailyRevenue] = await Promise.all([
      db.booking.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'CAPTURED', createdAt: { gte: since } } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'CAPTURED', createdAt: { gte: new Date(since.getTime() - 30 * 86400000), lt: since } } }),
      db.pickupRequest.count({ where: { status: 'UNASSIGNED' } }),
      db.partner.count({ where: { verificationStatus: 'PENDING' } }),
      db.payment.count({ where: { status: 'FAILED', createdAt: { gte: since } } }),
      db.trip.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { bookings: { include: { listing: { select: { title: true, category: true } } } }, payments: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      db.booking.groupBy({ by: ['category'], _count: { _all: true }, where: { createdAt: { gte: since } } }),
      db.payment.findMany({ where: { status: 'CAPTURED', createdAt: { gte: since } }, select: { amount: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    const revenueByDay = dailyRevenue.reduce<Record<string, number>>((result, item) => {
      const key = item.createdAt.toISOString().slice(0, 10);
      result[key] = (result[key] || 0) + money(item.amount);
      return result;
    }, {});

    return NextResponse.json({
      stats: { bookings, revenue: money(revenue._sum.amount), previousRevenue: money(previousRevenue._sum.amount), pendingPickups, pendingPartners, failedPayments },
      categoryBreakdown: categoryGroups.map((item) => ({ category: item.category, count: item._count._all })),
      revenueByDay,
      recentOrders: recentOrders.map((trip) => ({ id: trip.id, reference: trip.reference, status: trip.status, createdAt: trip.createdAt, amount: money(trip.payments[0]?.amount), guestName: trip.bookings[0]?.guestName || 'Guest', items: trip.bookings.length, listing: trip.bookings[0]?.listing.title || 'Multiple items' })),
    });
  } catch (error) {
    console.error('Admin overview unavailable:', error);
    return NextResponse.json({ degraded: true, stats: { bookings: 0, revenue: 0, previousRevenue: 0, pendingPickups: 0, pendingPartners: 0, failedPayments: 0 }, categoryBreakdown: [], revenueByDay: {}, recentOrders: [] });
  }
}