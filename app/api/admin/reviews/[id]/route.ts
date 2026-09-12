import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { overallFromCategories } from '@/lib/reviews';
import { adminReviewUpdateSchema } from '@/lib/validations/review';

export const dynamic = 'force-dynamic';

async function touchStayPage(listingId: string) {
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { slug: true } });
  if (listing) revalidatePath(`/stays/${listing.slug}`);
}

// PATCH /api/admin/reviews/[id] — approve/reject or edit any field.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const existing = await db.review.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That review request was not valid JSON.' }, { status: 400 });
  }
  const parsed = adminReviewUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all review fields correctly.', details: parsed.error.flatten() }, { status: 422 });
  const data = parsed.data;
  if (data.listingId && data.listingId !== existing.listingId) {
    const listing = await db.listing.findUnique({ where: { id: data.listingId }, select: { id: true } });
    if (!listing) return NextResponse.json({ error: 'That stay was not found.' }, { status: 404 });
  }
  if (data.bookingId) {
    const booking = await db.booking.findFirst({ where: { id: data.bookingId, listingId: data.listingId ?? existing.listingId }, select: { id: true } });
    if (!booking) return NextResponse.json({ error: 'That booking does not belong to this stay.' }, { status: 422 });
  }
  // Recompute the headline score when categories change and no explicit
  // overall was sent — keeps badge math consistent (Option A).
  const categoriesTouched = [data.staff, data.facilities, data.cleanliness, data.comfort, data.valueForMoney, data.location].some(
    (value) => value !== undefined,
  );
  const merged = {
    staff: data.staff !== undefined ? data.staff : existing.staff,
    facilities: data.facilities !== undefined ? data.facilities : existing.facilities,
    cleanliness: data.cleanliness !== undefined ? data.cleanliness : existing.cleanliness,
    comfort: data.comfort !== undefined ? data.comfort : existing.comfort,
    valueForMoney: data.valueForMoney !== undefined ? data.valueForMoney : existing.valueForMoney,
    location: data.location !== undefined ? data.location : existing.location,
  };
  const review = await db.review.update({
    where: { id: params.id },
    data: {
      ...(data.listingId !== undefined ? { listingId: data.listingId } : {}),
      ...(data.guestName !== undefined ? { guestName: data.guestName.trim() } : {}),
      ...(data.guestEmail !== undefined ? { guestEmail: data.guestEmail } : {}),
      ...(data.comment !== undefined ? { comment: data.comment.trim() } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
      ...(data.bookingId !== undefined ? { bookingId: data.bookingId } : {}),
      ...(data.staff !== undefined ? { staff: data.staff } : {}),
      ...(data.facilities !== undefined ? { facilities: data.facilities } : {}),
      ...(data.cleanliness !== undefined ? { cleanliness: data.cleanliness } : {}),
      ...(data.comfort !== undefined ? { comfort: data.comfort } : {}),
      ...(data.valueForMoney !== undefined ? { valueForMoney: data.valueForMoney } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.overallRating !== undefined ? { overallRating: data.overallRating } : categoriesTouched ? { overallRating: overallFromCategories(merged) ?? existing.overallRating } : {}),
    },
  });
  await touchStayPage(review.listingId);
  return NextResponse.json(review);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const existing = await db.review.findUnique({ where: { id: params.id }, select: { id: true, listingId: true } });
  if (!existing) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  await db.review.delete({ where: { id: params.id } });
  await touchStayPage(existing.listingId);
  return NextResponse.json({ deleted: true });
}
