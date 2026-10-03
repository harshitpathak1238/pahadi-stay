import { describe, expect, it } from 'vitest';
import { MAX_FEATURED_PACKAGES, MAX_FEATURED_STAYS, MAX_FEATURED_STORIES } from '@/lib/home-limits';

/**
 * The home page teaser rails are intentionally short — the full catalogue lives
 * behind the "see all" links. These guard against a limit silently drifting back
 * to "show everything" when someone edits the slice call.
 */
describe('home page rail limits', () => {
  it('promotes at most 5 homestays', () => {
    expect(MAX_FEATURED_STAYS).toBe(5);
  });

  it('promotes at most 3 packages', () => {
    expect(MAX_FEATURED_PACKAGES).toBe(3);
  });

  it('keeps the journal rail longer than the fixed grids so it is worth scrolling', () => {
    expect(MAX_FEATURED_STORIES).toBeGreaterThan(MAX_FEATURED_STAYS);
    expect(MAX_FEATURED_STORIES).toBeGreaterThan(MAX_FEATURED_PACKAGES);
  });

  it('actually truncates a longer list', () => {
    const many = Array.from({ length: 20 }, (_, index) => index);
    expect(many.slice(0, MAX_FEATURED_STAYS)).toHaveLength(5);
    expect(many.slice(0, MAX_FEATURED_PACKAGES)).toHaveLength(3);
  });
});
