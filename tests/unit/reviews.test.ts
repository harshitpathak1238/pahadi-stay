import { describe, expect, it } from 'vitest';
import { bandFor, computeReviewStats, overallFromCategories } from '@/lib/reviews';
import { publicReviewSchema } from '@/lib/validations/review';
import { ReviewRateLimiter } from '@/lib/review-rate-limit';

const review = (overallRating: number, scores = {}) => ({
  id: 'r1',
  guestName: 'Priya',
  isVerified: false,
  comment: 'Lovely stay with a great view and warm hosts.',
  createdAt: new Date().toISOString(),
  overallRating,
  scores: { staff: 9, facilities: 8, cleanliness: 9, comfort: 8, valueForMoney: 8, location: 9, ...scores },
});

describe('review rating math (Option A)', () => {
  it('averages 1-10 category scores onto the 1-5 headline scale', () => {
    expect(overallFromCategories({ staff: 9, cleanliness: 8 })).toBe(4.3);
    expect(overallFromCategories({})).toBeNull();
  });

  it('derives headline badge + per-category averages from approved reviews only', () => {
    const stats = computeReviewStats([review(4.5), review(5)]);
    expect(stats?.overall5).toBe(4.8);
    expect(stats?.count).toBe(2);
    expect(stats?.categories.find((c) => c.key === 'staff')?.avg).toBe(9);
  });

  it('returns null stats for zero reviews so the UI shows the empty state', () => {
    expect(computeReviewStats([])).toBeNull();
  });

  it('preserves the existing Wonderful band scale', () => {
    expect(bandFor(9.2)).toBe('Wonderful');
    expect(bandFor(8.4)).toBe('Very good');
    expect(bandFor(7.1)).toBe('Good');
  });
});

describe('public review validation', () => {
  it('rejects empty comments and out-of-range ratings', () => {
    expect(publicReviewSchema.safeParse({ listingId: 'x', guestName: 'A', comment: 'short', staff: 4 }).success).toBe(false);
    expect(publicReviewSchema.safeParse({ listingId: 'x', guestName: 'Priya', comment: 'This stay was wonderful and very clean.', staff: 11 }).success).toBe(false);
  });

  it('requires at least one category score', () => {
    const parsed = publicReviewSchema.safeParse({ listingId: 'x', guestName: 'Priya', comment: 'This stay was wonderful and very clean.' });
    expect(parsed.success).toBe(false);
  });

  it('accepts a valid anonymous-with-basic-info submission', () => {
    const parsed = publicReviewSchema.safeParse({ listingId: 'x', guestName: 'Priya Sharma', guestEmail: 'p@example.com', comment: 'This stay was wonderful and very clean.', staff: 9, website: '' });
    expect(parsed.success).toBe(true);
  });
});

describe('public review rate limit', () => {
  it('blocks the 4th submission per IP per day', () => {
    const limiter = new ReviewRateLimiter(3, 24 * 60 * 60 * 1000);
    expect([limiter.check('1.2.3.4'), limiter.check('1.2.3.4'), limiter.check('1.2.3.4')].every((r) => r.allowed)).toBe(true);
    expect(limiter.check('1.2.3.4').allowed).toBe(false);
    expect(limiter.check('9.9.9.9').allowed).toBe(true);
  });
});
