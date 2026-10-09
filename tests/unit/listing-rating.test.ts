import { describe, expect, it } from 'vitest';
import { toListingRating } from '@/lib/listings-shared';

/**
 * The stay cards used to show a hardcoded 5.0 for every property because the
 * rating was seeded, not computed. `toListingRating` is the pure core of the
 * fix: it turns a real approved-review aggregate into the badge a card shows,
 * and returns null (→ "New") when there are no approved reviews yet.
 */
describe('listing rating from approved-review aggregate', () => {
  it('rounds the average to one decimal and carries the review count', () => {
    expect(toListingRating(4.75, 3)).toEqual({ rating: 4.8, count: 3 });
    expect(toListingRating(5, 1)).toEqual({ rating: 5, count: 1 });
  });

  it('reflects a low average instead of a fabricated 5.0', () => {
    expect(toListingRating(3.2, 12)?.rating).toBe(3.2);
  });

  it('returns null when there are no approved reviews so cards show "New"', () => {
    expect(toListingRating(5, 0)).toBeNull();
    expect(toListingRating(null, 0)).toBeNull();
  });

  it('treats a missing average as unrated', () => {
    expect(toListingRating(null, 4)).toBeNull();
  });

  it('ignores non-finite or negative inputs', () => {
    expect(toListingRating(Number.NaN, 2)).toBeNull();
    expect(toListingRating(-1, 2)).toBeNull();
    expect(toListingRating(4, -3)).toBeNull();
  });
});
