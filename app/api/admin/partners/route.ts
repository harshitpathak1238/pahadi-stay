import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const search = new URL(request.url).searchParams.get('search')?.trim();
  const partners = await db.partner.findMany({ where: search ? { OR: [{ businessName: { contains: search } }, { user: { name: { contains: search } } }] } : undefined, include: { user: { select: { name: true, email: true } }, listings: { select: { id: true, status: true } }, vehicles: { select: { id: true, isActive: true } } }, orderBy: { businessName: 'asc' }, take: 100 });
  return NextResponse.json(partners.map((partner) => ({ id: partner.id, businessName: partner.businessName, contact: partner.user.name || partner.user.email || '', category: partner.category, verificationStatus: partner.verificationStatus, activeListings: partner.listings.filter((listing) => listing.status === 'LIVE').length, totalListings: partner.listings.length, vehicles: partner.vehicles.filter((vehicle) => vehicle.isActive).length })));
}