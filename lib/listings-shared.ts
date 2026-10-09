// Pure types, constants and parsers shared by server code and client components.
// This module deliberately imports nothing from Prisma, the database or the
// cache layer, so admin client components can use it without pulling
// server-only packages into the browser bundle.

export type PublicResult<T> = { data: T; degraded: boolean };

// A listing's star badge, derived purely from an aggregate of its approved
// reviews. `rating` is the average on the 1–5 scale; `count` is how many
// approved reviews back it.
export type ListingRating = { rating: number; count: number };

// Turn a DB aggregate (`_avg.overallRating`, `_count._all`) into the badge a
// card should show. Returns null when there are no approved reviews, so the
// caller shows "New" rather than a fabricated 5.0. Pure — no DB, safe to test.
export function toListingRating(avg: unknown, count: unknown): ListingRating | null {
  const reviews = Number(count);
  const average = Number(avg);
  if (!Number.isFinite(reviews) || reviews <= 0) return null;
  if (!Number.isFinite(average) || average <= 0) return null;
  return { rating: Math.round(average * 10) / 10, count: Math.trunc(reviews) };
}

export type ListingFaqItem = { question: string; answer: string };

export type HouseRule = { title: string; text: string };

export const DefaultHouseRules: HouseRule[] = [
  { title: 'Check-in & check-out', text: 'Check-in from 14:00. Check-out by 11:00.' },
  { title: 'Pets', text: 'No pets allowed.' },
  { title: 'Parties & events', text: 'No parties or events.' },
  { title: 'Smoking', text: 'No smoking indoors.' },
  { title: 'Quiet hours', text: 'Quiet hours between 22:00 and 07:00.' },
  { title: 'Extra guests', text: 'Guests may not bring extra people without prior approval.' },
];

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function faqs(value: unknown): ListingFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? '') }))
    .filter((item) => item.question.trim() && item.answer.trim());
}

export function parseHouseRules(value: unknown): HouseRule[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({ title: String(item.title ?? ''), text: String(item.text ?? '') }))
    .filter((item) => item.title.trim() && item.text.trim());
}

export function discountPercent(price: unknown, basePrice: unknown): number | null {
  const sell = Number(price);
  const base = Number(basePrice);
  if (!Number.isFinite(sell) || !Number.isFinite(base)) return null;
  if (sell <= 0 || base <= 0 || base <= sell) return null;
  const percent = Math.round((1 - sell / base) * 100);
  return percent > 0 && percent < 100 ? percent : null;
}