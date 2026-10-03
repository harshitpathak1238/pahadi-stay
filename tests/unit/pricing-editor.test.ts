import { describe, expect, it } from 'vitest';
import {
  copySeasonPrice,
  hasSeasonalOverride,
  readSeasonPrices,
  seasonPriceWarning,
  withPercentChange,
} from '@/lib/pricing-shared';

// These helpers back the admin pricing grid: reading rows into editable pairs,
// the bulk "% change" action, and the warnings shown next to a mis-set row.
describe('readSeasonPrices', () => {
  it('returns the stored rates as-is when set', () => {
    expect(readSeasonPrices({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 })).toEqual({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 });
  });

  it('seeds unset fields from the base price so no box reads as free', () => {
    expect(readSeasonPrices({ price: 3000 })).toEqual({ price: 3000, seasonPrice: 3000, offSeasonPrice: 3000 });
    expect(readSeasonPrices({ price: '2500' })).toEqual({ price: 2500, seasonPrice: 2500, offSeasonPrice: 2500 });
  });

  it('treats a stored zero as unset, matching what the site renders', () => {
    expect(readSeasonPrices({ price: 3000, seasonPrice: 0, offSeasonPrice: 0 })).toEqual({ price: 3000, seasonPrice: 3000, offSeasonPrice: 3000 });
  });
});

describe('hasSeasonalOverride', () => {
  it('is false when both rates equal the base price', () => {
    expect(hasSeasonalOverride({ price: 3000, seasonPrice: 3000, offSeasonPrice: 3000 })).toBe(false);
  });

  it('is true when either rate has moved', () => {
    expect(hasSeasonalOverride({ price: 3000, seasonPrice: 5000, offSeasonPrice: 3000 })).toBe(true);
    expect(hasSeasonalOverride({ price: 3000, seasonPrice: 3000, offSeasonPrice: 2000 })).toBe(true);
  });
});

describe('withPercentChange', () => {
  it('raises both seasonal rates and leaves the base price alone', () => {
    expect(withPercentChange({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 }, 10)).toEqual({ price: 3000, seasonPrice: 5500, offSeasonPrice: 2200 });
  });

  it('lowers both seasonal rates', () => {
    expect(withPercentChange({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 }, -10)).toEqual({ price: 3000, seasonPrice: 4500, offSeasonPrice: 1800 });
  });

  it('rounds to paise and never goes negative', () => {
    expect(withPercentChange({ price: 100, seasonPrice: 100, offSeasonPrice: 100 }, -150).offSeasonPrice).toBe(0);
    expect(withPercentChange({ price: 333, seasonPrice: 333, offSeasonPrice: 333 }, 10).seasonPrice).toBe(366.3);
  });

  it('is a no-op for a non-numeric percentage', () => {
    expect(withPercentChange({ price: 100, seasonPrice: 200, offSeasonPrice: 50 }, NaN)).toEqual({ price: 100, seasonPrice: 200, offSeasonPrice: 50 });
  });
});

describe('copySeasonPrice', () => {
  it('copies one rate onto the other', () => {
    expect(copySeasonPrice({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 }, 'seasonPrice', 'offSeasonPrice')).toEqual({ price: 3000, seasonPrice: 5000, offSeasonPrice: 5000 });
    expect(copySeasonPrice({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 }, 'offSeasonPrice', 'seasonPrice')).toEqual({ price: 3000, seasonPrice: 2000, offSeasonPrice: 2000 });
  });

  it('refuses to copy a zero or blank source, so a rate is never wiped', () => {
    const pair = { price: 3000, seasonPrice: 5000, offSeasonPrice: 0 };
    expect(copySeasonPrice(pair, 'offSeasonPrice', 'seasonPrice')).toBe(pair);
  });
});

describe('seasonPriceWarning', () => {
  it('flags a peak rate below the off-season rate', () => {
    expect(seasonPriceWarning({ price: 3000, seasonPrice: 1500, offSeasonPrice: 2000 })).toMatch(/Peak price is lower than the off-season/);
  });

  it('flags a peak rate below the base price', () => {
    expect(seasonPriceWarning({ price: 3000, seasonPrice: 2500, offSeasonPrice: 2000 })).toMatch(/Peak price is lower than the base/);
  });

  it('stays quiet for a normal peak/low spread', () => {
    expect(seasonPriceWarning({ price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 })).toBeNull();
  });

  it('stays quiet when a rate is unset', () => {
    expect(seasonPriceWarning({ price: 3000, seasonPrice: 0, offSeasonPrice: 2000 })).toBeNull();
  });
});