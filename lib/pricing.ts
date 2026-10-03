// Seasonal pricing: the global switch plus the read/write helpers that turn a
// stored price into the price a customer actually sees.
//
// Kept separate from `pricing-shared` (which is browser-safe) so the database
// and cache layers never leak into a client bundle.

import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { cached, cacheDeletePrefix } from '@/lib/cache';
import {
  DEFAULT_PRICING_MODE,
  normalisePricingMode,
  parseActiveCategories,
  showsPeakPrice,
  type PricingCategory,
  type PricingMode,
} from '@/lib/pricing-shared';

// Re-exported so server callers can `import { ... } from '@/lib/pricing'`.
export * from '@/lib/pricing-shared';

/**
 * Singleton row id. Int, matching the INTEGER primary key in the migration —
 * a string here makes Prisma fail to read the row back.
 */
const MODE_ID = 1;

/**
 * Cached for a short window because this sits in front of every catalogue read.
 *
 * The switch is read far more often than it is written, so caching it keeps
 * the public pages cheap; the TTL is deliberately short so a change made in the
 * admin is picked up quickly even if a cache purge is missed. Admin writes also
 * call `invalidatePricingCache` explicitly, which is the fast path.
 */
export async function getPricingMode(): Promise<PricingMode> {
  return cached('pricing:mode', 30, async () => {
    try {
      const row = await db.pricingMode.findUnique({ where: { id: MODE_ID } });
      return row ? normalisePricingMode(row) : DEFAULT_PRICING_MODE;
    } catch (error) {
      // A missing table (migration not applied yet) must not take the catalogue
      // down — the safe default simply shows every low rate.
      console.error('Pricing mode unavailable:', error);
      return DEFAULT_PRICING_MODE;
    }
  });
}

/**
 * Persist the switch.
 *
 * `activeCategories` is re-filtered here so the stored JSON can only ever hold
 * known category keys, whatever the request body contained.
 */
export async function savePricingMode(input: {
  peakModeEnabled: boolean;
  activeCategories: unknown;
  label?: unknown;
  note?: unknown;
  updatedBy?: string | null;
}): Promise<PricingMode> {
  const label = typeof input.label === 'string' && input.label.trim() ? input.label.trim().slice(0, 80) : DEFAULT_PRICING_MODE.label;
  const note = typeof input.note === 'string' && input.note.trim() ? input.note.trim().slice(0, 500) : '';
  const row = await db.pricingMode.upsert({
    where: { id: MODE_ID },
    create: {
      id: MODE_ID,
      peakModeEnabled: input.peakModeEnabled,
      activeCategories: parseActiveCategories(input.activeCategories) as unknown as Prisma.InputJsonValue,
      label,
      note,
      updatedBy: input.updatedBy ?? null,
    },
    update: {
      peakModeEnabled: input.peakModeEnabled,
      activeCategories: parseActiveCategories(input.activeCategories) as unknown as Prisma.InputJsonValue,
      label,
      note,
      updatedBy: input.updatedBy ?? null,
    },
  });
  await invalidatePricingCache();
  return normalisePricingMode(row);
}

/**
 * Drop every cached view that could still hold a stale price.
 *
 * This is the important part of the feature: catalogue reads are cached under
 * `listings:` and `rides:` and rendered into ISR pages. Flipping the switch
 * without purging them would leave guests seeing the old rate for minutes, so
 * the switch, the price editors and the existing listing/ride writers all
 * funnel through here.
 */
export async function invalidatePricingCache() {
  // The switch itself, then every price-bearing catalogue read.
  await cacheDeletePrefix('pricing:');
  await cacheDeletePrefix('listings:');
  await cacheDeletePrefix('rides:');
  // Package pages embed listing prices in their inclusions.
  await cacheDeletePrefix('packages:');
}

/**
 * Whether a category is currently quoting peak rates.
 * Thin wrapper so callers do not import two modules for one check.
 */
export async function isPeakCategory(category: string): Promise<boolean> {
  return showsPeakPrice(await getPricingMode(), category);
}

/** Narrowing helper for API bodies that carry a raw category list. */
export function toPricingCategories(value: unknown): PricingCategory[] {
  return parseActiveCategories(value);
}