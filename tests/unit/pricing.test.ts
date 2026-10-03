import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING_MODE,
  isPricingCategory,
  normalisePricingMode,
  parseActiveCategories,
  resolveCompareAtPrice,
  resolveDisplayPrice,
  showsPeakPrice,
  toPriceNumber,
  type PricingMode,
} from '@/lib/pricing-shared';

const off: PricingMode = { peakModeEnabled: false, activeCategories: ['STAY', 'RIDE', 'RENTAL', 'ACTIVITY'], label: 'Peak season', note: '' };
const on: PricingMode = { ...off, peakModeEnabled: true };

describe('toPriceNumber', () => {
  it('passes finite numbers through', () => {
    expect(toPriceNumber(4200)).toBe(4200);
    expect(toPriceNumber(0)).toBe(0);
  });

  it('parses the strings MySQL DECIMAL arrives as', () => {
    // Prisma returns DECIMAL columns as strings, not numbers.
    expect(toPriceNumber('4200.50')).toBe(4200.5);
    expect(toPriceNumber('  900  ')).toBe(900);
  });

  it('collapses junk to 0 instead of leaking NaN into a price', () => {
    expect(toPriceNumber(null)).toBe(0);
    expect(toPriceNumber(undefined)).toBe(0);
    expect(toPriceNumber('')).toBe(0);
    expect(toPriceNumber('   ')).toBe(0);
    expect(toPriceNumber('abc')).toBe(0);
    expect(toPriceNumber(NaN)).toBe(0);
    expect(toPriceNumber(Infinity)).toBe(0);
    expect(toPriceNumber({})).toBe(0);
  });
});

describe('isPricingCategory', () => {
  it('accepts the four real categories', () => {
    expect(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY'].every(isPricingCategory)).toBe(true);
  });

  it('rejects anything else, so a typo cannot become a switch target', () => {
    expect(isPricingCategory('PACKAGE')).toBe(false);
    expect(isPricingCategory('stay')).toBe(false);
    expect(isPricingCategory('')).toBe(false);
    expect(isPricingCategory(undefined)).toBe(false);
  });
});

describe('parseActiveCategories', () => {
  it('keeps every known category', () => {
    expect(parseActiveCategories(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY'])).toEqual(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']);
  });

  it('drops unknown keys, duplicates and blanks', () => {
    expect(parseActiveCategories(['STAY', 'STAY', 'PACKAGE', '', null, 'RIDE'])).toEqual(['STAY', 'RIDE']);
  });

  it('always returns categories in canonical order, never input order', () => {
    // The admin checkboxes must not reshuffle between saves.
    expect(parseActiveCategories(['ACTIVITY', 'STAY'])).toEqual(['STAY', 'ACTIVITY']);
  });

  it('parses a JSON string column and falls back to CSV', () => {
    expect(parseActiveCategories('["RENTAL","STAY"]')).toEqual(['STAY', 'RENTAL']);
    expect(parseActiveCategories('stay, ride')).toEqual(['STAY', 'RIDE']);
  });

  it('returns an empty list rather than throwing on junk', () => {
    expect(parseActiveCategories(null)).toEqual([]);
    expect(parseActiveCategories({ nope: true })).toEqual([]);
    expect(parseActiveCategories('not json at all')).toEqual([]);
  });
});

describe('normalisePricingMode', () => {
  it('fills sensible defaults for a missing or partial row', () => {
    const mode = normalisePricingMode({});
    expect(mode.peakModeEnabled).toBe(false);
    expect(mode.activeCategories).toEqual(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']);
    expect(mode.label).toBe('Peak season');
  });

  it('coerces a truthy switch and trims the label and note', () => {
    const mode = normalisePricingMode({ peakModeEnabled: 1, note: '  Diwali week  ', label: '  Diwali  ' });
    expect(mode.peakModeEnabled).toBe(true);
    expect(mode.note).toBe('Diwali week');
    expect(mode.label).toBe('Diwali');
  });

  it('survives a completely untrusted value', () => {
    expect(normalisePricingMode(null).peakModeEnabled).toBe(false);
    expect(normalisePricingMode('nonsense').activeCategories).toEqual(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']);
  });

  it('honours an explicitly empty category list as "apply to nothing"', () => {
    expect(normalisePricingMode({ activeCategories: [] }).activeCategories).toEqual([]);
  });

  it('drops unknown keys from a stored list rather than defaulting', () => {
    expect(normalisePricingMode({ activeCategories: ['PACKAGE'] }).activeCategories).toEqual([]);
  });

  it('defaults to off-season pricing', () => {
    expect(DEFAULT_PRICING_MODE.peakModeEnabled).toBe(false);
  });
});

describe('showsPeakPrice', () => {
  it('is false for everything while the master switch is off', () => {
    // This is the core "toggled back to min price" behaviour.
    expect(showsPeakPrice(off, 'STAY')).toBe(false);
    expect(showsPeakPrice(off, 'RIDE')).toBe(false);
    expect(showsPeakPrice(off, 'RENTAL')).toBe(false);
    expect(showsPeakPrice(off, 'ACTIVITY')).toBe(false);
  });

  it('is true only for ticked categories when the switch is on', () => {
    const narrow = { ...on, activeCategories: ['STAY', 'RENTAL'] } as PricingMode;
    expect(showsPeakPrice(narrow, 'STAY')).toBe(true);
    expect(showsPeakPrice(narrow, 'RENTAL')).toBe(true);
    expect(showsPeakPrice(narrow, 'RIDE')).toBe(false);
    expect(showsPeakPrice(narrow, 'ACTIVITY')).toBe(false);
  });

  it('is false for an unknown category even with everything ticked', () => {
    expect(showsPeakPrice(on, 'PACKAGE')).toBe(false);
    expect(showsPeakPrice(on, '')).toBe(false);
  });

  it('is false when the switch is on but nothing is ticked', () => {
    expect(showsPeakPrice({ ...on, activeCategories: [] }, 'STAY')).toBe(false);
  });
});
describe('resolveDisplayPrice', () => {
  const record = { price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 };

  it('shows the off-season price while the switch is off', () => {
    expect(resolveDisplayPrice(record, off, 'STAY')).toBe(2000);
  });

  it('shows the peak price once the switch is on', () => {
    expect(resolveDisplayPrice(record, on, 'STAY')).toBe(5000);
  });

  it('keeps showing the low rate for an unticked category', () => {
    const narrow = { ...on, activeCategories: ['RENTAL'] } as PricingMode;
    expect(resolveDisplayPrice(record, narrow, 'STAY')).toBe(2000);
    expect(resolveDisplayPrice(record, narrow, 'RENTAL')).toBe(5000);
  });

  it('falls back to the base price when no seasonal rate is set', () => {
    // The rollout guarantee: an unconfigured listing never renders 0 or blanks.
    expect(resolveDisplayPrice({ price: 3000 }, off, 'STAY')).toBe(3000);
    expect(resolveDisplayPrice({ price: 3000 }, on, 'STAY')).toBe(3000);
    expect(resolveDisplayPrice({ price: 3000, seasonPrice: null, offSeasonPrice: null }, on, 'STAY')).toBe(3000);
  });

  it('uses whichever seasonal rate is set, ignoring the unset one', () => {
    expect(resolveDisplayPrice({ price: 3000, seasonPrice: 5000 }, off, 'STAY')).toBe(3000);
    expect(resolveDisplayPrice({ price: 3000, seasonPrice: 5000 }, on, 'STAY')).toBe(5000);
    expect(resolveDisplayPrice({ price: 3000, offSeasonPrice: 2000 }, on, 'STAY')).toBe(3000);
    expect(resolveDisplayPrice({ price: 3000, offSeasonPrice: 2000 }, off, 'STAY')).toBe(2000);
  });

  it('treats a zero seasonal rate as unset rather than free', () => {
    expect(resolveDisplayPrice({ price: 3000, seasonPrice: 0, offSeasonPrice: 0 }, on, 'STAY')).toBe(3000);
  });

  it('handles decimal strings from MySQL', () => {
    expect(resolveDisplayPrice({ price: '3000.00', seasonPrice: '4500.50', offSeasonPrice: '2500.25' }, on, 'STAY')).toBe(4500.5);
    expect(resolveDisplayPrice({ price: '3000.00', seasonPrice: '4500.50', offSeasonPrice: '2500.25' }, off, 'STAY')).toBe(2500.25);
  });

  it('resolves every category independently', () => {
    for (const category of ['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']) {
      expect(resolveDisplayPrice(record, on, category)).toBe(5000);
      expect(resolveDisplayPrice(record, off, category)).toBe(2000);
    }
  });
});

describe('resolveCompareAtPrice', () => {
  const record = { price: 3000, seasonPrice: 5000, offSeasonPrice: 2000 };

  it('offers the peak rate as the reference only in peak mode', () => {
    expect(resolveCompareAtPrice(record, on, 'STAY')).toBe(5000);
  });

  it('never shows a compare-at price in off-season mode', () => {
    // The customer already has the cheapest rate; advertising a higher one they
    // cannot buy would be misleading.
    expect(resolveCompareAtPrice(record, off, 'STAY')).toBeNull();
  });

  it('is null when there is no genuine saving to advertise', () => {
    expect(resolveCompareAtPrice({ price: 3000, seasonPrice: 5000 }, on, 'STAY')).toBeNull();
    expect(resolveCompareAtPrice({ price: 3000, offSeasonPrice: 2000 }, on, 'STAY')).toBeNull();
    expect(resolveCompareAtPrice({ price: 3000, seasonPrice: 5000, offSeasonPrice: 5000 }, on, 'STAY')).toBeNull();
  });
});