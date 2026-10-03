// Pure seasonal-pricing helpers shared by server code, admin client components
// and unit tests.
//
// This module deliberately has NO imports from Prisma, the database or the
// cache layer: the admin pricing screen is a client component, and importing
// `@/lib/db` would pull the Prisma engine into the browser bundle.
//
// The whole feature hangs off one idea: every priced thing carries an optional
// peak rate and an optional low rate. When the admin's global switch is off the
// low rate is shown, when it is on the peak rate is — and anything with no
// seasonal value set falls back to its normal selling price, so enabling this
// can never blank out or zero a price that used to render fine.

/** Categories that carry a customer-facing price and can be switched. */
export const PRICING_CATEGORIES = ['STAY', 'RIDE', 'RENTAL', 'ACTIVITY'] as const;

export type PricingCategory = (typeof PRICING_CATEGORIES)[number];

export const PRICING_CATEGORY_LABELS: Record<PricingCategory, string> = {
  STAY: 'Hotels & homestays',
  RIDE: 'Rides & sightseeing',
  RENTAL: 'Rentals',
  ACTIVITY: 'Activities',
};

export type PricingMode = {
  /** Master switch. Off = every category shows its low rate. */
  peakModeEnabled: boolean;
  /** Categories the switch currently applies to. Ignored while disabled. */
  activeCategories: PricingCategory[];
  /** Free-text name for the peak window, shown in the admin. */
  label: string;
  note: string;
};

/** Row shape shared by `Listing` (base) and `RideFare` (rides). */
export type SeasonablePrice = {
  price: unknown;
  seasonPrice?: unknown;
  offSeasonPrice?: unknown;
};

/** The switch applies to everything until an admin narrows it down. */
export const DEFAULT_ACTIVE_CATEGORIES: PricingCategory[] = [...PRICING_CATEGORIES];

/** Safe state used before the database has been read, and on read failure. */
export const DEFAULT_PRICING_MODE: PricingMode = {
  peakModeEnabled: false,
  activeCategories: [...DEFAULT_ACTIVE_CATEGORIES],
  label: 'Peak season',
  note: '',
};

export function isPricingCategory(value: unknown): value is PricingCategory {
  return typeof value === 'string' && (PRICING_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Coerce anything the database or an API body hands us into a usable number.
 *
 * MySQL `DECIMAL` arrives as a string through Prisma and JSON columns can hold
 * anything at all, so `Number()` alone is not enough — `NaN` must become 0.
 */
export function toPriceNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Drop unknown categories, duplicates and blanks from a stored category list.
 *
 * `activeCategories` is a JSON column a hand-edited row or an older build could
 * have filled with junk; filtering here lets the rest of the code trust the
 * result without re-checking at every call site.
 */
export function parseActiveCategories(value: unknown): PricingCategory[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return value.split(',').map((item) => item.trim().toUpperCase());
          }
        })()
      : [];
  const unique = new Set<PricingCategory>();
  for (const item of raw) if (isPricingCategory(item)) unique.add(item);
  // Keep the canonical order so the admin checkboxes never reshuffle.
  return PRICING_CATEGORIES.filter((category) => unique.has(category));
}
/**
 * The single price a customer should see for a category right now.
 *
 * Resolution order is deliberate:
 *   1. peak mode on for this category -> seasonPrice when set, else price
 *   2. otherwise                      -> offSeasonPrice when set, else price
 *
 * Falling back to the base price (rather than to the *other* seasonal value)
 * is what makes the feature safe to roll out: a listing nobody has configured
 * yet renders exactly the number it rendered before.
 */
export function resolveDisplayPrice(record: SeasonablePrice, mode: PricingMode, category: string): number {
  const base = toPriceNumber(record.price);
  if (showsPeakPrice(mode, category)) {
    const peak = toPriceNumber(record.seasonPrice);
    return peak > 0 ? peak : base;
  }
  const low = toPriceNumber(record.offSeasonPrice);
  return low > 0 ? low : base;
}

/**
 * The struck-through "was" price for a card, or null when it should be hidden.
 *
 * In peak mode the peak rate becomes the reference and the low rate is shown
 * struck through, so a guest can still see a cheaper rate exists and ask for it.
 * Outside peak mode nothing is struck through: the customer is already being
 * quoted the cheapest rate, and a higher "was" price would only advertise a
 * rate they cannot buy.
 */
export function resolveCompareAtPrice(record: SeasonablePrice, mode: PricingMode, category: string): number | null {
  if (!showsPeakPrice(mode, category)) return null;
  const peak = toPriceNumber(record.seasonPrice);
  const low = toPriceNumber(record.offSeasonPrice);
  return peak > 0 && low > 0 && low < peak ? peak : null;
}

/** Both numbers an admin needs for one row, normalised for the editor inputs. */
export type SeasonPricePair = {
  price: number;
  seasonPrice: number;
  offSeasonPrice: number;
};

export function readSeasonPrices(record: SeasonablePrice): SeasonPricePair {
  const price = toPriceNumber(record.price);
  const seasonPrice = toPriceNumber(record.seasonPrice);
  const offSeasonPrice = toPriceNumber(record.offSeasonPrice);
  // Seed an untouched field from the base price so the admin sees a sensible
  // starting number instead of a blank box they might misread as "free".
  return {
    price,
    seasonPrice: seasonPrice > 0 ? seasonPrice : price,
    offSeasonPrice: offSeasonPrice > 0 ? offSeasonPrice : price,
  };
}

/**
 * Apply a percentage change to the seasonal rates of a row.
 *
 * Used by the "raise/lower all by %" bulk action. `price` is deliberately left
 * alone: it is the fallback, not one of the two rates the switch moves between,
 * and rewriting it would quietly re-price every unconfigured listing too.
 */
export function withPercentChange(pair: SeasonPricePair, percent: number): SeasonPricePair {
  const factor = 1 + (Number.isFinite(percent) ? percent : 0) / 100;
  const round = (value: number) => Math.max(0, Math.round(value * factor * 100) / 100);
  return { price: pair.price, seasonPrice: round(pair.seasonPrice), offSeasonPrice: round(pair.offSeasonPrice) };
}

/**
 * Copy one rate onto the other.
 *
 * The common "same price year round" case, and the "make peak match low" case.
 * Blank or zero input on the source side is rejected so a mis-typed box cannot
 * wipe a rate that is already configured.
 */
export function copySeasonPrice(pair: SeasonPricePair, from: 'seasonPrice' | 'offSeasonPrice', to: 'seasonPrice' | 'offSeasonPrice'): SeasonPricePair {
  const source = pair[from];
  return source > 0 ? { ...pair, [to]: source } : pair;
}

/** True when either seasonal rate has actually diverged from the base price. */
export function hasSeasonalOverride(pair: SeasonPricePair): boolean {
  return pair.seasonPrice !== pair.price || pair.offSeasonPrice !== pair.price;
}

/**
 * Warning shown next to a row in the admin editor.
 *
 * Catches the two mistakes that would otherwise look fine on screen but behave
 * surprisingly on the site: a peak rate cheaper than the low rate, and a peak
 * rate cheaper than the base price the rest of the admin still edits.
 */
export function seasonPriceWarning(pair: SeasonPricePair): string | null {
  if (pair.seasonPrice > 0 && pair.offSeasonPrice > 0 && pair.seasonPrice < pair.offSeasonPrice) {
    return 'Peak price is lower than the off-season price.';
  }
  if (pair.seasonPrice > 0 && pair.price > 0 && pair.seasonPrice < pair.price) {
    return 'Peak price is lower than the base price.';
  }
  return null;
}

/** Normalise a `PricingMode` DB row (or any partial/untrusted object). */
export function normalisePricingMode(value: unknown): PricingMode {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const label = typeof row.label === 'string' && row.label.trim() ? row.label.trim().slice(0, 80) : DEFAULT_PRICING_MODE.label;
  const note = typeof row.note === 'string' ? row.note.trim().slice(0, 500) : '';
  // A missing key falls back to "everything", matching the column default: the
  // switch is off by default anyway, so this only matters for the admin's
  // checkbox rendering. An explicit empty array is honoured, because that is a
  // real admin choice ("apply to nothing").
  const activeCategories = row.activeCategories === undefined || row.activeCategories === null
    ? [...DEFAULT_ACTIVE_CATEGORIES]
    : parseActiveCategories(row.activeCategories);
  return {
    peakModeEnabled: Boolean(row.peakModeEnabled),
    activeCategories,
    label,
    note,
  };
}

/**
 * Whether a category should currently be showing its peak (max) price.
 *
 * The master switch wins over the category list: turning the switch off hides
 * peak prices everywhere, which is what "toggled back to min price" means.
 */
export function showsPeakPrice(mode: PricingMode, category: string): boolean {
  if (!mode.peakModeEnabled) return false;
  return isPricingCategory(category) && mode.activeCategories.includes(category);
}