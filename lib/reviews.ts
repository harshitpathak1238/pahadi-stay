export const REVIEW_CATEGORIES = [
  { key: 'staff', label: 'Staff' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'comfort', label: 'Comfort' },
  { key: 'valueForMoney', label: 'Value for money' },
  { key: 'location', label: 'Location' },
] as const;

export type ReviewCategoryKey = (typeof REVIEW_CATEGORIES)[number]['key'];

export type CategoryScores = Partial<Record<ReviewCategoryKey, number | null | undefined>>;

const round1 = (value: number) => Math.round(value * 10) / 10;

// Option A: reviewers score 1-10 per category (matches the existing UI bars).
// overallRating is stored on the 1-5 scale used by the headline badge.
export function overallFromCategories(scores: CategoryScores): number | null {
  const values = REVIEW_CATEGORIES.map(({ key }) => scores[key]).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (!values.length) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length / 2);
}

// Band wording preserves the existing hardcoded "Wonderful" label scale.
export function bandFor(overall10: number): string {
  if (overall10 >= 9) return 'Wonderful';
  if (overall10 >= 8) return 'Very good';
  if (overall10 >= 7) return 'Good';
  if (overall10 >= 6) return 'Pleasant';
  return 'Fair';
}

export type ApprovedReview = {
  id: string;
  guestName: string;
  isVerified: boolean;
  comment: string;
  createdAt: string;
  overallRating: number;
  scores: CategoryScores;
};

export type ReviewStats = {
  count: number;
  overall5: number;
  overall10: number;
  label: string;
  categories: { key: ReviewCategoryKey; label: string; avg: number; count: number }[];
};

export function computeReviewStats(reviews: ApprovedReview[]): ReviewStats | null {
  if (!reviews.length) return null;
  const overall5 = round1(reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviews.length);
  const overall10 = round1(overall5 * 2);
  const categories = REVIEW_CATEGORIES.map(({ key, label }) => {
    const values = reviews
      .map((review) => review.scores[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return {
      key,
      label,
      avg: values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      count: values.length,
    };
  });
  return { count: reviews.length, overall5, overall10, label: bandFor(overall10), categories };
}

export function relativeTime(isoDate: string, now = Date.now()): string {
  const diffMs = now - new Date(isoDate).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export type StayReviewData = {
  listingId: string;
  slug: string;
  reviews: ApprovedReview[];
  stats: ReviewStats | null;
};

// Server-side only: fetches approved reviews + derived stats for a stay page.
// Never throws — a DB outage degrades to the static fallback instead of a 500.
export async function getStayReviewData(slug: string): Promise<StayReviewData | null> {
  try {
    const { db } = await import('@/lib/db');
    const listing = await db.listing.findFirst({ where: { slug, status: 'LIVE' }, select: { id: true, slug: true } });
    if (!listing) return null;
    const rows = await db.review.findMany({
      where: { listingId: listing.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const reviews: ApprovedReview[] = rows.map((row) => ({
      id: row.id,
      guestName: row.guestName || 'Guest',
      isVerified: row.isVerified,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      overallRating: row.overallRating,
      scores: {
        staff: row.staff,
        facilities: row.facilities,
        cleanliness: row.cleanliness,
        comfort: row.comfort,
        valueForMoney: row.valueForMoney,
        location: row.location,
      },
    }));
    return { listingId: listing.id, slug: listing.slug, reviews, stats: computeReviewStats(reviews) };
  } catch {
    return null;
  }
}
