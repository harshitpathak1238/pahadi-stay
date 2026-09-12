import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { overallFromCategories } from '@/lib/reviews';
import { getClientIp, publicReviewLimiter } from '@/lib/review-rate-limit';
import { publicReviewSchema } from '@/lib/validations/review';

export const dynamic = 'force-dynamic';

// POST /api/reviews — public, anonymous-with-basic-info. Always PENDING.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That review could not be read. Please try again.' }, { status: 400 });
  }
  const parsed = publicReviewSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Please complete the review form correctly.';
    return NextResponse.json({ error: first, details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  // Honeypot: silently accept so bots learn nothing, but store nothing.
  if (data.website && data.website.trim()) return NextResponse.json({ received: true }, { status: 201 });

  const ip = getClientIp(request);
  const limit = publicReviewLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'You have submitted several reviews recently. Please try again tomorrow.' },
      { status: 429, headers: limit.retryAfterSec ? { 'Retry-After': String(limit.retryAfterSec) } : undefined },
    );
  }

  const listing = await db.listing.findUnique({ where: { id: data.listingId }, select: { id: true, status: true } });
  if (!listing || listing.status !== 'LIVE') return NextResponse.json({ error: 'That stay is not available for reviews.' }, { status: 404 });

  const overall = overallFromCategories(data);
  if (overall === null) return NextResponse.json({ error: 'Please rate at least one category.' }, { status: 422 });

  // Auto "Verified guest" check: same email (or same name) on a real
  // CONFIRMED/COMPLETED booking for this listing. Public submissions have no
  // login, so the check is email-first, name as fallback — admin can override.
  let bookingId: string | null = null;
  let isVerified = false;
  try {
    const match = await db.booking.findFirst({
      where: {
        listingId: listing.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        OR: [
          ...(data.guestEmail ? [{ guestEmail: data.guestEmail.toLowerCase() }] : []),
          { guestName: { equals: data.guestName.trim() } },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (match) {
      bookingId = match.id;
      isVerified = true;
    }
  } catch {
    // Verification is best-effort; a lookup failure must not block submission.
  }

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
      status: 'PENDING',
      isVerified,
      bookingId,
    },
    select: { id: true },
  });
  // No revalidatePath here — pending reviews stay invisible until approved.
  return NextResponse.json({ received: true, id: review.id }, { status: 201 });
}
