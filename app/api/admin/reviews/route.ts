import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { overallFromCategories } from '@/lib/reviews';
import { adminReviewSchema } from '@/lib/validations/review';

export const dynamic = 'force-dynamic';

async function touchStayPage(listingId: string) {
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { slug: true } });
  if (listing) revalidatePath(`/stays/${listing.slug}`);
}

// GET /api/admin/reviews?listingId=&status= — moderation queue (PENDING first).
export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const listingId = params.get('listingId')?.trim();
  const status = params.get('status')?.trim().toUpperCase();
  const reviews = await db.review.findMany({
    where: {
      ...(listingId ? { listingId } : {}),
      ...(status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: { listing: { select: { id: true, title: true, slug: true } } },
  });
  const listings = await db.listing.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' }, take: 500 });
  return NextResponse.json({ reviews, listings });
}

// POST /api/admin/reviews — manual creation (offline/WhatsApp testimonials,
// migrated quotes). Created as APPROVED by default so it shows immediately.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That review request was not valid JSON.' }, { status: 400 });
  }
  const parsed = adminReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all review fields correctly.', details: parsed.error.flatten() }, { status: 422 });
  const data = parsed.data;
  if (!data.listingId) return NextResponse.json({ error: 'Choose the stay this review belongs to.' }, { status: 422 });
  const listing = await db.listing.findUnique({ where: { id: data.listingId }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: 'That stay was not found.' }, { status: 404 });

  const overall = data.overallRating ?? overallFromCategories(data) ?? 5;
  const review = await db.review.create({
    data: {
      listingId: listing.id,
      guestName: data.guestName.trim(),
      guestEmail: data.guestEmail,
      overallRating: overall,
      staff: data.staff ?? null,
      facilities: data.facilities ?? null,
      cleanliness: data.cleanliness ?? null,
      comfort: data.comfort ?? null,
      valueForMoney: data.valueForMoney ?? null,
      location: data.location ?? null,
      comment: data.comment.trim(),
      status: data.status ?? 'APPROVED',
      isVerified: data.isVerified ?? false,
      bookingId: data.bookingId,
    },
  });
  await touchStayPage(listing.id);
  return NextResponse.json(review, { status: 201 });
}
